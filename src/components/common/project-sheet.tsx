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
  project?: Project;
  trigger?: "button" | "icon";
}

export function ProjectSheet({
  projectManagers,
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
        trigger === "icon" ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-3 w-3" />
            Edit Project
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )
      ) : (
        <Button
          className="btn-gradient border-0 px-5 font-semibold text-white shadow-lg shadow-indigo-500/20"
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
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
