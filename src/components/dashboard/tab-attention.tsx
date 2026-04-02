import Link from "next/link";
import { Clock, Receipt, FileSignature, CheckCircle2, CalendarClock } from "lucide-react";
import { daysDifference } from "@/lib/milestones";

interface OverdueMilestone {
  id: string;
  name: string;
  projectName: string;
  projectId: string;
  daysOverdue: number;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  paymentDueDate: Date | null;
  milestones: { project: { name: string } }[];
}

interface PendingDeliveryNote {
  name: string;
  projectName: string;
  projectId: string;
  status: string;
}

interface UpcomingMilestone {
  id: string;
  name: string;
  projectName: string;
  projectId: string;
  plannedDate: Date;
  daysUntil: number;
}

interface TabAttentionProps {
  overdueMilestones: OverdueMilestone[];
  overdueInvoices: OverdueInvoice[];
  pendingDeliveryNotes: PendingDeliveryNote[];
  upcomingMilestones: UpcomingMilestone[];
}

export function TabAttention({
  overdueMilestones,
  overdueInvoices,
  pendingDeliveryNotes,
  upcomingMilestones,
}: TabAttentionProps) {
  const hasActionItems = overdueMilestones.length > 0 || overdueInvoices.length > 0 || pendingDeliveryNotes.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Action Items */}
      <div className="rounded-xl bg-card card-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertIcon />
            <span className="text-sm font-semibold text-foreground">Action Items</span>
            {hasActionItems && (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-xs font-bold tabular-nums text-amber-700">
                {overdueMilestones.length + overdueInvoices.length + pendingDeliveryNotes.length}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          {overdueMilestones.map((m) => (
            <Link
              key={`ms-${m.id}`}
              href={`/projects/${m.projectId}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.projectName}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-red-500">{m.daysOverdue}d overdue</span>
            </Link>
          ))}
          {overdueInvoices.map((inv) => (
            <div key={`inv-${inv.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5">
              <Receipt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{inv.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">{inv.milestones[0]?.project.name ?? "—"}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-red-500">
                {inv.paymentDueDate ? `${daysDifference(inv.paymentDueDate)}d past due` : "—"}
              </span>
            </div>
          ))}
          {pendingDeliveryNotes.map((dn, i) => (
            <Link
              key={`dn-${i}`}
              href={`/projects/${dn.projectId}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
            >
              <FileSignature className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{dn.name}</p>
                <p className="text-xs text-muted-foreground">{dn.projectName}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-purple-500">Pending {dn.status.toLowerCase()}</span>
            </Link>
          ))}
          {!hasActionItems && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-emerald-500">All clear</p>
              <p className="text-xs text-muted-foreground">No action items</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="rounded-xl bg-card card-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Upcoming Deadlines</span>
            {upcomingMilestones.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-xs font-bold tabular-nums text-amber-700">
                {upcomingMilestones.length}
              </span>
            )}
          </div>
          <Link href="/milestones" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
            View all →
          </Link>
        </div>
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
          {upcomingMilestones.slice(0, 10).map((m) => (
            <Link
              key={m.id}
              href={`/projects/${m.projectId}`}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
            >
              <div className={`flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                m.daysUntil <= 3 ? "bg-red-50" : m.daysUntil <= 7 ? "bg-amber-50" : "bg-accent"
              }`}>
                <span className={`text-xs font-bold tabular-nums ${
                  m.daysUntil <= 3 ? "text-red-500" : m.daysUntil <= 7 ? "text-amber-500" : "text-muted-foreground"
                }`}>
                  {m.daysUntil === 0 ? "Today" : `${m.daysUntil}d`}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(m.plannedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.projectName}</p>
              </div>
            </Link>
          ))}
          {upcomingMilestones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarClock className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground">No upcoming deadlines in the next 30 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100">
      <span className="text-[10px] text-amber-600">!</span>
    </div>
  );
}
