"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ClientForm } from "@/components/common/client-form";
import { Plus, Pencil } from "lucide-react";

interface ClientSheetProps {
  client?: Client;
  countries: { id: string; name: string; code: string; flag: string }[];
  variant?: "create" | "edit";
}

export function ClientSheet({ client, countries, variant = "create" }: ClientSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = variant === "edit" && !!client;

  function handleSuccess(id: string) {
    setOpen(false);
    if (!isEdit) {
      router.push(`/clients/${id}`);
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
          className="btn-gradient border-0 px-5 font-semibold text-white shadow-lg shadow-teal-500/20"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Client
        </Button>
      )}

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {!isEdit && (
          <SheetHeader>
            <SheetTitle>Add Client</SheetTitle>
            <SheetDescription>Add a new client to the system</SheetDescription>
          </SheetHeader>
        )}
        <div className={`px-4 pb-6 ${isEdit ? "pt-6" : ""}`}>
          <ClientForm
            client={isEdit ? client : undefined}
            countries={countries}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
