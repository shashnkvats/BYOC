"use client";

import { logout } from "@/lib/auth-actions";
import { useSession } from "@/lib/use-session";
import { Logo } from "./Logo";

export function AppNav() {
  const { user } = useSession();
  const initial = user?.email?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 px-5 py-3 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-3 text-sm">
          {user?.email && (
            <span
              aria-label={user.email}
              title={user.email}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-raised font-medium text-ink"
            >
              {initial}
            </span>
          )}
          <form action={logout}>
            <button type="submit" className="btn btn-ghost px-3 py-1.5 text-xs">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
