"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import type { ContactRow } from "@/components/common/contact-form-rows";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectForm } from "@/components/common/project-form";
import { Plus } from "lucide-react";
import { EditButton } from "@/components/common/edit-button";

interface ProjectSheetProps {
  projectManagers: {
    id: string;
    name: string;
    title?: string | null;
    photoUrl?: string | null;
  }[];
  clients: { id: string; name: string }[];
  project?: (Project | Serialized<Project>) & { contacts?: ContactRow[] };
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
      <SheetTrigger
        render={isEdit ? (
          <EditButton />
        ) : (
          <Button className="btn-gradient border-0 px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        )}
      />

      <SheetContent
        side="right"
        className="sm:max-w-2xl overflow-y-auto"
      >
        {!isEdit && (
          <SheetHeader>
            <SheetTitle className="sr-only">New Project</SheetTitle>
            <SheetDescription className="sr-only">Register a new project from a signed contract</SheetDescription>
          </SheetHeader>
        )}
        <div className={`px-4 pb-6 ${isEdit ? "pt-6" : ""}`}>
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
