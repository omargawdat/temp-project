"use client";

import { useState } from "react";
import { Sidebar } from "@/components/common/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-teal-500">
        Skip to content
      </a>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main id="main-content" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
