import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import { PMSheet } from "@/components/common/pm-sheet";
import { serializeForClient } from "@/lib/serialize";

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
          milestones: {
            include: {
              invoice: { select: { status: true, totalPayable: true } },
              deliveryNote: { select: { id: true } },
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

  // --- Compute insights ---
  const totalProjects = pm.projects.length;
  const activeProjects = pm.projects.filter((p) => p.status === "ACTIVE").length;
  const closedProjects = pm.projects.filter((p) => p.status === "CLOSED").length;
  const invoicedProjects = pm.projects.filter((p) => p.status === "FULLY_INVOICED").length;

  const allMilestones = pm.projects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = allMilestones.filter(
    (m) => m.status === "COMPLETED" || m.status === "READY_FOR_INVOICING" || m.status === "INVOICED",
  ).length;
  const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
  const overdueMilestones = allMilestones.filter(
    (m) =>
      m.status !== "COMPLETED" &&
      m.status !== "READY_FOR_INVOICING" &&
      m.status !== "INVOICED" &&
      new Date(m.plannedDate) < new Date(),
  ).length;
  const completionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const totalContractValue = pm.projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
  const totalInvoiced = allMilestones.reduce(
    (sum, m) => sum + (m.invoice ? Number(m.invoice.totalPayable) : 0),
    0,
  );
  const totalPaid = allMilestones.reduce(
    (sum, m) => sum + (m.invoice?.status === "PAID" ? Number(m.invoice.totalPayable) : 0),
    0,
  );
  const billingProgress = totalContractValue > 0 ? Math.round((totalInvoiced / totalContractValue) * 100) : 0;
  const collectionProgress = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Status breakdown for visual bar
  const statusBreakdown = [
    { label: "Active", count: activeProjects, color: "bg-emerald-500" },
    { label: "Invoiced", count: invoicedProjects, color: "bg-blue-500" },
    { label: "Closed", count: closedProjects, color: "bg-white/20" },
  ].filter((s) => s.count > 0);

  // --- Build alerts ---
  const readyForInvoicing = allMilestones.filter(
    (m) => m.status === "READY_FOR_INVOICING" && !m.invoice,
  ).length;
  const missingDeliveryNotes = allMilestones.filter(
    (m) => m.requiresDeliveryNote && !m.deliveryNote && m.status === "COMPLETED",
  ).length;
  const pendingCollection = totalInvoiced - totalPaid;

  type Alert = { icon: React.ElementType; message: string; type: "danger" | "warning" | "info" };
  const alerts: Alert[] = [];

  if (overdueMilestones > 0) {
    alerts.push({
      icon: AlertCircle,
      message: `${overdueMilestones} milestone${overdueMilestones > 1 ? "s" : ""} overdue`,
      type: "danger",
    });
  }
  if (missingDeliveryNotes > 0) {
    alerts.push({
      icon: FileText,
      message: `${missingDeliveryNotes} completed milestone${missingDeliveryNotes > 1 ? "s" : ""} missing delivery note`,
      type: "warning",
    });
  }
  if (readyForInvoicing > 0) {
    alerts.push({
      icon: CircleDollarSign,
      message: `${readyForInvoicing} milestone${readyForInvoicing > 1 ? "s" : ""} ready for invoicing`,
      type: "info",
    });
  }
  if (pendingCollection > 10000) {
    alerts.push({
      icon: TrendingUp,
      message: `$${Math.round(pendingCollection / 1000)}k pending collection`,
      type: "warning",
    });
  }

  const alertStyles = {
    danger: "ring-red-500/20 bg-red-500/10 text-red-400",
    warning: "ring-amber-500/20 bg-amber-500/10 text-amber-400",
    info: "ring-indigo-500/20 bg-indigo-500/10 text-indigo-400",
  };

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {pm.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pm.photoUrl}
                alt={pm.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border/50"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-lg font-bold text-white ring-2 ring-border/50">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                {pm.name}
              </h1>
              {pm.title && (
                <p className="text-muted-foreground mt-0.5 text-sm">{pm.title}</p>
              )}
            </div>
          </div>
          <PMSheet pm={serializeForClient(pm)} variant="edit" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
            {pm.email}
          </span>
          {pm.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
              {pm.phone}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50" />
            Joined{" "}
            {new Date(pm.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Alerts — inline banner */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {alerts.map((alert, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${alertStyles[alert.type]}`}
            >
              <alert.icon className="h-3 w-3" />
              {alert.message}
            </span>
          ))}
        </div>
      )}

      {/* Insights grid */}
      {totalProjects > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Workload & Performance */}
          <div className="border-border/50 bg-card rounded-xl border p-5">
            <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Workload & Performance
            </h3>

            {/* Project status bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Projects</span>
                <span className="text-foreground font-semibold">{totalProjects}</span>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-accent/50">
                {statusBreakdown.map((s) => (
                  <div
                    key={s.label}
                    className={`${s.color} transition-all`}
                    style={{ width: `${(s.count / totalProjects) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {statusBreakdown.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.count} {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Milestone completion */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Milestone Completion</span>
                <span className="text-foreground font-semibold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="mt-2 h-2" />
              <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  {completedMilestones} done
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  {inProgressMilestones} in progress
                </span>
                {overdueMilestones > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    {overdueMilestones} overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-border/50 bg-card rounded-xl border p-5">
            <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Financial Summary
            </h3>

            {/* Contract value */}
            <div className="mt-4">
              <p className="text-foreground text-2xl font-bold tabular-nums">
                ${totalContractValue >= 1000 ? `${Math.round(totalContractValue / 1000)}k` : totalContractValue}
              </p>
              <p className="text-muted-foreground/60 text-xs">Total contract value</p>
            </div>

            {/* Billing progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Invoiced</span>
                <span className="text-foreground font-semibold">
                  ${totalInvoiced >= 1000 ? `${Math.round(totalInvoiced / 1000)}k` : totalInvoiced}
                  <span className="text-muted-foreground/50 ml-1 font-normal">
                    ({billingProgress}%)
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent/50">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(billingProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Collection progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Collected</span>
                <span className="text-foreground font-semibold">
                  ${totalPaid >= 1000 ? `${Math.round(totalPaid / 1000)}k` : totalPaid}
                  <span className="text-muted-foreground/50 ml-1 font-normal">
                    ({collectionProgress}%)
                  </span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent/50">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(collectionProgress, 100)}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Projects table */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Assigned Projects · {pm.projects.length}
        </h3>

        <div className="border-border/50 bg-card overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-border/50 bg-accent/40 border-b">
                <th className="text-muted-foreground/60 px-6 py-3.5 text-left text-[10px] font-semibold tracking-wider uppercase">
                  Project
                </th>
                <th className="text-muted-foreground/60 px-4 py-3.5 text-left text-[10px] font-semibold tracking-wider uppercase">
                  Client
                </th>
                <th className="text-muted-foreground/60 px-4 py-3.5 text-right text-[10px] font-semibold tracking-wider uppercase">
                  Value
                </th>
                <th className="text-muted-foreground/60 px-4 py-3.5 text-left text-[10px] font-semibold tracking-wider uppercase">
                  Milestones
                </th>
                <th className="text-muted-foreground/60 px-4 py-3.5 text-left text-[10px] font-semibold tracking-wider uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/20 divide-y">
              {pm.projects.map((project) => {
                const completed = project.milestones.filter(
                  (m) =>
                    m.status === "COMPLETED" ||
                    m.status === "READY_FOR_INVOICING" ||
                    m.status === "INVOICED",
                ).length;

                return (
                  <tr
                    key={project.id}
                    className="hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-foreground text-sm font-medium transition-colors hover:text-indigo-400"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-sm">
                      {project.clientName}
                    </td>
                    <td className="text-foreground px-4 py-4 text-right font-mono text-sm whitespace-nowrap">
                      {Number(project.contractValue).toLocaleString("en-US", {
                        style: "currency",
                        currency: project.currency,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="text-muted-foreground px-4 py-4 text-xs whitespace-nowrap">
                      {completed}/{project.milestones.length} done
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pm.projects.length === 0 && (
            <div className="text-muted-foreground py-14 text-center text-sm">
              No projects assigned to this manager yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
