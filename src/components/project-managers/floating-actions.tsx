"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, FolderKanban } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ProjectManagerForm } from "@/components/common/project-manager-form";
import { FloatingActionBar, scrollToSection, type FloatingAction } from "@/components/common/floating-action-bar";
import type { ProjectManager } from "@prisma/client";

interface PMFloatingActionsProps {
  pm: ProjectManager;
}

export function PMFloatingActions({ pm }: PMFloatingActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const actions: FloatingAction[] = [
    { icon: FolderKanban, label: "Projects", onClick: () => scrollToSection("projects-section") },
    { icon: Pencil, label: "Edit", onClick: () => setEditOpen(true), variant: "accent" },
  ];

  return (
    <>
      <FloatingActionBar actions={actions} />

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Team Member</SheetTitle>
            <SheetDescription>Update profile details</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 pt-6">
            <ProjectManagerForm
              pm={pm}
              onSuccess={() => { setEditOpen(false); router.refresh(); }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
