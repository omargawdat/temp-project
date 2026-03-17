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

const INITIALS_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DashboardPage() {
  const [
    totalProjects,
    activeProjects,
    closedProjects,
    fullyInvoicedProjects,
    pendingInvoices,
    paidInvoices,
    allInvoices,
    recentProjects,
    recentMilestones,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "CLOSED" } }),
    prisma.project.count({ where: { status: "FULLY_INVOICED" } }),
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
        milestone: { select: { project: { select: { name: true } } } },
      },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { milestones: true } } },
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
    { name: "Fully Invoiced", value: fullyInvoicedProjects },
    { name: "Closed", value: closedProjects },
  ].filter((d) => d.value > 0);

  const revenueByProject: Record<string, number> = {};
  for (const inv of allInvoices) {
    if (inv.status === "PAID" || inv.status === "APPROVED") {
      const name = inv.milestone.project.name;
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
      iconBg: "bg-indigo-500/10 text-indigo-400",
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

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border-border/50 bg-card rounded-xl border shadow-lg shadow-black/10">
          <div className="border-border/50 flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Recent Projects
            </h3>
            <Link
              href="/projects"
              className="text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-border/30 divide-y">
            {recentProjects.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${INITIALS_COLORS[i % INITIALS_COLORS.length]} text-xs font-bold text-white shadow-lg`}
                >
                  {getInitials(project.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {project.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {project.clientName} · {project._count.milestones}{" "}
                    milestones
                  </p>
                </div>
                <StatusBadge status={project.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-xl border shadow-lg shadow-black/10">
          <div className="border-border/50 flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Recent Milestones
            </h3>
            <Link
              href="/milestones"
              className="text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-border/30 divide-y">
            {recentMilestones.map((milestone, i) => (
              <Link
                key={milestone.id}
                href={`/projects/${milestone.projectId}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${INITIALS_COLORS[(i + 2) % INITIALS_COLORS.length]} text-xs font-bold text-white shadow-lg`}
                >
                  {getInitials(milestone.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {milestone.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {milestone.project.name} · $
                    {Number(milestone.value).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={milestone.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
