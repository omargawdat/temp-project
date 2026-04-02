"use client";

import { useState, useRef, useEffect } from "react";
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

interface MilestoneOption {
  id: string;
  name: string;
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

        <form action={formAction} className="px-6 pb-6 space-y-5 mt-4">
          {state && !state.success && state.error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span className="text-red-400">{state.error}</span>
            </div>
          )}

          {milestones.length > 0 && (
            <FieldWrapper icon={Target} label="Milestone (optional)" htmlFor="milestoneId">
              <div className="space-y-1.5">
                <label
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-all",
                    selectedMilestoneId === ""
                      ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <input
                    type="radio"
                    name="_milestone_radio"
                    value=""
                    checked={selectedMilestoneId === ""}
                    onChange={() => setSelectedMilestoneId("")}
                    className="sr-only"
                  />
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    selectedMilestoneId === "" ? "border-primary bg-primary" : "border-border",
                  )}>
                    {selectedMilestoneId === "" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-muted-foreground">No milestone</span>
                </label>
                {milestones.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-all",
                      selectedMilestoneId === m.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name="_milestone_radio"
                      value={m.id}
                      checked={selectedMilestoneId === m.id}
                      onChange={() => setSelectedMilestoneId(m.id)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      selectedMilestoneId === m.id ? "border-primary bg-primary" : "border-border",
                    )}>
                      {selectedMilestoneId === m.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium text-foreground">{m.name}</span>
                  </label>
                ))}
              </div>
            </FieldWrapper>
          )}

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
            className="w-full btn-gradient border-0 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            Create Delivery Note
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
