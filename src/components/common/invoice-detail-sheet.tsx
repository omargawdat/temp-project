"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus, setInvoicePaymentDueDate } from "@/actions/invoice";
import { createPayment } from "@/actions/payment";
import { InvoiceStatus } from "@prisma/client";
import { INVOICE_TRANSITIONS } from "@/schemas/transitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectDatePicker } from "@/components/ui/date-picker";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  DollarSign,
  Hash,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface InvoiceDetailSheetProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    vatAmount: number;
    totalPayable: number;
    status: string;
    paymentDueDate: string | Date | null;
    submittedDate: string | Date | null;
    milestoneNames: string[];
    payments: Array<{
      id: string;
      amount: number | string;
      receivedDate: string | Date;
      reference: string;
    }>;
  };
  currency: string;
}

const TRANSITION_BUTTONS: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  SUBMITTED: {
    label: "Submit Invoice",
    icon: Send,
    className: "bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    icon: Eye,
    className: "bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-200",
  },
  APPROVED: {
    label: "Approve",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-200",
  },
  REJECTED: {
    label: "Reject",
    icon: XCircle,
    className: "bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200",
  },
  DRAFT: {
    label: "Revert to Draft",
    icon: RotateCcw,
    className: "bg-slate-50 text-slate-600 hover:bg-slate-100 ring-1 ring-slate-200",
  },
};

function formatCur(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function InvoiceDetailSheet({ invoice, currency }: InvoiceDetailSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [dueDateKey, setDueDateKey] = useState(0);

  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = invoice.totalPayable - totalPaid;

  const nextStatuses = INVOICE_TRANSITIONS[invoice.status as InvoiceStatus] ?? [];

  function handleStatusChange(newStatus: InvoiceStatus) {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, newStatus);
      if (result.success) {
        toast.success(`Invoice ${newStatus.replace(/_/g, " ").toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleSetDueDate(formData: FormData) {
    startTransition(async () => {
      const result = await setInvoicePaymentDueDate(invoice.id, formData);
      if (result.success) {
        toast.success("Payment due date set");
        setDueDateKey((k) => k + 1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRecordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaymentError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("invoiceId", invoice.id);

    startTransition(async () => {
      const result = await createPayment(formData);
      if (result.success) {
        toast.success("Payment recorded");
        router.refresh();
      } else {
        setPaymentError(result.error);
      }
    });
  }

  const hasDueDate = !!invoice.paymentDueDate;
  const isSubmitBlocked = invoice.status === "DRAFT" && !hasDueDate;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="font-mono text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-2 hover:underline">
            {invoice.invoiceNumber}
          </button>
        }
      />

      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-3">
            <span className="font-mono">{invoice.invoiceNumber}</span>
            <StatusBadge status={invoice.status} />
          </SheetTitle>
          <SheetDescription>
            {invoice.milestoneNames.join(", ")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-6 mt-4">
          {/* Financial breakdown */}
          <div className="rounded-xl border border-border/15 bg-accent overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatCur(invoice.amount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
              <span className="text-sm text-muted-foreground">VAT</span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {formatCur(invoice.vatAmount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5 bg-primary/[0.04]">
              <span className="text-sm font-semibold text-primary">Total Payable</span>
              <span className="font-mono text-base font-bold tabular-nums text-foreground">
                {formatCur(invoice.totalPayable, currency)}
              </span>
            </div>
          </div>

          {/* Due date section */}
          {(invoice.status === "DRAFT" || invoice.status === "SUBMITTED") && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Due Date</p>
              {hasDueDate ? (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {new Date(invoice.paymentDueDate!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-600 ring-1 ring-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Set a due date before submitting
                </div>
              )}
              <form action={handleSetDueDate} className="flex items-end gap-2">
                <div className="flex-1">
                  <ProjectDatePicker
                    key={dueDateKey}
                    name="paymentDueDate"
                    label="Due Date"
                    defaultValue={invoice.paymentDueDate ? new Date(invoice.paymentDueDate).toISOString().split("T")[0] : undefined}
                    compact
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="h-9 px-3 text-xs font-semibold"
                  variant="outline"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
                </Button>
              </form>
            </div>
          )}

          {/* Submitted date */}
          {invoice.submittedDate && (
            <div className="flex items-center gap-2 text-sm">
              <Send className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Submitted:</span>
              <span className="text-foreground">
                {new Date(invoice.submittedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          )}

          {/* Status transition buttons */}
          {nextStatuses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => {
                  const config = TRANSITION_BUTTONS[status];
                  if (!config) return null;
                  const Icon = config.icon;
                  const disabled = isPending || (status === "SUBMITTED" && isSubmitBlocked);
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={disabled}
                      title={status === "SUBMITTED" && isSubmitBlocked ? "Set a payment due date first" : undefined}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                        disabled ? "cursor-not-allowed opacity-40" : config.className
                      }`}
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payments section */}
          {(invoice.status === "APPROVED" || invoice.status === "PAID") && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payments</p>

              {/* Payment history */}
              {invoice.payments.length > 0 && (
                <div className="rounded-lg border border-border/15 overflow-hidden">
                  {invoice.payments.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                        idx < invoice.payments.length - 1 ? "border-b border-border/10" : ""
                      }`}
                    >
                      <div>
                        <span className="font-medium text-foreground">{p.reference}</span>
                        <span className="ml-2 text-muted-foreground">
                          {new Date(p.receivedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-emerald-600">
                        {formatCur(Number(p.amount), currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Remaining balance */}
              <div className="flex items-center justify-between rounded-lg bg-accent px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {remaining <= 0 ? "Fully Paid" : "Remaining"}
                </span>
                <span className={`font-mono text-sm font-bold tabular-nums ${remaining <= 0 ? "text-emerald-600" : "text-foreground"}`}>
                  {formatCur(Math.max(remaining, 0), currency)}
                </span>
              </div>

              {/* Payment recording form */}
              {invoice.status === "APPROVED" && remaining > 0 && (
                <form onSubmit={handleRecordPayment} className="space-y-3 rounded-lg border border-border/15 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Record Payment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <DollarSign className="h-3 w-3" /> Amount
                      </label>
                      <Input
                        name="amount"
                        type="number"
                        step="0.01"
                        max={remaining}
                        placeholder={remaining.toFixed(2)}
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Hash className="h-3 w-3" /> Reference
                      </label>
                      <Input
                        name="reference"
                        placeholder="TRF-001"
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <ProjectDatePicker name="receivedDate" label="Received Date" compact />
                  {paymentError && (
                    <p className="text-xs font-medium text-red-400">{paymentError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-9 text-sm font-semibold"
                    variant="outline"
                  >
                    {isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <DollarSign className="mr-2 h-3.5 w-3.5" />}
                    Record Payment
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* PDF download */}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-accent px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Download PDF
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
