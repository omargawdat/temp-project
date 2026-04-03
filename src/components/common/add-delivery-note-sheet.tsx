"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createDeliveryNote } from "@/actions/delivery-note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FieldWrapper } from "@/components/common/field-wrapper";
import { deliveryNoteFormSchema } from "@/schemas/delivery-note";
import { validateFormData } from "@/lib/form-utils";
import type { ActionResult } from "@/types";
import {
  Plus,
  AlertCircle,
  FileText,
  ClipboardList,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MilestoneSelector, type MilestoneChoice } from "@/components/common/milestone-selector";

interface MilestoneOption {
  id: string;
  name: string;
  status: string;
  hasDeliveryNote: boolean;
  requiresDeliveryNote: boolean;
}

function getDisabledReason(m: MilestoneOption): string | null {
  if (m.hasDeliveryNote) return "Already has a delivery note";
  if (!m.requiresDeliveryNote) return "Delivery note not required";
  if (m.status === "NOT_STARTED") return "Not started yet";
  if (m.status === "INVOICED") return "Already invoiced";
  return null;
}

export function AddDeliveryNoteSheet({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: MilestoneOption[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");

  async function handleCreate(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    formData.set("projectId", projectId);
    if (selectedMilestoneId) {
      formData.set("milestoneId", selectedMilestoneId);
    }
    const validated = validateFormData(deliveryNoteFormSchema, formData);
    if (!validated.success) return validated;
    return createDeliveryNote(formData);
  }

  const [state, formAction] = useActionState(handleCreate, null);

  const fieldError = (field: string) =>
    state && !state.success ? state.fieldErrors?.[field]?.[0] : undefined;

  const toastedState = useRef<typeof state>(null);
  useEffect(() => {
    if (state?.success && toastedState.current !== state) {
      toastedState.current = state;
      toast.success("Delivery note created");
      setOpen(false);
      setSelectedMilestoneId("");
      router.refresh();
    }
  }, [state, router]);

  const hasSelection = selectedMilestoneId !== "";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button className="btn-gradient border-0 px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Delivery Note
          </Button>
        }
      />

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Create Delivery Note</SheetTitle>
          <SheetDescription>Select a milestone and describe the delivered work</SheetDescription>
        </SheetHeader>

        <form onSubmit={(e) => { e.preventDefault(); startTransition(() => formAction(new FormData(e.currentTarget))); }} className="px-6 pb-6 space-y-5 mt-4">
          {state && !state.success && state.error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span className="text-red-400">{state.error}</span>
            </div>
          )}

          <FieldWrapper icon={Target} label="Milestone" htmlFor="milestoneId">
            <MilestoneSelector
              milestones={milestones.map((m): MilestoneChoice => ({
                id: m.id,
                name: m.name,
                disabledReason: getDisabledReason(m),
              }))}
              mode="single"
              selected={new Set(selectedMilestoneId ? [selectedMilestoneId] : [])}
              onSelect={(id) => setSelectedMilestoneId(id)}
            />
          </FieldWrapper>

          <FieldWrapper icon={FileText} label="Description" htmlFor="description" error={fieldError("description")}>
            <Textarea
              id="description"
              name="description"
              defaultValue=""
              required
              className="min-h-[80px] resize-none"
            />
          </FieldWrapper>

          <FieldWrapper icon={ClipboardList} label="Work Delivered" htmlFor="workDelivered" error={fieldError("workDelivered")}>
            <Textarea
              id="workDelivered"
              name="workDelivered"
              defaultValue=""
              required
              className="min-h-[100px] resize-none"
            />
          </FieldWrapper>

          <Button
            type="submit"
            disabled={!hasSelection}
            className={cn(
              "w-full border-0 font-semibold shadow-lg transition-all",
              hasSelection
                ? "btn-gradient text-primary-foreground shadow-primary/20"
                : "bg-muted text-muted-foreground shadow-none",
            )}
          >
            Create Delivery Note
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
