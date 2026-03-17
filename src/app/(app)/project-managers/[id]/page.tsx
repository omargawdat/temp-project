import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { PMSheet } from "@/components/common/pm-sheet";
import { serializeForClient } from "@/lib/serialize";
import { BillingRingChart, ProjectBreakdownChart } from "@/components/common/pm-charts";
import { sumUniqueInvoices } from "@/lib/financial";

export default async function ProjectManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pm = await prisma.projectManager.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { name: true } },
          milestones: {
            orderBy: { plannedDate: "asc" },
            include: {
              invoice: { select: { id: true, status: true, totalPayable: true } },
            },
          },
        },
      },
    },
  });

  if (!pm) notFound();

  const initials = pm.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalProjects = pm.projects.length;
  const activeProjects = pm.projects.filter((p) => p.status === "ACTIVE").length;
  const allMilestones = pm.projects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = allMilestones.filter(
    (m) => m.status === "COMPLETED" || m.status === "READY_FOR_INVOICING" || m.status === "INVOICED",
  ).length;
  const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
  const now = new Date();
  const overdueMilestones = allMilestones.filter(
    (m) =>
      m.status !== "COMPLETED" &&
      m.status !== "READY_FOR_INVOICING" &&
      m.status !== "INVOICED" &&
      new Date(m.plannedDate) < now,
  );
  const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const totalContractValue = pm.projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
  const totalInvoiced = sumUniqueInvoices(allMilestones);
  const totalPaid = sumUniqueInvoices(allMilestones, "PAID");
  const billingPercent = totalContractValue > 0 ? Math.round((totalInvoiced / totalContractValue) * 100) : 0;
  const collectionPercent = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Upcoming milestones (next 30 days, not completed)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingMilestones = allMilestones
    .filter(
      (m) =>
        m.status !== "COMPLETED" &&
        m.status !== "READY_FOR_INVOICING" &&
        m.status !== "INVOICED" &&
        new Date(m.plannedDate) >= now &&
        new Date(m.plannedDate) <= thirtyDaysFromNow,
    )
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  // Find project name for a milestone
  const milestoneProjectMap = new Map<string, { projectName: string; projectId: string }>();
  for (const project of pm.projects) {
    for (const m of project.milestones) {
      milestoneProjectMap.set(m.id, { projectName: project.name, projectId: project.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {pm.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pm.photoUrl}
              alt={pm.name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-500/20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-700 text-base font-bold text-white ring-2 ring-teal-500/20">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{pm.name}</h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              {pm.title && <span>{pm.title}</span>}
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                {pm.email}
              </span>
              {pm.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/40" />
                  {pm.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/40" />
                Joined {new Date(pm.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        <PMSheet pm={serializeForClient(pm)} variant="edit" />
      </div>

      {/* ── Financial overview ── */}
      {totalProjects > 0 && (
        <div className="grid grid-cols-[1fr_auto] gap-4">
          {/* Left: 3 stat cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Portfolio */}
            <div className="relative overflow-hidden rounded-xl border border-teal-500/15 p-5" style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(16,24,40,0.8) 100%)" }}>
              <p className="text-sm font-semibold text-muted-foreground">Portfolio</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">${totalContractValue.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-teal-400/80">{totalProjects} projects <span className="text-teal-400/50">· {activeProjects} active</span></p>
            </div>

            {/* Billed */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/15 p-5" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(16,24,40,0.8) 100%)" }}>
              <p className="text-sm font-semibold text-muted-foreground">Billed</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">${totalInvoiced.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-amber-400/80">{(totalContractValue - totalInvoiced).toLocaleString()} <span className="text-amber-400/50">unbilled</span></p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-500/10">
                  <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${billingPercent}%` }} />
                </div>
                <span className="text-sm tabular-nums text-muted-foreground/60">{billingPercent}%</span>
              </div>
            </div>

            {/* Collected */}
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/15 p-5" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(16,24,40,0.8) 100%)" }}>
              <p className="text-sm font-semibold text-muted-foreground">Collected</p>
              <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">${totalPaid.toLocaleString()}</p>
              <p className="mt-1 text-sm font-medium text-emerald-400/80">{(totalInvoiced - totalPaid).toLocaleString()} <span className="text-emerald-400/50">outstanding</span></p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-500/10">
                  <div className="h-full rounded-full bg-emerald-500/70 transition-all" style={{ width: `${collectionPercent}%` }} />
                </div>
                <span className="text-sm tabular-nums text-muted-foreground/60">{collectionPercent}%</span>
              </div>
            </div>
          </div>

          {/* Right: Donut chart */}
          <div className="w-[240px] rounded-xl border border-border/20 bg-card/40 p-5 flex flex-col items-center justify-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 self-start">Cash Flow</p>
            <BillingRingChart billed={totalInvoiced} collected={totalPaid} total={totalContractValue} />
          </div>
        </div>
      )}

      {/* ── Delivery stats bar ── */}
      {totalProjects > 0 && (
        <div className="flex items-center gap-6 rounded-xl border border-border/15 bg-card/30 px-6 py-3.5">
          <div className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/60" />
            <span className="text-muted-foreground/70">Milestones:</span>
            <span className="font-semibold text-foreground/85">{completedMilestones}/{totalMilestones} done</span>
            <span className="text-muted-foreground/40">({completionRate}%)</span>
          </div>
          <div className="h-4 w-px bg-border/20" />
          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="h-4 w-4 text-blue-400/60" />
            <span className="font-semibold text-foreground/85">{inProgressMilestones}</span>
            <span className="text-muted-foreground/70">in progress</span>
          </div>
          {overdueMilestones.length > 0 && (
            <>
              <div className="h-4 w-px bg-border/20" />
              <div className="flex items-center gap-2.5 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-400/80" />
                <span className="font-semibold text-red-400">{overdueMilestones.length}</span>
                <span className="text-red-400/60">overdue</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Overdue + Upcoming milestones ── */}
      {(overdueMilestones.length > 0 || upcomingMilestones.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Overdue */}
          {overdueMilestones.length > 0 && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">Overdue Milestones</span>
                <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">{overdueMilestones.length}</span>
              </div>
              <div className="space-y-2">
                {overdueMilestones.slice(0, 5).map((m) => {
                  const proj = milestoneProjectMap.get(m.id);
                  const daysOverdue = Math.ceil((now.getTime() - new Date(m.plannedDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-red-500/[0.04] px-3 py-2">
                      <div className="min-w-0">
                        <Link href={`/milestones/${m.id}`} className="text-sm font-medium text-foreground/90 hover:text-red-400 transition-colors">{m.name}</Link>
                        {proj && <p className="text-xs text-muted-foreground/50">{proj.projectName}</p>}
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-red-400/80">{daysOverdue}d overdue</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingMilestones.length > 0 && (
            <div className="rounded-xl border border-border/20 bg-card/40 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-bold text-foreground">Upcoming (30 days)</span>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-muted-foreground/60">{upcomingMilestones.length}</span>
              </div>
              <div className="space-y-2">
                {upcomingMilestones.slice(0, 5).map((m) => {
                  const proj = milestoneProjectMap.get(m.id);
                  const daysUntil = Math.ceil((new Date(m.plannedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <div className="min-w-0">
                        <Link href={`/milestones/${m.id}`} className="text-sm font-medium text-foreground/90 hover:text-teal-400 transition-colors">{m.name}</Link>
                        {proj && <p className="text-xs text-muted-foreground/50">{proj.projectName}</p>}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold ${daysUntil <= 7 ? "text-amber-400/80" : "text-muted-foreground/50"}`}>
                        {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Projects table ── */}
      <div className="overflow-hidden rounded-xl border border-border/20 bg-card/40">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-teal-500/12 p-2">
              <FolderKanban className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-base font-bold text-foreground">Assigned Projects</span>
            <span className="rounded-md bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
              {pm.projects.length}
            </span>
          </div>
        </div>

        {pm.projects.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Project</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Client</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Value</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billed</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Progress</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {pm.projects.map((project, idx) => {
                const done = project.milestones.filter(
                  (m) => m.status === "COMPLETED" || m.status === "READY_FOR_INVOICING" || m.status === "INVOICED",
                ).length;
                const pct = project.milestones.length > 0 ? Math.round((done / project.milestones.length) * 100) : 0;
                const projBilled = sumUniqueInvoices(project.milestones);
                const projValue = Number(project.contractValue);
                const billedPct = projValue > 0 ? Math.round((projBilled / projValue) * 100) : 0;

                // Timeline
                const start = new Date(project.startDate);
                const end = new Date(project.endDate);
                const totalDur = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timePct = totalDur > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100))) : 0;

                return (
                  <tr
                    key={project.id}
                    className={`group transition-colors hover:bg-teal-500/[0.03] ${idx < pm.projects.length - 1 ? "border-b border-border/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/projects/${project.id}`} className="text-[15px] font-semibold text-foreground hover:text-teal-400 transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/70">{project.client.name}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-foreground/80 whitespace-nowrap">
                      {projValue.toLocaleString("en-US", {
                        style: "currency",
                        currency: project.currency,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm tabular-nums text-foreground/70">${projBilled.toLocaleString()}</span>
                      <span className="ml-1 text-xs text-muted-foreground/40">({billedPct}%)</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-teal-500/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground/60">{done}/{project.milestones.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className={`h-full rounded-full transition-all ${timePct >= 90 ? "bg-red-500/70" : timePct >= 70 ? "bg-amber-500/70" : "bg-blue-500/50"}`} style={{ width: `${timePct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground/50">{timePct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-14 text-center text-sm text-muted-foreground/40">
            No projects assigned yet.
          </div>
        )}
      </div>
    </div>
  );
}
