import Link from "next/link";
import { ListChecks } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function MilestonesPage() {
  const milestones = await prisma.milestone.findMany({
    orderBy: { plannedDate: "asc" },
    include: { project: true },
  });

  const completed = milestones.filter(
    (m) =>
      m.status === "COMPLETED" ||
      m.status === "READY_FOR_INVOICING" ||
      m.status === "INVOICED",
  ).length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((completed / milestones.length) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="Milestones"
        description={`${milestones.length} milestones across all projects`}
        breadcrumbs={[]}
      />

      {/* Progress Bar */}
      {milestones.length > 0 && (
        <div className="border-border/50 bg-card mb-6 rounded-xl border p-5 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Overall completion ·{" "}
              <span className="text-foreground font-semibold">{completed}</span>{" "}
              of {milestones.length}
            </span>
            <span className="text-lg font-bold text-indigo-400">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="mt-3 h-2.5" />
        </div>
      )}

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="border-border/50 bg-accent/50 grid grid-cols-[1fr_180px_100px_130px_110px_100px] gap-0 border-b px-6 py-3.5">
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Milestone
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Project
          </span>
          <span className="text-muted-foreground text-right text-[11px] font-bold tracking-wider uppercase">
            Value
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Planned Date
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Status
          </span>
          <span className="text-muted-foreground text-center text-[11px] font-bold tracking-wider uppercase">
            Del. Note
          </span>
        </div>

        <div className="divide-border/30 divide-y">
          {milestones.map((milestone) => (
            <Link
              key={milestone.id}
              href={`/projects/${milestone.projectId}`}
              className="table-row-hover grid grid-cols-[1fr_180px_100px_130px_110px_100px] items-center gap-0 px-6 py-4"
            >
              <span className="text-foreground text-sm font-semibold">
                {milestone.name}
              </span>
              <span className="truncate text-xs text-indigo-400">
                {milestone.project.name}
              </span>
              <span className="text-foreground text-right font-mono text-sm font-semibold">
                $
                {Number(milestone.value).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                })}
              </span>
              <span className="text-muted-foreground text-xs">
                {new Date(milestone.plannedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <div>
                <StatusBadge status={milestone.status} />
              </div>
              <div className="text-center">
                {milestone.requiresDeliveryNote ? (
                  <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                    Required
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 text-xs">—</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {milestones.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="rounded-2xl bg-indigo-500/10 p-4">
              <ListChecks className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                No milestones yet
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add milestones to your projects to track progress.
              </p>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Go to Projects
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
