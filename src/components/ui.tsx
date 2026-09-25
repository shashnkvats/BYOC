import Link from "next/link";

export function StatusBadge({
  status,
}: {
  status: "draft" | "published" | "needs_review" | "confident";
}) {
  const styles = {
    draft: "badge-draft",
    published: "badge-live",
    needs_review: "badge-review",
    confident: "badge-live",
  } as const;
  const labels = {
    draft: "Draft",
    published: "Live",
    needs_review: "Needs review",
    confident: "Confident",
  } as const;
  return (
    <span className={styles[status]}>
      <span className="status-dot" aria-hidden="true" />
      {labels[status]}
    </span>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card mt-8 border-dashed px-8 py-14 text-center">
      <p className="display-section text-ink">{title}</p>
      <p className="copy mx-auto mt-2 max-w-sm text-ink-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ClassifierSubnav({
  id,
  current,
}: {
  id: string;
  current: "edit" | "playground" | "deploy" | "logs";
}) {
  const items = [
    { href: `/classifiers/${id}/edit`, key: "edit", label: "Editor" },
    { href: `/classifiers/${id}/playground`, key: "playground", label: "Playground" },
    { href: `/classifiers/${id}/deploy`, key: "deploy", label: "Deploy" },
    { href: `/classifiers/${id}/logs`, key: "logs", label: "Logs" },
  ] as const;

  return (
    <nav className="flex w-fit shrink-0 flex-nowrap items-center gap-1 rounded-full border border-line bg-paper-raised/80 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={
            current === item.key
              ? "whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium leading-none text-paper no-underline"
              : "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium leading-none text-ink-mute no-underline hover:text-ink"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function ClassifierPageHeader({
  id,
  current,
  kicker,
  title,
  subtitle,
  meta,
}: {
  id: string;
  current: "edit" | "playground" | "deploy" | "logs";
  kicker: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="kicker">{kicker}</p>
        <ClassifierSubnav id={id} current={current} />
      </div>
      <div className="min-w-0">
        <h1 className="display-page">{title}</h1>
        {subtitle && <p className="copy mt-1.5 text-ink-mute">{subtitle}</p>}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-3">{meta}</div>
        )}
      </div>
    </div>
  );
}
