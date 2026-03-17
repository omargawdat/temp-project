"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createMilestone } from "@/actions/milestone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectDatePicker } from "@/components/ui/date-picker";
import type { ActionResult } from "@/types";
import { Loader2, Plus, AlertCircle, Check } from "lucide-react";

function SubmitButton({ showSuccess }: { showSuccess: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      size="sm"
      className={`h-8 gap-1.5 shrink-0 rounded-md px-4 text-[11px] font-semibold transition-all duration-300 disabled:opacity-50 ${
        showSuccess
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : showSuccess ? (
        <Check className="h-3 w-3" />
      ) : (
        <Plus className="h-3 w-3" />
      )}
      {pending ? "Adding…" : showSuccess ? "Added" : "Add"}
    </Button>
  );
}

export function MilestoneForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevStateRef = useRef<ActionResult<{ id: string }> | null>(null);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    return createMilestone(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);

  useEffect(() => {
    if (state?.success && state !== prevStateRef.current) {
      prevStateRef.current = state;
      formRef.current?.reset();
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
    prevStateRef.current = state;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="border-t border-border/15 px-5 py-3">
      {state && !state.success && (
        <div className="mb-2.5 flex items-center gap-2 rounded-md bg-red-500/5 px-3 py-2 text-[11px] ring-1 ring-red-500/10">
          <AlertCircle className="h-3 w-3 flex-shrink-0 text-red-400" />
          <span className="text-red-300">{state.error}</span>
        </div>
      )}

      <input type="hidden" name="projectId" value={projectId} />

      <div className="flex items-end gap-2.5">
        <div className="min-w-0 flex-[2.5] space-y-1">
          <label className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Name</label>
          <Input name="name" placeholder="e.g. Phase 1" required className="h-8 border-border/25 bg-white/[0.02] text-xs placeholder:text-muted-foreground/20" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <label className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Value</label>
          <Input name="value" type="number" step="0.01" placeholder="30000" required className="h-8 border-border/25 bg-white/[0.02] text-xs placeholder:text-muted-foreground/20" />
        </div>
        <div className="min-w-[130px]">
          <ProjectDatePicker name="plannedDate" label="Date" compact />
        </div>
        <label className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border/20 px-2.5 text-[11px] text-muted-foreground/50 transition-all hover:border-border/40 has-[:checked]:border-indigo-500/25 has-[:checked]:bg-indigo-500/5 has-[:checked]:text-indigo-400">
          <input type="checkbox" name="requiresDeliveryNote" className="h-3 w-3 rounded border-border bg-input accent-indigo-500" />
          DN
        </label>
        <SubmitButton showSuccess={showSuccess} />
      </div>
    </form>
  );
}
