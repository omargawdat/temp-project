import Link from "next/link";
import { FolderKanban, Receipt, Users2 } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { getInitials, safePercent, formatCurrency } from "@/lib/format";

interface RecentProject {
  id: string;
  name: string;
  status: string;
  client: { name: string };
  done: number;
  total: number;
  pct: number;
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  totalPayable: unknown;
  status: string;
  paymentDueDate: Date | null;
  milestones: { project: { name: string } }[];
}

interface PmWorkload {
  id: string;
  name: string;
  photoUrl: string | null;
  activeProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  overdue: number;
}

interface TabActivityProps {
  recentProjects: RecentProject[];
  recentInvoices: RecentInvoice[];
  pmWorkload: PmWorkload[];
  now: Date;
}

export function TabActivity({ recentProjects, recentInvoices, pmWorkload, now }: TabActivityProps) {
  return (
    <div className="space-y-4">
      {/* Top: Recent Projects + Recent Invoices */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="overflow-hidden rounded-xl bg-card card-elevated">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Recent Projects</span>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm" aria-label="Recent projects">
            <thead>
              <tr className="border-b border-border/50">
                <th scope="col" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((p, idx) => (
                <tr key={p.id} className={`transition-colors hover:bg-accent ${idx < recentProjects.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-5 py-2.5">
                    <Link href={`/projects/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.client.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{p.done}/{p.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentProjects.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No projects yet</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="overflow-hidden rounded-xl bg-card card-elevated">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold text-foreground">Recent Invoices</span>
            </div>
            <Link href="/invoices" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm" aria-label="Recent invoices">
            <thead>
              <tr className="border-b border-border/50">
                <th scope="col" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, idx) => {
                const isOverdue = inv.paymentDueDate && new Date(inv.paymentDueDate) < now && inv.status !== "PAID";
                return (
                  <tr key={inv.id} className={`transition-colors hover:bg-accent ${idx < recentInvoices.length - 1 ? "border-b border-border/50" : ""}`}>
                    <td className="px-5 py-2.5">
                      <span className={`font-mono text-xs font-medium ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{inv.milestones[0]?.project.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-medium tabular-nums text-foreground">
                      {Number(inv.totalPayable).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentInvoices.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No invoices yet</p>
          )}
        </div>
      </div>

      {/* Bottom: Team Workload */}
      <div className="rounded-xl bg-card card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-foreground">Team Workload</span>
          </div>
          <Link href="/project-managers" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
            View all →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pmWorkload.map((pm) => {
            const pct = safePercent(pm.completedMilestones, pm.totalMilestones);
            const initials = getInitials(pm.name);
            return (
              <Link
                key={pm.id}
                href={`/project-managers/${pm.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                {pm.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pm.photoUrl} alt={pm.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-ring/20" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-ring/20">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{pm.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground ml-2">{pm.activeProjects} active</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                    {pm.overdue > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 py-px text-xs font-bold tabular-nums text-red-600">{pm.overdue}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {pmWorkload.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-8 text-xs text-muted-foreground">No team data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
