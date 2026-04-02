import Link from "next/link";
import { FileSignature, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { DeliveryNotesToolbar } from "@/components/delivery-notes/delivery-notes-toolbar";
import {
  buildDeliveryNoteWhere,
  buildDeliveryNoteOrderBy,
  hasActiveDeliveryNoteFilters,
} from "@/lib/delivery-note-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";

export default async function DeliveryNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    project: typeof params.project === "string" ? params.project : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildDeliveryNoteWhere(filterParams);
  const orderBy = buildDeliveryNoteOrderBy(sortParams);
  const filtersActive = hasActiveDeliveryNoteFilters(filterParams);
  const rawPage = parsePage(params.page);
  const skip = (rawPage - 1) * PAGE_SIZE;

  const [deliveryNotes, allProjects, totalCount, filteredCount] = await Promise.all([
    prisma.deliveryNote.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        project: {
          include: {
            client: { select: { name: true } },
          },
        },
        milestone: { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, _count: { select: { milestones: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.deliveryNote.count(),
    prisma.deliveryNote.count({ where }),
  ]);

  const pagination = getPaginationMeta(rawPage, filteredCount);

  return (
    <div>
      <PageHeader
        title="Delivery Notes"
        description={`${totalCount} delivery note${totalCount !== 1 ? "s" : ""} across all projects`}
        breadcrumbs={[]}
      />

      <DeliveryNotesToolbar
        projects={allProjects.map((p) => ({ id: p.id, name: p.name, count: p._count.milestones }))}
        resultCount={filteredCount}
      />

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="grid grid-cols-[1fr_180px_150px_100px_110px_110px] gap-x-4 border-b border-border bg-accent px-6 py-3">
          <SortableHeader label="Milestone" field="milestone" basePath="/delivery-notes" defaultSort="createdAt" />
          <SortableHeader label="Project" field="project" basePath="/delivery-notes" defaultSort="createdAt" />
          <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Client
          </span>
          <SortableHeader label="Status" field="status" basePath="/delivery-notes" defaultSort="createdAt" />
          <SortableHeader label="Sent" field="sentDate" basePath="/delivery-notes" defaultSort="createdAt" />
          <SortableHeader label="Signed" field="signedDate" basePath="/delivery-notes" defaultSort="createdAt" />
        </div>

        <div className="divide-border/30 divide-y">
          {deliveryNotes.map((dn) => {
            const isSentPending = dn.status === "SENT";
            return (
              <Link
                key={dn.id}
                href={`/projects/${dn.projectId}`}
                className={`table-row-hover grid grid-cols-[1fr_180px_150px_100px_110px_110px] gap-x-4 items-center px-6 py-4 ${
                  isSentPending ? "border-l-2 border-l-sky-400" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{dn.milestone?.name ?? "No milestone"}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{dn.description.length > 60 ? dn.description.slice(0, 60) + "..." : dn.description}</p>
                </div>
                <span className="truncate text-sm text-primary">
                  {dn.project.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {dn.project.client.name}
                </span>
                <div>
                  <StatusBadge status={dn.status} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {dn.sentDate
                    ? new Date(dn.sentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dn.signedDate
                    ? new Date(dn.signedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>

        {deliveryNotes.length === 0 && filteredCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-50" : "bg-accent"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <FileSignature className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                {filtersActive ? "No delivery notes match your filters" : "No delivery notes yet"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtersActive
                  ? "Try adjusting your search or filters."
                  : "Delivery notes will appear here once milestones require them."}
              </p>
            </div>
            {filtersActive && (
              <Link href="/delivery-notes">
                <Button variant="outline" size="sm">
                  Clear filters
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
