import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DollarSign,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Monitor,
  Mail,
  User,
  Hash,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Target,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { MilestoneForm } from "@/components/common/milestone-form";
import { ProjectSheet } from "@/components/common/project-sheet";
import { ProjectStatusActions } from "@/components/common/project-status-actions";
import { serializeForClient } from "@/lib/serialize";

function getLifecycleStep(status: string): number {
  if (status === "CLOSED") return 2;
  if (status === "FULLY_INVOICED") return 1;
  return 0; // ACTIVE and ON_HOLD both show as step 0
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, projectManagers] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        projectManager: true,
        milestones: {
          orderBy: { plannedDate: "asc" },
          include: { deliveryNote: true, invoice: true },
        },
      },
    }),
    prisma.projectManager.findMany({
      select: { id: true, name: true, title: true, photoUrl: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const totalMilestoneValue = project.milestones.reduce((sum, m) => sum + Number(m.value), 0);
  const completedMilestones = project.milestones.filter(
    (m) => m.status === "COMPLETED" || m.status === "READY_FOR_INVOICING" || m.status === "INVOICED",
  ).length;
  const progressPercent = project.milestones.length > 0
    ? Math.round((completedMilestones / project.milestones.length) * 100) : 0;
  const invoicedAmount = project.milestones
    .filter((m) => m.invoice)
    .reduce((sum, m) => sum + Number(m.invoice!.totalPayable), 0);
  const lifecycleStep = getLifecycleStep(project.status);

  const alerts: { type: "warning" | "info"; message: string }[] = [];
  if (project.milestones.length === 0 && project.status === "ACTIVE") {
    alerts.push({ type: "warning", message: "No milestones defined yet." });
  }
  if (project.milestones.filter((m) => m.requiresDeliveryNote && !m.deliveryNote && m.status === "COMPLETED").length > 0) {
    alerts.push({ type: "warning", message: "Completed milestone(s) missing delivery note." });
  }
  if (project.milestones.filter((m) => m.status === "READY_FOR_INVOICING" && !m.invoice).length > 0) {
    alerts.push({ type: "info", message: "Milestone(s) ready for invoicing." });
  }

  const contractValue = Number(project.contractValue);
  const contractValueFormatted = contractValue.toLocaleString("en-US", {
    style: "currency", currency: project.currency, maximumFractionDigits: 0,
  });

  const stages = [
    { label: "Active", icon: Clock, done: lifecycleStep > 0, current: lifecycleStep === 0 },
    { label: "Invoiced", icon: DollarSign, done: lifecycleStep > 1, current: lifecycleStep === 1 },
    { label: "Closed", icon: CheckCircle2, done: false, current: lifecycleStep === 2 },
  ];

  const allocatedPercent = contractValue > 0 ? Math.min(100, Math.round((totalMilestoneValue / contractValue) * 100)) : 0;
  const invoicedPercent = contractValue > 0 ? Math.min(100, Math.round((invoicedAmount / contractValue) * 100)) : 0;

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const timePercent = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100))) : 0;

  const pmInitials = project.projectManager.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {project.clientName}
            </span>
            <span className="text-border/40">|</span>
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <Hash className="h-3 w-3" />
              {project.contractNumber}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProjectStatusActions projectId={project.id} currentStatus={project.status} />
          <ProjectSheet
            project={serializeForClient(project)}
            projectManagers={projectManagers}
            trigger="icon"
          />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${
              alert.type === "warning"
                ? "bg-amber-500/8 text-amber-400/90 ring-1 ring-amber-500/10"
                : "bg-indigo-500/8 text-indigo-400/90 ring-1 ring-indigo-500/10"
            }`}>
              {alert.type === "warning" ? <AlertTriangle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Metrics row ── */}
      <div className="grid grid-cols-2 gap-6 border-b border-border/15 pb-6 lg:grid-cols-4">
        {/* Contract Value */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Contract Value</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{contractValueFormatted}</p>
          <p className="text-[11px] text-muted-foreground/50">{project.currency} · {project.paymentTerms}</p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Progress</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{progressPercent}<span className="text-sm font-semibold text-muted-foreground/50">%</span></p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground/50">{completedMilestones}/{project.milestones.length}</span>
          </div>
        </div>

        {/* Allocated */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Allocated</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {totalMilestoneValue >= 1000
              ? <>{(totalMilestoneValue / 1000).toFixed(0)}<span className="text-sm font-semibold text-muted-foreground/50">k</span></>
              : totalMilestoneValue.toLocaleString()
            }
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full bg-emerald-500/70 transition-all" style={{ width: `${allocatedPercent}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground/50">{allocatedPercent}%</span>
          </div>
        </div>

        {/* Invoiced */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Invoiced</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {invoicedAmount >= 1000
              ? <>{(invoicedAmount / 1000).toFixed(0)}<span className="text-sm font-semibold text-muted-foreground/50">k</span></>
              : invoicedAmount.toLocaleString()
            }
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${invoicedPercent}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground/50">{project.milestones.filter((m) => m.invoice).length} inv</span>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

        {/* ── Left sidebar: Details ── */}
        <div className="space-y-5">
          {/* PM card */}
          <Link href={`/project-managers/${project.projectManager.id}`} className="block rounded-xl border border-border/25 bg-card/60 p-5 transition-colors hover:border-indigo-500/20 hover:bg-card/80">
            <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Project Manager</p>
            <div className="flex items-center gap-3">
              {project.projectManager.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.projectManager.photoUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-400 ring-2 ring-indigo-500/20">
                  {pmInitials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{project.projectManager.name}</p>
                <p className="text-[11px] text-muted-foreground/60">{project.projectManager.title || "Project Manager"}</p>
              </div>
            </div>
          </Link>

          {/* Details list */}
          <div className="rounded-xl border border-border/25 bg-card/60 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Details</p>
            <div className="space-y-3.5">
              {[
                {
                  icon: project.clientInvoicingMethod === "PORTAL" ? Monitor : Mail,
                  label: "Invoicing",
                  value: project.clientInvoicingMethod === "PORTAL" ? "Portal" : "Email",
                },
                {
                  icon: Calendar,
                  label: "Start",
                  value: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                },
                {
                  icon: Calendar,
                  label: "End",
                  value: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground/70">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className="font-medium text-foreground/90">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Timeline bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/40">
                <span>Timeline</span>
                <span>{timePercent}% elapsed</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className={`h-full rounded-full transition-all ${timePercent >= 90 ? "bg-red-500/60" : timePercent >= 70 ? "bg-amber-500/60" : "bg-indigo-500/40"}`}
                  style={{ width: `${timePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lifecycle stepper */}
          <div className="rounded-xl border border-border/25 bg-card/60 p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Lifecycle</p>
            <div className="relative space-y-0">
              {stages.map((s, i) => (
                <div key={s.label} className="flex items-start gap-3">
                  {/* Vertical connector + circle */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      s.done
                        ? "bg-emerald-500/15 ring-1 ring-emerald-500/30"
                        : s.current
                          ? "bg-indigo-500/15 ring-1 ring-indigo-500/30"
                          : "bg-white/[0.03] ring-1 ring-border/30"
                    }`}>
                      {s.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <s.icon className={`h-3.5 w-3.5 ${s.current ? "text-indigo-400" : "text-muted-foreground/20"}`} />
                      )}
                    </div>
                    {i < stages.length - 1 && (
                      <div className={`mt-0.5 h-5 w-px ${s.done ? "bg-emerald-500/30" : "bg-border/20"}`} />
                    )}
                  </div>
                  <span className={`pt-1 text-xs font-medium ${
                    s.done ? "text-emerald-400" : s.current ? "text-foreground" : "text-muted-foreground/25"
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Milestones ── */}
        <div className="space-y-0">
          <div className="overflow-hidden rounded-xl border border-border/25 bg-card/40">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-border/15 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400/70" />
                <span className="text-sm font-semibold text-foreground">Milestones</span>
                <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground/50">
                  {project.milestones.length}
                </span>
              </div>
            </div>

            {project.milestones.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/10 bg-white/[0.01]">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Name</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Value</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Delivery Note</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {project.milestones.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`group transition-colors hover:bg-indigo-500/[0.03] ${
                        idx < project.milestones.length - 1 ? "border-b border-border/8" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/milestones/${m.id}`} className="font-medium text-foreground/90 hover:text-indigo-400 transition-colors">
                          {m.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-foreground/80">
                        ${Number(m.value).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground/60">
                        {new Date(m.plannedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {m.requiresDeliveryNote ? (
                          m.deliveryNote ? (
                            <StatusBadge status={m.deliveryNote.status} />
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/8 px-2 py-0.5 text-[10px] font-medium text-amber-400/70 ring-1 ring-amber-500/10">
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-muted-foreground/15">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {m.invoice ? (
                          <StatusBadge status={m.invoice.status} />
                        ) : (
                          <span className="text-[11px] text-muted-foreground/15">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 rounded-full bg-white/[0.03] p-3">
                  <Target className="h-5 w-5 text-muted-foreground/20" />
                </div>
                <p className="text-sm text-muted-foreground/50">No milestones defined yet</p>
                <p className="mt-1 text-[11px] text-muted-foreground/30">Add your first milestone below</p>
              </div>
            )}

            {project.status === "ACTIVE" && (
              <MilestoneForm projectId={project.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
