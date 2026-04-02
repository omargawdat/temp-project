"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Pencil } from "lucide-react";

export const EditButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
  (props, ref) => (
    <button
      ref={ref}
      {...props}
      className="flex items-center gap-2 rounded-lg border border-border bg-accent px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition-all duration-200 hover:bg-muted hover:shadow-md hover:shadow-white/5"
    >
      <Pencil className="h-4 w-4" strokeWidth={2} />
      Edit
    </button>
  )
);

EditButton.displayName = "EditButton";
