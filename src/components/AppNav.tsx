"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";
import { useSession } from "@/lib/use-session";

export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-semibold">
          BYOC
        </Link>
        <nav className="flex gap-4 text-sm text-gray-600">
          <Link
            href="/dashboard"
            className={pathname === "/dashboard" ? "font-medium text-black" : ""}
          >
            Classifiers
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        {user?.email && <span>{user.email}</span>}
        <form action={logout}>
          <button type="submit" className="underline">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
