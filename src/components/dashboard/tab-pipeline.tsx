import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { formatStatus, STATUS_CONFIG, DEFAULT_STATUS_STYLE } from "@/lib/status-config";

interface PipelineMilestone {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  value: number;
  currency: string;
}

interface PipelineInvoice {
  id: string;
  invoiceNumber: string;
  totalPayable: number;
  currency: string;
  projectName: string;
}

interface TabPipelineProps {
  milestonesByStatus: Record<string, PipelineMilestone[]>;
  invoicesByStatus: Record<string, PipelineInvoice[]>;
}

const MILESTONE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "INVOICED"];
const INVOICE_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PAID"];

function StatusColumnHeader({ status, count }: { status: string; count: number }) {
  const style = STATUS_CONFIG[status] ?? DEFAULT_STATUS_STYLE;
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
        <span className="text-xs font-semibold text-foreground">{formatStatus(status)}</span>
      </div>
      <span className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${style.bg} ${style.text}`}>
        {count}
      </span>
    </div>
  );
}

export function TabPipeline({ milestonesByStatus, invoicesByStatus }: TabPipelineProps) {
  return (
    <div className="space-y-6">
      {/* Milestone Pipeline */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Milestone Pipeline</span>
        <div className="mt-3 grid grid-cols-5 gap-3">
          {MILESTONE_STATUSES.map((status) => {
            const items = milestonesByStatus[status] ?? [];
            return (
              <div key={status} className="rounded-xl bg-card card-elevated p-3">
                <StatusColumnHeader status={status} count={items.length} />
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                  {items.map((m) => (
                    <Link
                      key={m.id}
                      href={`/projects/${m.projectId}`}
                      className="block rounded-lg bg-accent px-2.5 py-2 transition-colors hover:bg-accent/70"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.projectName}</p>
                      <p className="text-xs font-semibold tabular-nums text-muted-foreground mt-0.5">
                        {formatCurrency(m.value, m.currency)}
                      </p>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No items</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice Pipeline */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Pipeline</span>
        <div className="mt-3 grid grid-cols-5 gap-3">
          {INVOICE_STATUSES.map((status) => {
            const items = invoicesByStatus[status] ?? [];
            return (
              <div key={status} className="rounded-xl bg-card card-elevated p-3">
                <StatusColumnHeader status={status} count={items.length} />
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                  {items.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-lg bg-accent px-2.5 py-2"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.projectName}</p>
                      <p className="text-xs font-semibold tabular-nums text-muted-foreground mt-0.5">
                        {formatCurrency(inv.totalPayable, inv.currency)}
                      </p>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No items</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
