import type { CurrencyTotals } from "@/lib/format";
import { addToCurrency } from "@/lib/format";

type DecimalLike = number | string | { toString(): string };

/**
 * Sum invoice totalPayable from milestones, deduplicating by invoice ID.
 * Prevents double-counting when multiple milestones share one invoice.
 */
export function sumUniqueInvoices(
  milestones: Array<{
    invoice?: { id: string; totalPayable: DecimalLike; status?: string } | null;
  }>,
  statusFilter?: string,
): number {
  const seen = new Set<string>();
  let total = 0;
  for (const m of milestones) {
    if (m.invoice && !seen.has(m.invoice.id)) {
      if (!statusFilter || m.invoice.status === statusFilter) {
        seen.add(m.invoice.id);
        total += Number(m.invoice.totalPayable);
      }
    }
  }
  return total;
}

export interface DeduplicatedInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  totalPayable: number;
  status: string;
  paymentDueDate: Date | null;
  submittedDate: Date | null;
  createdAt: Date;
  milestoneNames: string[];
  projectName?: string;
  payments: Array<{
    id: string;
    amount: DecimalLike;
    receivedDate: Date;
    reference: string;
  }>;
}

/**
 * Deduplicate invoices from milestones, collecting milestone names per invoice.
 * Replaces the repeated Map-based dedup pattern found in multiple pages.
 */
/**
 * Sum invoice totalPayable grouped by currency, deduplicating by invoice ID.
 * Each milestone must carry a `_currency` field indicating the project's currency.
 */
export function sumUniqueInvoicesByCurrency(
  milestones: Array<{
    invoice?: { id: string; totalPayable: DecimalLike; status?: string } | null;
    _currency: string;
  }>,
  statusFilter?: string,
): CurrencyTotals {
  const seen = new Set<string>();
  const totals: CurrencyTotals = {};
  for (const m of milestones) {
    if (m.invoice && !seen.has(m.invoice.id)) {
      if (!statusFilter || m.invoice.status === statusFilter) {
        seen.add(m.invoice.id);
        addToCurrency(totals, m._currency, Number(m.invoice.totalPayable));
      }
    }
  }
  return totals;
}

export function deduplicateInvoices<
  M extends {
    name: string;
    invoice?: {
      id: string;
      invoiceNumber: string;
      amount: DecimalLike;
      vatAmount: DecimalLike;
      totalPayable: DecimalLike;
      status: string;
      paymentDueDate: Date | null;
      submittedDate?: Date | null;
      createdAt: Date;
      payments?: Array<{
        id: string;
        amount: DecimalLike;
        receivedDate: Date;
        reference: string;
      }>;
    } | null;
    invoiceId?: string | null;
  },
>(
  milestones: M[],
  projectNameResolver?: (milestone: M) => string,
): DeduplicatedInvoice[] {
  const map = new Map<string, DeduplicatedInvoice>();
  for (const m of milestones) {
    if (!m.invoice) continue;
    const existing = map.get(m.invoice.id);
    if (existing) {
      existing.milestoneNames.push(m.name);
    } else {
      map.set(m.invoice.id, {
        id: m.invoice.id,
        invoiceNumber: m.invoice.invoiceNumber,
        amount: Number(m.invoice.amount),
        vatAmount: Number(m.invoice.vatAmount),
        totalPayable: Number(m.invoice.totalPayable),
        status: m.invoice.status,
        paymentDueDate: m.invoice.paymentDueDate,
        submittedDate: m.invoice.submittedDate ?? null,
        createdAt: m.invoice.createdAt,
        milestoneNames: [m.name],
        projectName: projectNameResolver?.(m),
        payments: m.invoice.payments ?? [],
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
