"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { resendSignupEmail } from "@/lib/auth-actions";

const RESEND_COOLDOWN_MS = 30_000;

export function SignupConfirmation({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const cooldownUntil = useRef(0);

  async function handleResend() {
    if (status === "sending" || Date.now() < cooldownUntil.current) return;
    setStatus("sending");
    setError(null);
    const result = await resendSignupEmail(email);
    if (result.error) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    cooldownUntil.current = Date.now() + RESEND_COOLDOWN_MS;
    setStatus("sent");
    window.setTimeout(() => {
      setStatus("idle");
    }, RESEND_COOLDOWN_MS);
  }

  const resendLocked = status === "sending" || Date.now() < cooldownUntil.current;

  return (
    <div className="flex flex-col items-start">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full bg-moss-soft text-moss"
        aria-hidden="true"
      >
        <Check size={18} strokeWidth={2.25} />
      </span>

      <h2 className="display-card mt-5">Check your email</h2>
      <p className="mt-2 text-[0.95rem] leading-6 text-ink-mute">We sent a confirmation link to</p>
      <p className="mt-2 break-all text-[1.05rem] font-medium tracking-[-0.015em] text-ink">
        {email}
      </p>
      <p className="mt-3 text-[0.95rem] leading-6 text-ink-mute">
        Click the link in the email to activate your BYOC account.
      </p>

      <a href="mailto:" className="btn btn-copper mt-6 w-full no-underline">
        Open email app
      </a>

      <p className="mt-5 text-[0.92rem] leading-6 text-ink-mute">
        {status === "sent" ? (
          <span className="text-ink">Confirmation email sent</span>
        ) : (
          <>
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLocked}
              className="border-0 bg-transparent p-0 font-medium text-copper disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Resend email"}
            </button>
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-6 text-[0.92rem] leading-6 text-ink-mute">
        Already confirmed?{" "}
        <Link
          href="/login"
          className="text-ink underline decoration-copper/50 underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
