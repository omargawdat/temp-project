import Link from "next/link";
import { ListChecks, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { MilestonesToolbar } from "@/components/milestones/milestones-toolbar";
import {
  buildMilestoneWhere,
  buildMilestoneOrderBy,
  hasActiveFilters,
} from "@/lib/milestone-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";

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
    deliveryNote: typeof params.deliveryNote === "string" ? params.deliveryNote : undefined,
    overdue: typeof params.overdue === "string" ? params.overdue : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildMilestoneWhere(filterParams);
  const orderBy = buildMilestoneOrderBy(sortParams);
  const filtersActive = hasActiveFilters(filterParams);
  const rawPage = parsePage(params.page);
  const skip = (rawPage - 1) * PAGE_SIZE;

  const [milestones, allProjects, totalCount, filteredCount] = await Promise.all([
    prisma.milestone.findMany({ where, orderBy, skip, take: PAGE_SIZE, include: { project: true } }),
    prisma.project.findMany({
      select: { id: true, name: true, imageUrl: true, _count: { select: { milestones: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.milestone.count(),
    prisma.milestone.count({ where }),
  ]);

  const pagination = getPaginationMeta(rawPage, filteredCount);

  return (
    <div>
      <PageHeader
        title="Milestones"
        description={`${totalCount} milestones across all projects`}
        breadcrumbs={[]}
      />

      {/* Toolbar */}
      <MilestonesToolbar
        projects={allProjects.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, count: p._count.milestones }))}
        resultCount={filteredCount}
      />

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="grid grid-cols-[1fr_200px_90px_100px_140px_120px] gap-x-4 border-b border-border bg-accent px-6 py-3">
          <SortableHeader label="Milestone" field="name" basePath="/milestones" defaultSort="plannedDate" />
          <SortableHeader label="Project" field="project" basePath="/milestones" defaultSort="plannedDate" />
          <SortableHeader label="Value" field="value" align="right" basePath="/milestones" defaultSort="plannedDate" />
          <SortableHeader label="Date" field="plannedDate" basePath="/milestones" defaultSort="plannedDate" />
          <SortableHeader label="Status" field="status" basePath="/milestones" defaultSort="plannedDate" />
          <span className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase whitespace-nowrap">Delivery Note</span>
        </div>

        <div className="divide-border/30 divide-y">
          {milestones.map((milestone) => (
            <Link
              key={milestone.id}
              href={`/projects/${milestone.projectId}`}
              className="table-row-hover grid grid-cols-[1fr_200px_90px_100px_140px_120px] gap-x-4 items-center px-6 py-4"
            >
              <span className="text-foreground text-sm font-semibold">
                {milestone.name}
              </span>
              <span className="truncate text-sm text-primary">
                {milestone.project.name}
              </span>
              <span className="text-foreground text-right font-mono text-sm font-semibold">
                {Number(milestone.value).toLocaleString("en-US", {
                  style: "currency",
                  currency: milestone.project.currency,
                  maximumFractionDigits: 0,
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
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {milestones.length === 0 && filteredCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-50" : "bg-accent"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <ListChecks className="h-8 w-8 text-primary" />
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
      <Pagination page={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} />
    </div>
  );
}
