"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, FolderKanban, Receipt, StickyNote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ClientForm } from "@/components/common/client-form";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";
import type { Client } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";

interface ClientFloatingActionsProps {
  client: Serialized<Client>;
  countries: { id: string; name: string; code: string; flag: string }[];
  notesCount?: number;
}

export function ClientFloatingActions({ client, countries, notesCount = 0 }: ClientFloatingActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const actions: FloatingAction[] = [
    { icon: FolderKanban, label: "Projects", onClick: () => scrollToSection("projects-section") },
    { icon: Receipt, label: "Invoices", onClick: () => scrollToSection("invoices-section") },
    { icon: StickyNote, label: "Notes", onClick: () => scrollToSection("notes-section"), badge: notesCount },
    { icon: Pencil, label: "Edit", onClick: () => setEditOpen(true), variant: "accent" },
  ];

  return (
    <>
      {!editOpen && <FloatingActionBar actions={actions} />}

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
