import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TEMPLATE_META, TemplateIcon } from "@/lib/templates";

const TEMPLATES = [
  { type: "guardrail" as const, ...TEMPLATE_META.guardrail },
  { type: "agent_routing" as const, ...TEMPLATE_META.agent_routing },
  { type: "mcp_tool_routing" as const, ...TEMPLATE_META.mcp_tool_routing },
  { type: "model_routing" as const, ...TEMPLATE_META.model_routing },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-20 pt-10 sm:px-10">
        <p className="kicker">On Jev · System One</p>
        <h1 className="display-hero mt-4 max-w-3xl text-ink">
          Build a classifier
          <br />
          <span className="font-editorial text-copper">the old-fashioned way.</span>
        </h1>
        <p className="lede mt-6 max-w-xl text-ink-mute">
          Describe a constraint or a routing decision in plain English. BYOC turns it
          into a hosted endpoint — yes/no, pick-one, or a score — that your chatbot or
          agent can call before a generative model ever gets involved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-copper no-underline">
            Get started
          </Link>
          <Link href="/login" className="btn btn-ghost no-underline">
            I already have an account
          </Link>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-line bg-ink text-paper">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[0.7rem] uppercase tracking-[0.16em] text-paper/55">
            <span>A shopping assistant, asked to write Python</span>
            <span className="font-mono font-normal normal-case tracking-[0.02em] text-copper-soft">
              needs_review · false
            </span>
          </div>
          <pre className="tech-output overflow-x-auto px-5 py-4 text-paper/90">
{`is_out_of_scope   true    0.88
is_harmful        false   0.94`}
          </pre>
        </div>

        <section className="mt-16">
          <p className="kicker">Four ways in</p>
          <h2 className="display-section mt-2">Start from a decision, not a prompt.</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <div key={t.label} className="card p-5">
                <p className="text-copper">
                  <TemplateIcon type={t.type} />
                </p>
                <h3 className="display-card mt-2">{t.label}</h3>
                <p className="copy mt-1 text-ink-mute">{t.blurb}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
