"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Target, Receipt, Pause, Play, Lock, RotateCcw, StickyNote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProjectForm } from "@/components/common/project-form";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";
import { updateProjectStatus } from "@/actions/project";
import { type Project, ProjectStatus } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";

interface FloatingActionsProps {
  project: Serialized<Project>;
  projectManagers: { id: string; name: string; title?: string | null; photoUrl?: string | null }[];
  clients: { id: string; name: string; imageUrl?: string | null }[];
  notesCount?: number;
}

export function FloatingActions({
  project,
  projectManagers,
  clients,
  notesCount = 0,
}: FloatingActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(target: ProjectStatus) {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, target);
      if (result.success) router.refresh();
    });
  }

  const actions: FloatingAction[] = [
    { icon: Target, label: "Milestones", onClick: () => scrollToSection("milestones-section") },
    { icon: Receipt, label: "Invoices", onClick: () => scrollToSection("invoices-section") },
    { icon: StickyNote, label: "Notes", onClick: () => scrollToSection("notes-section"), badge: notesCount },
    ...getStatusActions(project.status).map((a) => ({
      icon: a.icon,
      label: a.label,
      onClick: () => handleStatusChange(a.target),
      variant: a.variant as FloatingAction["variant"],
      disabled: isPending,
    })),
    { icon: Pencil, label: "Edit", onClick: () => setEditOpen(true), variant: "accent" },
  ];

  return (
    <>
      {!editOpen && <FloatingActionBar actions={actions} />}

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Project</SheetTitle>
            <SheetDescription>Update project details</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 pt-6">
            <ProjectForm
              project={project}
              projectManagers={projectManagers}
              clients={clients}
              onSuccess={() => { setEditOpen(false); router.refresh(); }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function getStatusActions(status: string) {
  switch (status) {
    case "ACTIVE":
      return [
        { label: "Hold", icon: Pause, target: ProjectStatus.ON_HOLD, variant: "warning" },
        { label: "Close", icon: Lock, target: ProjectStatus.CLOSED, variant: "danger" },
      ];
    case "ON_HOLD":
      return [
        { label: "Resume", icon: Play, target: ProjectStatus.ACTIVE, variant: "primary" },
      ];
    case "CLOSED":
      return [
        { label: "Reopen", icon: RotateCcw, target: ProjectStatus.ACTIVE, variant: "primary" },
      ];
    default:
      return [];
  }
}
