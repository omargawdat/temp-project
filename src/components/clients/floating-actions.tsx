"use client";

import { FolderKanban, Receipt, StickyNote } from "lucide-react";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";

interface ClientFloatingActionsProps {
  notesCount?: number;
}

export function ClientFloatingActions({ notesCount = 0 }: ClientFloatingActionsProps) {
  const actions: FloatingAction[] = [
    { icon: FolderKanban, label: "Projects", onClick: () => scrollToSection("projects-section") },
    { icon: Receipt, label: "Invoices", onClick: () => scrollToSection("invoices-section") },
    { icon: StickyNote, label: "Notes", onClick: () => scrollToSection("notes-section"), badge: notesCount },
  ];

  return <FloatingActionBar actions={actions} />;
}
