"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target, Receipt, Pause, Play, Lock, RotateCcw, StickyNote } from "lucide-react";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";
import { updateProjectStatus } from "@/actions/project";
import { type Project, ProjectStatus } from "@prisma/client";
import { toast } from "sonner";
import type { Serialized } from "@/lib/serialize";

interface FloatingActionsProps {
  project: Serialized<Project>;
  notesCount?: number;
}

export function FloatingActions({
  project,
  notesCount = 0,
}: FloatingActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(target: ProjectStatus) {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, target);
      if (result.success) {
        toast.success("Project status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
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
  ];

  return <FloatingActionBar actions={actions} />;
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
