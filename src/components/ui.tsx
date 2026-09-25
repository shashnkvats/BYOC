import Link from "next/link";

export function StatusBadge({
  status,
}: {
  status: "draft" | "published" | "needs_review" | "confident";
}) {
  const styles = {
    draft: "badge-draft",
    published: "badge-live",
    needs_review: "badge-review",
    confident: "badge-live",
  } as const;
  const labels = {
    draft: "Draft",
    published: "Live",
    needs_review: "Needs review",
    confident: "Confident",
  } as const;
  return <span className={styles[status]}>{labels[status]}</span>;
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <p className="kicker">{children}</p>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card mt-8 border-dashed px-8 py-14 text-center">
      <p className="display-section text-ink">{title}</p>
      <p className="copy mx-auto mt-2 max-w-sm text-ink-mute">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ClassifierSubnav({
  id,
  current,
}: {
  id: string;
  current: "edit" | "playground" | "deploy" | "logs";
}) {
  const items = [
    { href: `/classifiers/${id}/edit`, key: "edit", label: "Editor" },
    { href: `/classifiers/${id}/playground`, key: "playground", label: "Playground" },
    { href: `/classifiers/${id}/deploy`, key: "deploy", label: "Deploy" },
    { href: `/classifiers/${id}/logs`, key: "logs", label: "Logs" },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-1 rounded-full border border-line bg-paper-raised/80 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={
            current === item.key
              ? "rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium leading-none text-paper no-underline"
              : "rounded-full px-3.5 py-1.5 text-xs font-medium leading-none text-ink-mute no-underline hover:text-ink"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
