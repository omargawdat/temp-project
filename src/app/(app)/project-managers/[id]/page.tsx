import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Target,
  FileSignature,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
import { serializeForClient } from "@/lib/serialize";
import { PMFloatingActions } from "@/components/project-managers/floating-actions";
import { PMSheet } from "@/components/common/pm-sheet";
import { NotesSection } from "@/components/common/notes-section";
import { ContactDetailRow } from "@/components/clients/contact-detail-row";
import { filterOverdue, filterUpcoming, countCompleted, completionPercent, daysDifference } from "@/lib/milestones";
import { getInitials, formatDate } from "@/lib/format";

export default async function ProjectManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pm, notes] = await Promise.all([
    prisma.projectManager.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { updatedAt: "desc" },
          include: {
            client: { select: { name: true } },
            milestones: {
              orderBy: { plannedDate: "asc" },
              include: {
                deliveryNote: true,
                invoice: { include: { payments: true } },
              },
            },
          },
        },
      },
    }),
    prisma.note.findMany({
      where: { entityType: "PROJECT_MANAGER", entityId: id },
      orderBy: { createdAt: "desc" },
      include: { attachments: true },
    }),
  ]);

  if (!pm) notFound();

  const initials = getInitials(pm.name);

  const totalProjects = pm.projects.length;
  const allMilestones = pm.projects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = countCompleted(allMilestones);
  const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
  const now = new Date();
  const overdueMilestones = filterOverdue(allMilestones, now);
  const completionRate = completionPercent(allMilestones);

  const upcomingMilestones = filterUpcoming(allMilestones, 30, now)
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  // Find project name for a milestone
  const milestoneProjectMap = new Map<string, { projectName: string; projectId: string }>();
  for (const project of pm.projects) {
    for (const m of project.milestones) {
      milestoneProjectMap.set(m.id, { projectName: project.name, projectId: project.id });
    }
  }

  // Delivery note tracking
  const milestonesRequiringDN = allMilestones.filter((m) => m.requiresDeliveryNote);
  const dnPending = milestonesRequiringDN.filter((m) => !m.deliveryNote);
  const dnDraft = milestonesRequiringDN.filter((m) => m.deliveryNote?.status === "DRAFT");
  const dnSent = milestonesRequiringDN.filter((m) => m.deliveryNote?.status === "SENT");
  const dnSigned = milestonesRequiringDN.filter((m) => m.deliveryNote?.status === "SIGNED");

  return (
    <div className="space-y-6">
      {/* ── A. Header ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-accent">
        <div className="relative px-6 py-5">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />

          {/* Top: Avatar + Name + Badge */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {pm.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pm.photoUrl}
                  alt={pm.name}
                  className="h-14 w-14 rounded-xl object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-base font-bold text-foreground ring-2 ring-primary/20">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{pm.name}</h1>
                  {pm.title && (
                    <span className="rounded-md bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {pm.title}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Joined {new Date(pm.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
            <PMSheet pm={serializeForClient(pm)} variant="edit" />
          </div>

          {/* Contact details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 rounded-xl bg-accent px-4 py-3.5">
            {pm.email && (
              <ContactDetailRow value={pm.email} icon="mail" href={`mailto:${pm.email}`} />
            )}
            {pm.phone && (
              <ContactDetailRow value={pm.phone} icon="phone" href={`tel:${pm.phone}`} />
            )}
          </div>
        </div>
      </div>

      {/* ── B. Milestone Tracker ── */}
      {totalProjects > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card card-elevated">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Milestone Tracker</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-bold tabular-nums text-foreground">{completedMilestones}/{totalMilestones}</span>
                <span className="text-xs text-muted-foreground">done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400/60" />
                <span className="text-xs font-bold tabular-nums text-foreground">{inProgressMilestones}</span>
                <span className="text-xs text-muted-foreground">in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500/50 to-blue-400" style={{ width: `${completionRate}%` }} />
                </div>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">{completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Milestones list */}
          <div className="divide-y divide-border/30">
            {/* Overdue section */}
            {overdueMilestones.length > 0 && (
              <div className="px-6 py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500">Overdue</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold tabular-nums text-red-600">{overdueMilestones.length}</span>
                </div>
                <div className="space-y-1.5">
                  {overdueMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysOverdue = daysDifference(m.plannedDate, now);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-4 py-2.5 transition-colors hover:bg-red-50">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-red-600">{daysOverdue}d late</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming section */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary/70">Upcoming</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">{upcomingMilestones.length}</span>
              </div>
              {upcomingMilestones.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingMilestones.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    const daysUntil = -daysDifference(m.plannedDate, now);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-accent px-4 py-2.5 transition-colors hover:bg-muted">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${daysUntil <= 7 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                          {daysUntil === 0 ? "Today" : `in ${daysUntil}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── C. Delivery Notes ── */}
      {milestonesRequiringDN.length > 0 && (
        <div id="delivery-notes-section" className="overflow-hidden rounded-xl border border-border bg-card card-elevated scroll-mt-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <FileSignature className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Delivery Notes</span>
              <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground/60">
                {milestonesRequiringDN.length}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {dnSigned.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-muted-foreground">{dnSigned.length} signed</span>
                </span>
              )}
              {dnSent.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-medium text-muted-foreground">{dnSent.length} sent</span>
                </span>
              )}
              {dnDraft.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-muted-foreground">{dnDraft.length} draft</span>
                </span>
              )}
              {dnPending.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="font-medium text-muted-foreground">{dnPending.length} pending</span>
                </span>
              )}
            </div>
          </div>

          {/* Grouped list */}
          <div className="divide-y divide-border/30">
            {/* Pending — required but not created */}
            {dnPending.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-rose-500">Pending</p>
                <div className="space-y-1.5">
                  {dnPending.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-2.5 transition-colors hover:bg-rose-50">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">Needs DN</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Draft */}
            {dnDraft.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-500">Draft</p>
                <div className="space-y-1.5">
                  {dnDraft.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-accent px-4 py-2.5 transition-colors hover:bg-muted">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <StatusBadge status="DRAFT" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sent */}
            {dnSent.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-blue-500">Sent</p>
                <div className="space-y-1.5">
                  {dnSent.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-accent px-4 py-2.5 transition-colors hover:bg-muted">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <div className="flex items-center gap-2.5">
                          {m.deliveryNote?.sentDate && <span className="text-xs text-muted-foreground">{formatDate(m.deliveryNote.sentDate, "full")}</span>}
                          <StatusBadge status="SENT" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signed */}
            {dnSigned.length > 0 && (
              <div className="px-6 py-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-emerald-500">Signed</p>
                <div className="space-y-1.5">
                  {dnSigned.map((m) => {
                    const proj = milestoneProjectMap.get(m.id);
                    return (
                      <Link key={m.id} href={`/projects/${proj?.projectId}`} className="flex items-center justify-between rounded-lg bg-accent px-4 py-2.5 transition-colors hover:bg-muted">
                        <div className="min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {proj && <p className="mt-0.5 text-xs text-muted-foreground truncate">{proj.projectName}</p>}
                        </div>
                        <div className="flex items-center gap-2.5">
                          {m.deliveryNote?.signedDate && <span className="text-xs text-muted-foreground">{formatDate(m.deliveryNote.signedDate, "full")}</span>}
                          <StatusBadge status="SIGNED" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── D. Projects table ── */}
      <div id="projects-section" className="overflow-hidden rounded-xl border border-border bg-card card-elevated scroll-mt-6">
        <div className="flex items-center justify-between border-b border-border/15 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/12 p-2">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold text-foreground">Assigned Projects</span>
            <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
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
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Progress</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {pm.projects.map((project, idx) => {
                const done = countCompleted(project.milestones);
                const pct = completionPercent(project.milestones);

                // Timeline
                const start = new Date(project.startDate);
                const end = new Date(project.endDate);
                const totalDur = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const timePct = totalDur > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100))) : 0;

                return (
                  <tr
                    key={project.id}
                    className={`group transition-colors hover:bg-accent ${idx < pm.projects.length - 1 ? "border-b border-border/10" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <Link href={`/projects/${project.id}`} className="text-base font-semibold text-foreground hover:text-primary/80 transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground/70">{project.client.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-muted-foreground/60">{done}/{project.milestones.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full transition-all ${timePct >= 90 ? "bg-red-500/70" : timePct >= 70 ? "bg-amber-500/70" : "bg-blue-500/50"}`} style={{ width: `${timePct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{timePct}%</span>
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
          <div className="py-14 text-center text-sm text-muted-foreground">
            No projects assigned yet.
          </div>
        )}
      </div>

      {/* ── D. Notes ── */}
      <div id="notes-section" className="scroll-mt-6">
        <NotesSection entityType="PROJECT_MANAGER" entityId={pm.id} notes={serializeForClient(notes)} />
      </div>

      <div className="h-16" />

      <PMFloatingActions notesCount={notes.length} dnPendingCount={dnPending.length + dnDraft.length} />
    </div>
  );
}
