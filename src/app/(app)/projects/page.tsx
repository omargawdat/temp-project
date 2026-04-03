import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { SchemaProjectCard } from "@/components/ui/schema-project-card";
import { ProjectListItem } from "@/components/projects/project-list-item";
import { ProjectSheet } from "@/components/common/project-sheet";
import { FolderKanban, SearchX } from "lucide-react";
import { sumUniqueInvoices } from "@/lib/financial";
import { Button } from "@/components/ui/button";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import {
  buildProjectWhere,
  buildProjectOrderBy,
  hasActiveProjectFilters,
} from "@/lib/project-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    client: typeof params.client === "string" ? params.client : undefined,
    pm: typeof params.pm === "string" ? params.pm : undefined,
    type: typeof params.type === "string" ? params.type : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const view = typeof params.view === "string" ? params.view : "list";

  const where = buildProjectWhere(filterParams);
  const orderBy = buildProjectOrderBy(sortParams);
  const filtersActive = hasActiveProjectFilters(filterParams);
  const rawPage = parsePage(params.page);
  const skip = (rawPage - 1) * PAGE_SIZE;

  const [projects, projectManagers, clients, totalCount, filteredCount] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        client: { select: { name: true } },
        projectManager: { select: { name: true, photoUrl: true } },
        milestones: {
          select: { status: true, value: true, invoice: { select: { id: true, totalPayable: true, status: true } } },
        },
      },
    }),
    prisma.projectManager.findMany({
      select: { id: true, name: true, title: true, photoUrl: true, _count: { select: { projects: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true, _count: { select: { projects: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.project.count(),
    prisma.project.count({ where }),
  ]);

  const pagination = getPaginationMeta(rawPage, filteredCount);

  return (
    <div>
      <PageHeader
        title="Projects / Products"
        description={`${totalCount} project${totalCount !== 1 ? "s" : ""} & products across all clients`}
        breadcrumbs={[]}
      >
        <ProjectSheet projectManagers={projectManagers} clients={clients} />
      </PageHeader>

      <ProjectsToolbar
        clients={clients.map((c) => ({ id: c.id, name: c.name, count: c._count.projects }))}
        projectManagers={projectManagers.map((pm) => ({ id: pm.id, name: pm.name, imageUrl: pm.photoUrl, count: pm._count.projects }))}
        resultCount={filteredCount}
      />

      {filteredCount > 0 ? (
        <>
        {view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => {
              const completed = project.milestones.filter(
                (m) =>
                  m.status === "COMPLETED" ||
                  m.status === "INVOICED",
              ).length;
              const billedAmount = sumUniqueInvoices(project.milestones);
              const collectedAmount = sumUniqueInvoices(project.milestones, "PAID");
              const invoiceCount = new Set(
                project.milestones.map((m) => m.invoice?.id).filter(Boolean),
              ).size;

              return (
                <SchemaProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  clientName={project.client.name}
                  contractNumber={project.contractNumber}
                  contractValue={Number(project.contractValue)}
                  currency={project.currency}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  projectManager={project.projectManager.name}
                  projectManagerPhoto={project.projectManager.photoUrl}
                  status={project.status}
                  milestonesCompleted={completed}
                  milestonesTotal={project.milestones.length}
                  invoiceCount={invoiceCount}
                  billedAmount={billedAmount}
                  collectedAmount={collectedAmount}
                  colorIndex={i}
                  type={project.type}
                />
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Column headers */}
            <div className="flex items-center gap-4 border-b border-border/50 px-4 py-3">
              <div className="h-9 w-9 shrink-0" />
              <div className="w-48 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Project</div>
              <div className="w-28 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Status</div>
              <div className="w-32 shrink-0 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Value</div>
              <div className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Progress</div>
              <div className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billed</div>
              <div className="w-28 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">PM</div>
              <div className="hidden xl:block w-36 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Timeline</div>
            </div>
            {projects.map((project) => {
              const completed = project.milestones.filter(
                (m) =>
                  m.status === "COMPLETED" ||
                  m.status === "INVOICED",
              ).length;
              const billedAmount = sumUniqueInvoices(project.milestones);
              const collectedAmount = sumUniqueInvoices(project.milestones, "PAID");

              return (
                <ProjectListItem
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  clientName={project.client.name}
                  contractValue={Number(project.contractValue)}
                  currency={project.currency}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  projectManager={project.projectManager.name}
                  projectManagerPhoto={project.projectManager.photoUrl}
                  status={project.status}
                  type={project.type}
                  milestonesCompleted={completed}
                  milestonesTotal={project.milestones.length}
                  billedAmount={billedAmount}
                  collectedAmount={collectedAmount}
                />
              );
            })}
          </div>
        )}
        <Pagination page={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} />
        </>
      ) : (
        <div className="border-border/50 bg-card flex flex-col items-center gap-4 rounded-2xl border py-20 shadow-lg shadow-black/10">
          <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-50" : "bg-accent"}`}>
            {filtersActive ? (
              <SearchX className="h-8 w-8 text-amber-400" />
            ) : (
              <FolderKanban className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-foreground text-base font-semibold">
              {filtersActive ? "No projects match your filters" : "No projects yet"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtersActive
                ? "Try adjusting your search or filters."
                : "Create your first project to start tracking deliveries."}
            </p>
          </div>
          {filtersActive ? (
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </Link>
          ) : (
            <ProjectSheet projectManagers={projectManagers} clients={clients} />
          )}
        </div>
      )}
    </div>
  );
}
