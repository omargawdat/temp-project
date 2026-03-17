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
import { Receipt, Loader2, CheckCircle2, Download, Lock } from "lucide-react";

interface MilestoneItem {
  id: string;
  name: string;
  value: string | number;
  invoiced: boolean;
}

export function InvoiceSheet({
  milestones,
  currency,
}: {
  milestones: MilestoneItem[];
  currency: string;
}) {
  const router = useRouter();
  const eligibleMilestones = milestones.filter((m) => !m.invoiced);
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
      maximumFractionDigits: 2,
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
        setCreatedInvoiceId(result.data?.id ?? null);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all btn-gradient border-0 text-white shadow-lg shadow-teal-500/25"
      >
        <Receipt className="h-4 w-4" strokeWidth={2} />
        Create Invoice
      </button>

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        {createdInvoiceId ? (
          <>
            <SheetHeader>
              <SheetTitle>Invoice Created</SheetTitle>
              <SheetDescription>Your invoice has been created successfully.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6 space-y-5">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-emerald-500/15 p-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-lg font-bold text-foreground">Invoice Created</p>
                <p className="mt-1 text-sm text-muted-foreground">Total: {formatCur(total)}</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/api/invoices/${createdInvoiceId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/25"
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
                  className="flex-1 rounded-lg border border-border/25 px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/[0.04]"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Create Invoice</SheetTitle>
              <SheetDescription>Select milestones, set VAT %. Amount is auto-calculated.</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-5">
              {/* Milestone selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">Milestones</label>
                  {hasEligible && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      {selectedIds.size === eligibleMilestones.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {milestones.map((m) => {
                    const isSelected = selectedIds.has(m.id);
                    const isInvoiced = m.invoiced;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                          isInvoiced
                            ? "cursor-not-allowed border-border/10 bg-white/[0.01] opacity-50"
                            : isSelected
                              ? "cursor-pointer border-teal-500/30 bg-teal-500/5"
                              : "cursor-pointer border-border/20 bg-white/[0.02] hover:border-border/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isInvoiced}
                          onChange={() => toggleMilestone(m.id)}
                          className="h-4 w-4 rounded border-border bg-input accent-teal-500 disabled:opacity-40"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${isInvoiced ? "text-muted-foreground/50" : "text-foreground"}`}>{m.name}</span>
                        </div>
                        {isInvoiced ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground/40">
                            <Lock className="h-3 w-3" />
                            Invoiced
                          </span>
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-foreground/80">
                            {formatCur(Number(m.value))}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3 border border-border/10">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{formatCur(subtotal)}</span>
              </div>

              {/* VAT % */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">VAT Percentage</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={vatPercent}
                      onChange={(e) => setVatPercent(e.target.value)}
                      className="h-10 pr-8 tabular-nums"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/50">%</span>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground/60">= {formatCur(vatAmount)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg bg-teal-500/5 px-4 py-3 border border-teal-500/15">
                <span className="text-sm font-semibold text-teal-400">Total Payable</span>
                <span className="text-xl font-bold tabular-nums text-foreground">{formatCur(total)}</span>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm font-medium text-red-400">{error}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending || selectedIds.size === 0}
                className="w-full h-11 bg-gradient-to-r from-teal-600 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Creating…" : `Create Invoice — ${formatCur(total)}`}
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
