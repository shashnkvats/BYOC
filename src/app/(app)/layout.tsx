import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppNav />
      <main className="flex-1 px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
