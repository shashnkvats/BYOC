import Link from "next/link";

export function NewClassifierButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/classifiers/new"
      aria-label="New classifier"
      className={`btn btn-copper btn-icon no-underline ${className}`}
    >
      +
    </Link>
  );
}
