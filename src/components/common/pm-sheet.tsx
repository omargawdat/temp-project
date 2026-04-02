"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectManager } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectManagerForm } from "@/components/common/project-manager-form";
import { Plus, Pencil } from "lucide-react";

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
      {isEdit ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      ) : (
        <Button
          className="border-0 rounded-full h-14 w-14 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

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
