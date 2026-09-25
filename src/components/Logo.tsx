import Link from "next/link";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="3" className="fill-paper stroke-ink" strokeWidth="1.5" />
      <path
        d="M8 22V10h4.2c2.6 0 4.2 1.4 4.2 3.6 0 1.5-.8 2.6-2.1 3.1 1.6.5 2.6 1.8 2.6 3.5 0 2.4-1.8 3.8-4.6 3.8H8Zm3.2-7.1h1c1.2 0 1.9-.6 1.9-1.6s-.7-1.5-1.9-1.5h-1v3.1Zm0 2.4v2.8h1.2c1.3 0 2.1-.6 2.1-1.5 0-.9-.8-1.3-2.1-1.3H11.2Z"
        className="fill-ink"
      />
      <circle cx="24.2" cy="8.2" r="2.1" className="fill-copper" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 no-underline">
      <Mark className="h-8 w-8 shrink-0" />
      {!compact && (
        <span className="font-display text-[1.35rem] leading-none text-ink">
          BYOC
        </span>
      )}
    </Link>
  );
}
