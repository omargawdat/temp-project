"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, FolderKanban } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProjectManagerForm } from "@/components/common/project-manager-form";
import type { ProjectManager } from "@prisma/client";

interface PMFloatingActionsProps {
  pm: ProjectManager;
}

export function PMFloatingActions({ pm }: PMFloatingActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.12] bg-[#131d2e]/95 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(45,212,191,0.08)] backdrop-blur-2xl ring-1 ring-white/[0.06]">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-teal-400/80 transition-all hover:bg-teal-500/10 hover:text-teal-400"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <Divider />

          <button
            onClick={() => scrollTo("projects-section")}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            <FolderKanban className="h-4 w-4" />
            <span>Projects</span>
          </button>

        </div>
      </div>

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

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-white/[0.06]" />;
}
