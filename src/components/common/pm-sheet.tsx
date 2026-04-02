"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectManager } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectManagerForm } from "@/components/common/project-manager-form";
import { Plus } from "lucide-react";
import { EditButton } from "@/components/common/edit-button";

interface PMSheetProps {
  pm?: ProjectManager | Serialized<ProjectManager>;
  variant?: "create" | "edit";
}

export function PMSheet({ pm, variant = "create" }: PMSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = variant === "edit" && !!pm;

  function handleSuccess(id: string) {
    setOpen(false);
    if (!isEdit) {
      router.push(`/project-managers/${id}`);
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
            Add Manager
          </Button>
        )}
      />

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {!isEdit && (
          <SheetHeader>
            <SheetTitle className="sr-only">Add Team Member</SheetTitle>
            <SheetDescription className="sr-only">Add a new project manager to the team</SheetDescription>
          </SheetHeader>
        )}
        <div className={`px-4 pb-6 ${isEdit ? "pt-6" : ""}`}>
          <ProjectManagerForm
            pm={isEdit ? pm : undefined}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
