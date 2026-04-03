"use client";

import { useState, useTransition, useRef, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createDeliveryNote, updateDeliveryNote, updateDeliveryNoteStatus } from "@/actions/delivery-note";
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
import { StatusBadge } from "@/components/common/status-badge";
import { deliveryNoteFormSchema } from "@/schemas/delivery-note";
import { validateFormData } from "@/lib/form-utils";
import type { ActionResult } from "@/types";
import {
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  ClipboardList,
  Send,
  CheckCircle2,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DeliveryNoteData {
  id: string;
  description: string;
  workDelivered: string;
  status: string;
  sentDate?: string | Date | null;
  signedDate?: string | Date | null;
  signedDocumentUrl?: string | null;
}

interface DeliveryNoteSheetProps {
  projectId: string;
  milestoneId: string;
  milestoneName: string;
  deliveryNote?: DeliveryNoteData | null;
  variant: "create" | "view";
}

export function DeliveryNoteSheet({
  projectId,
  milestoneId,
  milestoneName,
  deliveryNote,
  variant,
}: DeliveryNoteSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isCreate = variant === "create";
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreate(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    formData.set("projectId", projectId);
    formData.set("milestoneId", milestoneId);
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
      router.refresh();
    }
  }, [state, router]);

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  function handleStatusChange(newStatus: "SENT" | "SIGNED") {
    if (!deliveryNote) return;
    startTransition(async () => {
      const formData = new FormData();
      if (newStatus === "SIGNED" && fileInputRef.current?.files?.[0]) {
        formData.set("signedDocument", fileInputRef.current.files[0]);
      }
      const result = await updateDeliveryNoteStatus(deliveryNote.id, newStatus, formData);
      if (result.success) {
        toast.success(`Delivery note marked as ${newStatus.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {isCreate ? (
        <SheetTrigger
          render={
            <button className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
              <Plus className="h-3 w-3" />
              Create
            </button>
          }
        />
      ) : (
        <SheetTrigger
          render={
            <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-2 hover:underline">
              View
            </button>
          }
        />
      )}

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isCreate ? "Create Delivery Note" : "Delivery Note"}</SheetTitle>
          <SheetDescription>
            {isCreate ? `For milestone: ${milestoneName}` : milestoneName}
          </SheetDescription>
        </SheetHeader>

        {isCreate ? (
          <form onSubmit={(e) => { e.preventDefault(); startTransition(() => formAction(new FormData(e.currentTarget))); }} className="px-6 pb-6 space-y-5 mt-4">
            {state && !state.success && state.error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                <span className="text-red-400">{state.error}</span>
              </div>
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
        ) : deliveryNote ? (
          <div className="px-6 pb-6 space-y-5 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status={deliveryNote.status} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-line">{deliveryNote.description}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Work Delivered</p>
              <p className="text-sm text-foreground whitespace-pre-line">{deliveryNote.workDelivered}</p>
            </div>

            {deliveryNote.sentDate && (
              <div className="flex items-center gap-2 text-sm">
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Sent:</span>
                <span className="text-foreground">{new Date(deliveryNote.sentDate).toLocaleDateString()}</span>
              </div>
            )}

            {deliveryNote.signedDate && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-muted-foreground">Signed:</span>
                <span className="text-foreground">{new Date(deliveryNote.signedDate).toLocaleDateString()}</span>
              </div>
            )}

            {/* Signed document link */}
            {deliveryNote.signedDocumentUrl && (
              <a
                href={deliveryNote.signedDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-accent px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                View Signed Document
              </a>
            )}

            {/* Status transition buttons */}
            {deliveryNote.status === "DRAFT" && (
              <Button
                onClick={() => handleStatusChange("SENT")}
                disabled={isPending}
                className="w-full gap-2"
                variant="outline"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Mark as Sent
              </Button>
            )}
            {deliveryNote.status === "SENT" && (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-accent px-3 py-3 text-sm transition-colors hover:bg-muted">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className={selectedFileName ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {selectedFileName ?? "Select signed document"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
                <Button
                  onClick={() => handleStatusChange("SIGNED")}
                  disabled={isPending || !selectedFileName}
                  className="w-full gap-2 btn-gradient border-0 text-primary-foreground"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Mark as Signed
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
