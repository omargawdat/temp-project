"use client";

import * as React from "react";
import { useState, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Country } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import { createCountry, updateCountry } from "@/actions/country";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FieldWrapper } from "@/components/common/field-wrapper";
import { EditButton } from "@/components/common/edit-button";
import { countryFormSchema } from "@/schemas/country";
import { validateFormData } from "@/lib/form-utils";
import type { ActionResult } from "@/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  AlertCircle,
  MapPin,
  Hash,
  ImagePlus,
  X,
} from "lucide-react";

function SubmitButton({ isEdit, isDirty }: { isEdit: boolean; isDirty: boolean }) {
  const { pending } = useFormStatus();
  const enabled = isDirty || !isEdit;
  return (
    <div className="sticky bottom-0 -mx-4 -mb-5 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm">
      <Button
        type="submit"
        disabled={pending || !enabled}
        className={`w-full border-0 py-3 font-semibold transition-all ${
          enabled
            ? "btn-gradient text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-muted text-muted-foreground shadow-none"
        }`}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Saving…" : isEdit ? "Update" : "Add Country"}
      </Button>
    </div>
  );
}

function FlagUpload({ currentFlagUrl }: { currentFlagUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentFlagUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  }

  function handleRemove() {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        name="flagFile"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="flag-upload"
      />
      <label
        htmlFor="flag-upload"
        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-accent px-3 py-2.5 transition-colors hover:bg-muted"
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Flag preview" className="h-10 w-14 rounded object-cover ring-1 ring-ring/20" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Flag selected</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleRemove(); }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upload flag image</p>
              <p className="text-xs text-muted-foreground/60">PNG, JPG, SVG or WebP</p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}

function CountryForm({
  country,
  onSuccess,
}: {
  country?: Country | Serialized<Country>;
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!country;
  const [isDirty, setIsDirty] = React.useState(false);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    const validated = validateFormData(countryFormSchema, formData);
    if (!validated.success) return validated;
    if (isEdit) {
      return updateCountry(country!.id, formData);
    }
    return createCountry(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);

  const toastedState = React.useRef<typeof state>(null);

  React.useEffect(() => {
    if (state?.success && state.data?.id && toastedState.current !== state) {
      toastedState.current = state;
      toast.success(isEdit ? "Country updated" : "Country created");
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess, isEdit]);

  return (
    <form key={country?.id ?? "new"} onSubmit={(e) => { e.preventDefault(); startTransition(() => formAction(new FormData(e.currentTarget))); }} className="space-y-5" onChange={() => setIsDirty(true)}>
      {state && !state.success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span className="text-red-300">{state.error}</span>
        </motion.div>
      )}

      <div className="grid gap-4">
        <FlagUpload currentFlagUrl={country?.flag} />

        <FieldWrapper icon={MapPin} label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="e.g. Saudi Arabia"
            defaultValue={country?.name ?? ""}
            className="h-10 placeholder:text-muted-foreground/70 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Hash} label="Code" htmlFor="code">
          <Input
            id="code"
            name="code"
            placeholder="e.g. SA"
            defaultValue={country?.code ?? ""}
            className="h-10 placeholder:text-muted-foreground/70 placeholder:not-italic"
            required
          />
        </FieldWrapper>
      </div>

      <SubmitButton isEdit={isEdit} isDirty={isDirty} />
    </form>
  );
}

interface CountrySheetProps {
  country?: Country | Serialized<Country>;
  variant?: "create" | "edit";
}

export function CountrySheet({ country, variant = "create" }: CountrySheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = variant === "edit" && !!country;

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={isEdit ? (
          <EditButton />
        ) : (
          <Button className="btn-gradient border-0 px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Country
          </Button>
        )}
      />

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {!isEdit && (
          <SheetHeader>
            <SheetTitle className="sr-only">Add Country</SheetTitle>
            <SheetDescription className="sr-only">Add a new country to the system</SheetDescription>
          </SheetHeader>
        )}
        <div className={`px-4 pb-6 ${isEdit ? "pt-6" : ""}`}>
          <CountryForm
            country={isEdit ? country : undefined}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
