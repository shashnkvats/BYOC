import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      <AppNav />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
