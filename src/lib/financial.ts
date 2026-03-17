/**
 * Sum invoice totalPayable from milestones, deduplicating by invoice ID.
 * Prevents double-counting when multiple milestones share one invoice.
 */
export function sumUniqueInvoices(
  milestones: Array<{
    invoice?: { id: string; totalPayable: unknown; status?: string } | null;
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
  createdAt: Date;
  milestoneNames: string[];
  projectName?: string;
}

/**
 * Deduplicate invoices from milestones, collecting milestone names per invoice.
 * Replaces the repeated Map-based dedup pattern found in multiple pages.
 */
export function deduplicateInvoices<
  M extends {
    name: string;
    invoice?: {
      id: string;
      invoiceNumber: string;
      amount: unknown;
      vatAmount: unknown;
      totalPayable: unknown;
      status: string;
      paymentDueDate: Date | null;
      createdAt: Date;
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
        createdAt: m.invoice.createdAt,
        milestoneNames: [m.name],
        projectName: projectNameResolver?.(m),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
