"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Target,
  Receipt,
  Pause,
  Play,
  Lock,
  RotateCcw,
  StickyNote,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectForm } from "@/components/common/project-form";
import { updateProjectStatus } from "@/actions/project";
import type { Project } from "@prisma/client";

interface FloatingActionsProps {
  project: Project;
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

  const statusActions = getStatusActions(project.status);

  function handleStatusChange(target: string) {
    startTransition(async () => {
      const result = await updateProjectStatus(project.id, target);
      if (result.success) router.refresh();
    });
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.12] bg-[#131d2e]/95 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(45,212,191,0.08)] backdrop-blur-2xl ring-1 ring-white/[0.06]">

          {/* Edit Project */}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-teal-400/80 transition-all hover:bg-teal-500/10 hover:text-teal-400"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <Divider />

          {/* Jump to Milestones */}
          <button
            onClick={() => scrollTo("milestones-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Target className="h-4 w-4" />
            <span>Milestones</span>
          </button>

          <Divider />

          {/* Jump to Invoices */}
          <button
            onClick={() => scrollTo("invoices-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <Receipt className="h-4 w-4" />
            <span>Invoices</span>
          </button>

          <Divider />

          {/* Notes */}
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

          {/* Status actions */}
          {statusActions.length > 0 && (
            <>
              <Divider />
              {statusActions.map((action) => (
                <button
                  key={action.target}
                  disabled={isPending}
                  onClick={() => handleStatusChange(action.target)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${action.className}`}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Edit Sheet */}
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

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-white/[0.06]" />;
}

function getStatusActions(status: string) {
  switch (status) {
    case "ACTIVE":
      return [
        { label: "Hold", icon: Pause, target: "ON_HOLD", className: "text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400" },
        { label: "Close", icon: Lock, target: "CLOSED", className: "text-white/35 hover:bg-white/[0.06] hover:text-white/60" },
      ];
    case "ON_HOLD":
      return [
        { label: "Resume", icon: Play, target: "ACTIVE", className: "text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400" },
      ];
    case "CLOSED":
      return [
        { label: "Reopen", icon: RotateCcw, target: "ACTIVE", className: "text-teal-400/70 hover:bg-teal-500/10 hover:text-teal-400" },
      ];
    default:
      return [];
  }
}
