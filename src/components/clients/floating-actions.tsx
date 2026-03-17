"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, FolderKanban, Receipt, StickyNote } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ClientForm } from "@/components/common/client-form";
import type { Client } from "@prisma/client";

interface ClientFloatingActionsProps {
  client: Client;
  countries: { id: string; name: string; code: string; flag: string }[];
  notesCount?: number;
}

export function ClientFloatingActions({ client, countries, notesCount = 0 }: ClientFloatingActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.12] bg-[#131d2e]/95 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(45,212,191,0.08)] backdrop-blur-2xl ring-1 ring-white/[0.06]">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-teal-400/80 transition-all hover:bg-teal-500/10 hover:text-teal-400"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <Divider />

          <button
            onClick={() => scrollTo("projects-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <FolderKanban className="h-4 w-4" />
            <span>Projects</span>
          </button>

          <Divider />

          <button
            onClick={() => scrollTo("invoices-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Receipt className="h-4 w-4" />
            <span>Invoices</span>
          </button>

          <Divider />

          <button
            onClick={() => scrollTo("notes-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <StickyNote className="h-4 w-4" />
            <span>Notes</span>
            {notesCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teal-500/20 px-1 text-[10px] font-bold tabular-nums text-teal-400">
                {notesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
            <SheetDescription>Update client details</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 pt-6">
            <ClientForm
              client={client}
              countries={countries}
              onSuccess={() => { setEditOpen(false); router.refresh(); }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-white/[0.06]" />;
}
