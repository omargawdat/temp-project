"use client";

import { FolderKanban, FileSignature, StickyNote } from "lucide-react";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";

interface PMFloatingActionsProps {
  notesCount?: number;
  dnPendingCount?: number;
}

export function PMFloatingActions({ notesCount = 0, dnPendingCount = 0 }: PMFloatingActionsProps) {
  const actions: FloatingAction[] = [
    { icon: FileSignature, label: "Delivery Notes", onClick: () => scrollToSection("delivery-notes-section"), badge: dnPendingCount },
    { icon: FolderKanban, label: "Projects", onClick: () => scrollToSection("projects-section") },
    { icon: StickyNote, label: "Notes", onClick: () => scrollToSection("notes-section"), badge: notesCount },
  ];

  return <FloatingActionBar actions={actions} />;
}
