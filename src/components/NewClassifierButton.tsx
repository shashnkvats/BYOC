import Link from "next/link";
import { Plus } from "lucide-react";

export function NewClassifierButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/classifiers/new"
      className={`btn btn-copper no-underline text-[14px] font-semibold shadow-none ${className}`}
    >
      <Plus size={16} strokeWidth={2} aria-hidden="true" />
      New classifier
    </Link>
  );
}
