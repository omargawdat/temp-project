import Link from "next/link";
import { ListChecks, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/milestones/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MilestonesToolbar } from "@/components/milestones/milestones-toolbar";
import {
  buildMilestoneWhere,
  buildMilestoneOrderBy,
  hasActiveFilters,
} from "@/lib/milestone-queries";

export default async function MilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    project: typeof params.project === "string" ? params.project : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildMilestoneWhere(filterParams);
  const orderBy = buildMilestoneOrderBy(sortParams);
  const filtersActive = hasActiveFilters(filterParams);

  const [milestones, allProjects, totalCount] = await Promise.all([
    prisma.milestone.findMany({ where, orderBy, include: { project: true } }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.milestone.count(),
  ]);

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
        description={`${totalCount} milestones across all projects`}
        breadcrumbs={[]}
      />

      {/* Toolbar */}
      <MilestonesToolbar
        projects={allProjects}
        resultCount={milestones.length}
      />

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="border-border/50 bg-card mb-6 rounded-xl border p-5 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Overall completion ·{" "}
              <span className="text-foreground font-semibold">{completed}</span>{" "}
              of {milestones.length}
            </span>
            <span className="text-lg font-bold text-teal-400">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="mt-3 h-2.5" />
        </div>
      )}

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="grid grid-cols-[1fr_200px_90px_100px_140px_120px] gap-x-4 border-b border-border/20 bg-white/[0.02] px-6 py-3">
          <SortableHeader label="Milestone" field="name" />
          <SortableHeader label="Project" field="project" />
          <SortableHeader label="Value" field="value" align="right" />
          <SortableHeader label="Date" field="plannedDate" />
          <SortableHeader label="Status" field="status" />
          <span className="text-muted-foreground/50 text-center text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap">Delivery Note</span>
        </div>

        <div className="divide-border/30 divide-y">
          {milestones.map((milestone) => (
            <Link
              key={milestone.id}
              href={`/projects/${milestone.projectId}`}
              className="table-row-hover grid grid-cols-[1fr_200px_90px_100px_140px_120px] gap-x-4 items-center px-6 py-4"
            >
              <span className="text-foreground text-[15px] font-semibold">
                {milestone.name}
              </span>
              <span className="truncate text-sm text-teal-400">
                {milestone.project.name}
              </span>
              <span className="text-foreground text-right font-mono text-[15px] font-semibold">
                $
                {Number(milestone.value).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                })}
              </span>
              <span className="text-muted-foreground text-sm">
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
                  <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
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
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-500/10" : "bg-teal-500/10"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <ListChecks className="h-8 w-8 text-teal-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                {filtersActive ? "No milestones match your filters" : "No milestones yet"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtersActive
                  ? "Try adjusting your search or filters."
                  : "Add milestones to your projects to track progress."}
              </p>
            </div>
            {filtersActive ? (
              <Link href="/milestones">
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              </Link>
            ) : (
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  Go to Projects
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
