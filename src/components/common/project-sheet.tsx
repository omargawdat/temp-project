"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectForm } from "@/components/common/project-form";
import { Plus, Pencil } from "lucide-react";

interface ProjectSheetProps {
  projectManagers: {
    id: string;
    name: string;
    title?: string | null;
    photoUrl?: string | null;
  }[];
  clients: { id: string; name: string }[];
  project?: Project;
  trigger?: "button" | "icon";
}

export function ProjectSheet({
  projectManagers,
  clients,
  project,
  trigger = "button",
}: ProjectSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!project;

  function handleSuccess(id: string) {
    setOpen(false);
    if (!isEdit) {
      router.push(`/projects/${id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-teal-500/25 bg-teal-500/10 px-4 py-2 text-[13px] font-semibold text-teal-400 shadow-sm transition-all duration-200 hover:bg-teal-500/20 hover:shadow-md hover:shadow-teal-500/10"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} />
          Edit
        </button>
      ) : (
        <Button
          className="btn-gradient border-0 px-5 font-semibold text-white shadow-lg shadow-teal-500/20"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Project
        </Button>
      )}

      <SheetContent
        side="right"
        className="sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit Project" : "New Project"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editing ${project.name}`
              : "Register a new project from a signed contract"}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProjectForm
            project={project}
            projectManagers={projectManagers}
            clients={clients}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
