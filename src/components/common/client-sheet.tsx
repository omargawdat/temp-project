"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
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
  client?: Client | Serialized<Client>;
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
          className="border-0 rounded-full h-14 w-14 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {!isEdit && (
          <SheetHeader>
            <SheetTitle className="sr-only">Add Client</SheetTitle>
            <SheetDescription className="sr-only">Add a new client to the system</SheetDescription>
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
