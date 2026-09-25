"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { signup } from "@/lib/auth-actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <AuthShell
      kicker="New workshop"
      title="Create your"
      italic="account."
      lede="Build a classifier in the afternoon. Call it from your agent the same day."
      footer={
        <p className="copy text-ink-mute">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline decoration-copper/50 underline-offset-4">
            Log in
          </Link>
        </p>
      }
    >
      <form action={action} className="flex flex-col gap-4">
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
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
        </div>
        {state?.error && <p className="copy text-danger">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-copper mt-2 w-full">
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
