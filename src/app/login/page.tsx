"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { login } from "@/lib/auth-actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
      </div>
      {state?.error && <p className="copy text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary mt-2 w-full">
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      kicker="Welcome back"
      title="Log in"
      italic="to the workshop."
      lede="Plain-English classifiers, on Jev."
      footer={
        <p className="copy text-ink-mute">
          No account?{" "}
          <Link href="/signup" className="text-ink underline decoration-copper/50 underline-offset-4">
            Sign up
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="copy text-ink-mute">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
