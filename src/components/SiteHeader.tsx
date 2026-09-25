import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Logo />
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/login" className="btn btn-ghost no-underline">
          Log in
        </Link>
        <Link href="/signup" className="btn btn-primary no-underline">
          Sign up
        </Link>
      </nav>
    </header>
  );
}
