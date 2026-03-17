import {
  FolderKanban,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import {
  ProjectStatusChart,
  RevenueBarChart,
  PieLegend,
} from "@/components/common/dashboard-charts";


export default async function DashboardPage() {
  const [
    totalProjects,
    activeProjects,
    closedProjects,
    pendingInvoices,
    paidInvoices,
    allInvoices,
    recentProjects,
    recentMilestones,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "CLOSED" } }),
    prisma.invoice.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID" },
      select: { totalPayable: true },
    }),
    prisma.invoice.findMany({
      select: {
        totalPayable: true,
        status: true,
        milestones: { select: { project: { select: { name: true } } } },
      },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { name: true } }, _count: { select: { milestones: true } } },
    }),
    prisma.milestone.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
  ]);

  const totalRevenue = paidInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalPayable),
    0,
  );

  const totalInvoiced = allInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalPayable),
    0,
  );

  const projectStatusData = [
    { name: "Active", value: activeProjects },
    { name: "Closed", value: closedProjects },
  ].filter((d) => d.value > 0);

  const revenueByProject: Record<string, number> = {};
  for (const inv of allInvoices) {
    if (inv.status === "PAID" || inv.status === "APPROVED") {
      const name = inv.milestones[0]?.project.name ?? "Unknown";
      revenueByProject[name] =
        (revenueByProject[name] ?? 0) + Number(inv.totalPayable);
    }
  }
  const revenueData = Object.entries(revenueByProject)
    .map(([name, amount]) => ({
      name: name.length > 12 ? name.slice(0, 12) + "…" : name,
      amount,
    }))
    .slice(0, 6);

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: FolderKanban,
      sub: `${activeProjects} active`,
      accent: "accent-indigo",
      iconBg: "bg-teal-500/10 text-teal-400",
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: TrendingUp,
      sub: "In progress",
      accent: "accent-emerald",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Pending Invoices",
      value: pendingInvoices,
      icon: Clock,
      sub: `$${totalInvoiced.toLocaleString("en-US", { maximumFractionDigits: 0 })} total`,
      accent: "accent-amber",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Revenue Collected",
      value: `$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      sub: `${paidInvoices.length} paid invoices`,
      accent: "accent-rose",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`card-hover bg-card rounded-xl p-6 ${stat.accent} shadow-lg shadow-black/20`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {stat.title}
                </p>
                <p className="text-foreground mt-3 text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-muted-foreground text-xs">
                    {stat.sub}
                  </span>
                </div>
              </div>
              <div className={`rounded-xl p-3 ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border-border/50 bg-card rounded-xl border p-6 shadow-lg shadow-black/10">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Project Distribution
          </h3>
          {projectStatusData.length > 0 ? (
            <>
              <ProjectStatusChart data={projectStatusData} />
              <PieLegend data={projectStatusData} />
            </>
          ) : (
            <p className="text-muted-foreground flex h-60 items-center justify-center text-sm">
              No project data yet.
            </p>
          )}
        </div>

        <div className="border-border/50 bg-card rounded-xl border p-6 shadow-lg shadow-black/10">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Revenue by Project
          </h3>
          <div className="mt-4">
            {revenueData.length > 0 ? (
              <RevenueBarChart data={revenueData} />
            ) : (
              <p className="text-muted-foreground flex h-60 items-center justify-center text-sm">
                No revenue data yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="overflow-hidden rounded-xl border border-border/15 bg-card/30">
          <div className="flex items-center justify-between border-b border-border/10 px-5 py-3.5">
            <span className="text-sm font-semibold text-foreground">Recent Projects</span>
            <Link href="/projects" className="text-[11px] font-semibold text-teal-400 transition-colors hover:text-teal-300">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/8">
                <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Project</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Client</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Milestones</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project, idx) => (
                <tr key={project.id} className={`transition-colors hover:bg-white/[0.015] ${idx < recentProjects.length - 1 ? "border-b border-border/6" : ""}`}>
                  <td className="px-5 py-3">
                    <Link href={`/projects/${project.id}`} className="font-medium text-foreground/85 hover:text-teal-400 transition-colors">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/50">{project.client.name}</td>
                  <td className="px-4 py-3 text-center text-xs tabular-nums text-muted-foreground/50">{project._count.milestones}</td>
                  <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentProjects.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground/40">No projects yet.</p>
          )}
        </div>

        {/* Recent Milestones */}
        <div className="overflow-hidden rounded-xl border border-border/15 bg-card/30">
          <div className="flex items-center justify-between border-b border-border/10 px-5 py-3.5">
            <span className="text-sm font-semibold text-foreground">Recent Milestones</span>
            <Link href="/milestones" className="text-[11px] font-semibold text-teal-400 transition-colors hover:text-teal-300">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/8">
                <th className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Milestone</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Project</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Value</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentMilestones.map((milestone, idx) => (
                <tr key={milestone.id} className={`transition-colors hover:bg-white/[0.015] ${idx < recentMilestones.length - 1 ? "border-b border-border/6" : ""}`}>
                  <td className="px-5 py-3">
                    <Link href={`/projects/${milestone.projectId}`} className="font-medium text-foreground/85 hover:text-teal-400 transition-colors">
                      {milestone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${milestone.projectId}`} className="text-xs text-muted-foreground/50 hover:text-teal-400 transition-colors">
                      {milestone.project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-foreground/70">
                    ${Number(milestone.value).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={milestone.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentMilestones.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground/40">No milestones yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
