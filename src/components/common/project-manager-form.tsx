"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState, useRef } from "react";
import type { ProjectManager } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import {
  createProjectManager,
  updateProjectManager,
} from "@/actions/project-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/common/field-wrapper";
import type { ActionResult } from "@/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
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
        {pending ? "Saving…" : isEdit ? "Update" : "Add Team Member"}
      </Button>
    </div>
  );
}

function PhotoUpload({ currentPhotoUrl }: { currentPhotoUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
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
        name="photo"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="photo-upload"
      />
      <label
        htmlFor="photo-upload"
        className="group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-accent/20 px-6 py-5 transition-colors hover:border-border hover:bg-accent/40"
      >
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="h-20 w-20 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleRemove(); }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-muted-foreground transition-colors hover:bg-destructive hover:text-foreground hover:border-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-border/40 bg-accent/30">
            <User className="h-7 w-7 text-muted-foreground/60" />
          </div>
        )}
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
            {preview ? "Change photo" : "Upload photo"}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            JPG, PNG or WebP
          </p>
        </div>
      </label>
    </div>
  );
}

export function ProjectManagerForm({
  pm,
  onSuccess,
}: {
  pm?: ProjectManager | Serialized<ProjectManager>;
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!pm;
  const [isDirty, setIsDirty] = React.useState(false);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    if (isEdit) {
      return updateProjectManager(pm!.id, formData);
    }
    return createProjectManager(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);

  const fieldError = (field: string) =>
    state && !state.success ? state.fieldErrors?.[field]?.[0] : undefined;

  const toastedState = React.useRef<typeof state>(null);

  React.useEffect(() => {
    if (state?.success && state.data?.id && toastedState.current !== state) {
      toastedState.current = state;
      toast.success(isEdit ? "Team member updated" : "Team member added");
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess, isEdit]);

  return (
    <form key={pm?.id ?? "new"} action={formAction} className="space-y-5" onChange={() => setIsDirty(true)}>
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

      {/* Photo */}
      <PhotoUpload currentPhotoUrl={pm?.photoUrl} />

      {/* Fields */}
      <div className="grid gap-4">
        <FieldWrapper icon={User} label="Full Name" htmlFor="name" error={fieldError("name")}>
          <Input
            id="name"
            name="name"
            placeholder="Sarah Johnson"
            defaultValue={pm?.name ?? ""}
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Briefcase} label="Job Title" htmlFor="title" error={fieldError("title")}>
          <Input
            id="title"
            name="title"
            placeholder="Senior Project Manager"
            defaultValue={pm?.title ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper icon={Mail} label="Email" htmlFor="email" error={fieldError("email")}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="sarah@company.com"
            defaultValue={pm?.email ?? ""}
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Phone} label="Phone" htmlFor="phone" error={fieldError("phone")}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+966 50 123 4567"
            defaultValue={pm?.phone ?? ""}
          />
        </FieldWrapper>
      </div>

      <SubmitButton isEdit={isEdit} isDirty={isDirty} />
    </form>
  );
}
