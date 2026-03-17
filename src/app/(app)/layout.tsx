import { Sidebar } from "@/components/common/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1200px] px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
