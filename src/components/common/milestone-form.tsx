"use client";

import { useState, useTransition } from "react";
import { createMilestone } from "@/actions/milestone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectDatePicker } from "@/components/ui/date-picker";
import type { ActionResult } from "@/types";
import { Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";

function formatWithCommas(val: string): string {
  const num = val.replace(/[^0-9.]/g, "");
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function stripCommas(val: string): string {
  return val.replace(/,/g, "");
}

export function MilestoneForm({ projectId }: { projectId: string }) {
  const [name, setName] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [dn, setDn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dateKey, setDateKey] = useState(0);

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.,]/g, "");
    setDisplayValue(formatWithCommas(raw));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const currentName = formData.get("name") as string;
    const currentDisplayValue = displayValue;

    // Replace the formatted value with the raw number
    formData.set("value", stripCommas(displayValue));

    startTransition(async () => {
      const result: ActionResult<{ id: string }> = await createMilestone(formData);
      if (result.success) {
        toast.success("Milestone added");
        setName("");
        setDisplayValue("");
        setDn(false);
        setDateKey((k) => k + 1);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      } else {
        toast.error(result.error ?? "Something went wrong.");
        setName(currentName);
        setDisplayValue(currentDisplayValue);
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="border-t border-border/15 px-5 py-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="value" value={stripCommas(displayValue)} />

      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-[2] space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">Name</label>
          <Input
            name="name"
            placeholder="e.g. Phase 1"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 border-border/25 bg-white/[0.02] text-sm placeholder:text-muted-foreground/20"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">Value</label>
          <Input
            placeholder="30,000"
            required
            value={displayValue}
            onChange={handleValueChange}
            className={`h-9 border-border/25 bg-white/[0.02] text-sm font-semibold tabular-nums placeholder:text-muted-foreground/20 placeholder:font-normal ${error ? "border-red-500/40 ring-1 ring-red-500/20" : ""}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ProjectDatePicker key={dateKey} name="plannedDate" label="Date" compact />
        </div>
        <input type="hidden" name="requiresDeliveryNote" value={dn ? "on" : ""} />
        <button
          type="button"
          role="switch"
          aria-checked={dn}
          onClick={() => setDn(!dn)}
          className="flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5"
        >
          <span className={`text-[11px] font-medium transition-colors ${dn ? "text-primary" : "text-muted-foreground/40"}`}>DN</span>
          <div className={`relative h-4 w-7 rounded-full transition-colors ${dn ? "bg-teal-500" : "bg-border"}`}>
            <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all ${dn ? "left-3.5" : "left-0.5"}`} />
          </div>
        </button>
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className={`h-8 gap-1.5 shrink-0 rounded-md px-4 text-[11px] font-semibold transition-all duration-300 disabled:opacity-50 ${
            showSuccess
              ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
              : "bg-accent text-primary ring-1 ring-teal-500/20 hover:bg-teal-500/20 hover:text-primary"
          }`}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : showSuccess ? (
            <Check className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          {isPending ? "Adding…" : showSuccess ? "Added" : "Add"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-400">{error}</p>
      )}
    </form>
  );
}
