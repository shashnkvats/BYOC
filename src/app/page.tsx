import Link from "next/link";

const TEMPLATES = [
  {
    name: "Guardrail",
    blurb:
      "Keep a chatbot on-topic and safe - e.g. block a shopping assistant from writing code or recipes.",
  },
  {
    name: "Agent / skill routing",
    blurb: "Pick which specialist agent or skill should handle a request.",
  },
  {
    name: "MCP / tool selection",
    blurb: "Choose which tool should run next out of a dynamic tool list.",
  },
  {
    name: "Model routing",
    blurb: "Route a request to a fast/cheap model or a powerful one.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <span className="text-lg font-semibold">BYOC</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/login" className="text-gray-600 hover:text-black">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-black px-3 py-1.5 font-medium text-white"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Build Your Own Classifier
        </h1>
        <p className="max-w-xl text-lg text-gray-600">
          Describe a constraint or routing decision in plain English. BYOC turns it into
          a <span className="font-medium text-black">Jev</span>-backed classifier
          endpoint you can call from your own chatbot or agent - for guardrails, skill
          routing, or picking the right MCP tool.
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium"
          >
            Log in
          </Link>
        </div>

        <div className="mt-12 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div key={t.name} className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium">{t.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{t.blurb}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
