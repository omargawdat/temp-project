"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@prisma/client";
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
import { ClientForm } from "@/components/common/client-form";
import { Plus } from "lucide-react";
import { EditButton } from "@/components/common/edit-button";

interface ClientSheetProps {
  client?: (Client | Serialized<Client>) & { contacts?: ContactRow[] };
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
      <SheetTrigger
        render={isEdit ? (
          <EditButton />
        ) : (
          <Button className="btn-gradient border-0 px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        )}
      />

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
