"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/actions/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ActionResult } from "@/types";
import {
  Receipt,
  Loader2,
  CheckCircle2,
  Download,
  Target,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MilestoneSelector, type MilestoneChoice } from "@/components/common/milestone-selector";

interface MilestoneItem {
  id: string;
  name: string;
  value: string | number;
  status: string;
  invoiced: boolean;
}

function getInvoiceDisabledReason(m: MilestoneItem): string | null {
  if (m.invoiced) return "Already invoiced";
  if (m.status === "NOT_STARTED") return "Not started yet";
  if (m.status === "IN_PROGRESS") return "In progress";
  return null;
}

export function InvoiceSheet({
  milestones,
  currency,
}: {
  milestones: MilestoneItem[];
  currency: string;
}) {
  const router = useRouter();
  const eligibleMilestones = milestones.filter((m) => !getInvoiceDisabledReason(m));

  const milestoneChoices: MilestoneChoice[] = milestones.map((m) => ({
    id: m.id,
    name: m.name,
    value: m.value,
    disabledReason: getInvoiceDisabledReason(m),
  }));
  const hasEligible = eligibleMilestones.length > 0;
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [vatPercent, setVatPercent] = useState("15");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const subtotal = milestones
    .filter((m) => selectedIds.has(m.id))
    .reduce((sum, m) => sum + Number(m.value), 0);

  const vatPct = Number(vatPercent) || 0;
  const vatAmount = Math.round(subtotal * (vatPct / 100) * 100) / 100;
  const total = subtotal + vatAmount;

  function formatCur(amount: number) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  }

  function toggleMilestone(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === eligibleMilestones.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleMilestones.map((m) => m.id)));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.size === 0) {
      setError("Select at least one milestone.");
      return;
    }

    if (vatPct < 0 || vatPct > 100) {
      setError("VAT percentage must be between 0 and 100.");
      return;
    }

    const formData = new FormData();
    formData.set("milestoneIds", Array.from(selectedIds).join(","));
    formData.set("vatAmount", vatAmount.toString());

    startTransition(async () => {
      const result: ActionResult<{ id: string }> = await createInvoice(formData);
      if (result.success) {
        toast.success("Invoice created");
        setCreatedInvoiceId(result.data?.id ?? null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all btn-gradient border-0 text-primary-foreground shadow-lg shadow-primary/25"
      >
        <Receipt className="h-4 w-4" strokeWidth={2} />
        Create Invoice
      </button>

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto p-0">
        {createdInvoiceId ? (
          <div className="p-6">
            <SheetHeader>
              <SheetTitle>Invoice Created</SheetTitle>
              <SheetDescription>Your invoice has been created successfully.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 rounded-full bg-emerald-500/15 p-5">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-foreground">Invoice Created</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-secondary-foreground">{formatCur(total)}</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/api/invoices/${createdInvoiceId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl border-0 px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <button
                  onClick={() => {
                    setCreatedInvoiceId(null);
                    setSelectedIds(new Set());
                    setVatPercent("15");
                    setError(null);
                    setOpen(false);
                  }}
                  className="flex-1 rounded-xl border border-border/25 px-5 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-border/15 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-accent p-2.5">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Invoice</h2>
                  <p className="text-xs text-muted-foreground">Select milestones and configure VAT</p>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* Milestone selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Milestones</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                      {selectedIds.size}/{eligibleMilestones.length}
                    </span>
                  </div>
                  {hasEligible && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs font-semibold text-primary hover:text-primary transition-colors"
                    >
                      {selectedIds.size === eligibleMilestones.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>

                <MilestoneSelector
                  milestones={milestoneChoices}
                  mode="multi"
                  selected={selectedIds}
                  onSelect={toggleMilestone}
                  currency={currency}
                />
              </div>

              {/* Financial breakdown */}
              <div className="rounded-xl border border-border/15 bg-accent overflow-hidden">
                {/* Subtotal */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
                  <span className="text-sm text-muted-foreground/60">Subtotal</span>
                  <span className={cn(
                    "text-lg font-bold tabular-nums transition-colors",
                    hasSelection ? "text-foreground" : "text-muted-foreground/60",
                  )}>
                    {formatCur(subtotal)}
                  </span>
                </div>

                {/* VAT row */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
                  <div className="flex items-center gap-2">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground/60">VAT</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-16">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={vatPercent}
                        onChange={(e) => setVatPercent(e.target.value)}
                        className="h-8 pr-6 text-right text-xs tabular-nums border-border bg-accent"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold tabular-nums min-w-[60px] text-right transition-colors",
                      hasSelection ? "text-secondary-foreground" : "text-muted-foreground/60",
                    )}>
                      {formatCur(vatAmount)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between px-5 py-5 bg-primary/[0.04]">
                  <span className="text-sm font-bold text-primary">Total Payable</span>
                  <span className={cn(
                    "text-xl font-bold tabular-nums transition-colors",
                    hasSelection ? "text-foreground" : "text-muted-foreground/60",
                  )}>
                    {formatCur(total)}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/8 px-4 py-3 ring-1 ring-red-500/15">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border/15 bg-card/95 px-6 py-5 backdrop-blur-sm">
              <Button
                type="submit"
                disabled={isPending || !hasSelection}
                className={cn(
                  "w-full h-12 rounded-xl text-sm font-bold transition-all",
                  hasSelection
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-primary/80"
                    : "bg-muted text-muted-foreground/60 shadow-none",
                )}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Creating…" : hasSelection ? `Create Invoice — ${formatCur(total)}` : "Select milestones to continue"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
