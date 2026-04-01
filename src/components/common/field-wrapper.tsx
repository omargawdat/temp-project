import React from "react";
import { Label } from "@/components/ui/label";

export function FieldWrapper({
  icon: Icon,
  label,
  htmlFor,
  error,
  children,
}: {
  icon: React.ElementType;
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
      >
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            "aria-describedby": errorId,
            "aria-invalid": !!error,
          })
        : children}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-400">{error}</p>
      )}
    </div>
  );
}
