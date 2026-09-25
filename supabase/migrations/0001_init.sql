-- BYOC initial schema: classifiers, questions, settings, api keys, logs

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- classifiers
-- ---------------------------------------------------------------------------
create table if not exists public.classifiers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  template_type text not null default 'custom'
    check (template_type in ('guardrail','agent_routing','mcp_tool_routing','model_routing','custom')),
  jev_model_version text not null default 'jev-latest',
  status text not null default 'draft'
    check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists classifiers_owner_id_idx on public.classifiers (owner_id);

-- ---------------------------------------------------------------------------
-- classifier_questions
-- ---------------------------------------------------------------------------
create table if not exists public.classifier_questions (
  id uuid primary key default gen_random_uuid(),
  classifier_id uuid not null references public.classifiers(id) on delete cascade,
  key text not null,
  type text not null check (type in ('choice','score','noul')),
  instructions text not null,
  -- choice/noul: {"option_key": "description", ...}
  -- score: ["Level 0 label", "Level 1 label", ...] (ordered)
  criteria jsonb not null default '{}'::jsonb,
  confidence_threshold numeric not null default 0.6 check (confidence_threshold >= 0 and confidence_threshold <= 1),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classifier_id, key)
);

create index if not exists classifier_questions_classifier_id_idx on public.classifier_questions (classifier_id);

-- ---------------------------------------------------------------------------
-- classifier_settings (1:1 with classifiers)
-- ---------------------------------------------------------------------------
create table if not exists public.classifier_settings (
  classifier_id uuid primary key references public.classifiers(id) on delete cascade,
  below_threshold_action text not null default 'return_as_is'
    check (below_threshold_action in ('return_as_is','flag_for_review')),
  notes text
);

-- ---------------------------------------------------------------------------
-- api_keys
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  classifier_id uuid not null references public.classifiers(id) on delete cascade,
  hashed_key text not null unique,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_classifier_id_idx on public.api_keys (classifier_id);

-- ---------------------------------------------------------------------------
-- classification_logs
-- ---------------------------------------------------------------------------
create table if not exists public.classification_logs (
  id uuid primary key default gen_random_uuid(),
  classifier_id uuid not null references public.classifiers(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  state_excerpt text,
  answers jsonb,
  needs_review boolean not null default false,
  latency_ms int,
  jev_model_version_used text,
  created_at timestamptz not null default now()
);

create index if not exists classification_logs_classifier_id_idx on public.classification_logs (classifier_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists classifiers_set_updated_at on public.classifiers;
create trigger classifiers_set_updated_at
  before update on public.classifiers
  for each row execute function public.set_updated_at();

drop trigger if exists classifier_questions_set_updated_at on public.classifier_questions;
create trigger classifier_questions_set_updated_at
  before update on public.classifier_questions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.classifiers enable row level security;
alter table public.classifier_questions enable row level security;
alter table public.classifier_settings enable row level security;
alter table public.api_keys enable row level security;
alter table public.classification_logs enable row level security;

create policy "owners manage their classifiers"
  on public.classifiers for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners manage their questions"
  on public.classifier_questions for all
  using (exists (select 1 from public.classifiers c where c.id = classifier_questions.classifier_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.classifiers c where c.id = classifier_questions.classifier_id and c.owner_id = auth.uid()));

create policy "owners manage their settings"
  on public.classifier_settings for all
  using (exists (select 1 from public.classifiers c where c.id = classifier_settings.classifier_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.classifiers c where c.id = classifier_settings.classifier_id and c.owner_id = auth.uid()));

create policy "owners manage their api keys"
  on public.api_keys for all
  using (exists (select 1 from public.classifiers c where c.id = api_keys.classifier_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.classifiers c where c.id = api_keys.classifier_id and c.owner_id = auth.uid()));

create policy "owners read their logs"
  on public.classification_logs for select
  using (exists (select 1 from public.classifiers c where c.id = classification_logs.classifier_id and c.owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- security-definer RPCs used by the public runtime endpoint.
-- These let the server look up a classifier by hashed API key and write a
-- log entry using only the anon/publishable key (no service-role secret
-- needed), while still being unreachable for arbitrary table access because
-- RLS above blocks anon SELECT on these tables directly.
-- ---------------------------------------------------------------------------
create or replace function public.load_classifier_by_key(p_hashed_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key record;
  v_classifier record;
  v_result jsonb;
begin
  select * into v_key from public.api_keys
    where hashed_key = p_hashed_key and revoked_at is null
    limit 1;

  if v_key is null then
    return null;
  end if;

  select * into v_classifier from public.classifiers
    where id = v_key.classifier_id and status = 'published'
    limit 1;

  if v_classifier is null then
    return null;
  end if;

  update public.api_keys set last_used_at = now() where id = v_key.id;

  select jsonb_build_object(
    'api_key_id', v_key.id,
    'classifier_id', v_classifier.id,
    'classifier_name', v_classifier.name,
    'jev_model_version', v_classifier.jev_model_version,
    'below_threshold_action', coalesce((select s.below_threshold_action from public.classifier_settings s where s.classifier_id = v_classifier.id), 'return_as_is'),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', q.key,
        'type', q.type,
        'instructions', q.instructions,
        'criteria', q.criteria,
        'confidence_threshold', q.confidence_threshold
      ) order by q.position)
      from public.classifier_questions q
      where q.classifier_id = v_classifier.id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.record_classification_log(
  p_classifier_id uuid,
  p_api_key_id uuid,
  p_state_excerpt text,
  p_answers jsonb,
  p_needs_review boolean,
  p_latency_ms int,
  p_jev_model_version_used text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.classification_logs (
    classifier_id, api_key_id, state_excerpt, answers, needs_review, latency_ms, jev_model_version_used
  ) values (
    p_classifier_id, p_api_key_id, p_state_excerpt, p_answers, p_needs_review, p_latency_ms, p_jev_model_version_used
  );
end;
$$;

revoke all on function public.load_classifier_by_key(text) from public;
grant execute on function public.load_classifier_by_key(text) to anon, authenticated;

revoke all on function public.record_classification_log(uuid, uuid, text, jsonb, boolean, int, text) from public;
grant execute on function public.record_classification_log(uuid, uuid, text, jsonb, boolean, int, text) to anon, authenticated;
