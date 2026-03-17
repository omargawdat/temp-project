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
