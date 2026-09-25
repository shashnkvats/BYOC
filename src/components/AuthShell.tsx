import { SiteHeader } from "./SiteHeader";

export function AuthShell({
  kicker,
  title,
  italic,
  lede,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  italic: string;
  lede: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="hidden max-w-md flex-1 lg:block">
          <p className="kicker">On Jev · System One</p>
          <h2 className="display-section mt-3">
            A decision,
            <br />
            <span className="font-editorial text-copper">not a prompt.</span>
          </h2>
          <p className="lede mt-4 text-ink-mute">
            Guardrails, routing, and tool selection — hosted as an endpoint you can
            call before a generative model ever gets involved.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-ink text-paper">
            <div className="border-b border-white/10 px-5 py-3 text-[0.7rem] uppercase tracking-[0.16em] text-paper/55">
              Sample classification
            </div>
            <pre className="tech-output px-5 py-4 text-paper/90">
{`is_out_of_scope   true    0.88
is_harmful        false   0.94`}
            </pre>
          </div>
        </div>

        <div className="w-full max-w-md">
          <p className="kicker">{kicker}</p>
          <h1 className="display-page mt-3">
            {title}
            <br />
            <span className="font-editorial text-copper">{italic}</span>
          </h1>
          <p className="lede mt-3 text-ink-mute">{lede}</p>
          <div className="card mt-8 p-7 sm:p-8">{children}</div>
          <div className="mt-6">{footer}</div>
        </div>
      </main>
    </div>
  );
}
