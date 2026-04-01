import Link from "next/link";
import { ScrollText, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { AuditToolbar } from "@/components/audit/audit-toolbar";
import { AuditDetail } from "@/components/audit/audit-detail";
import {
  buildAuditLogWhere,
  buildAuditLogOrderBy,
  hasActiveAuditLogFilters,
} from "@/lib/audit-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";
import { AUDIT_ACTION_STYLES, DEFAULT_STATUS_STYLE, formatStatus } from "@/lib/status-config";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    entityType: typeof params.entityType === "string" ? params.entityType : undefined,
    action: typeof params.action === "string" ? params.action : undefined,
    performedBy: typeof params.performedBy === "string" ? params.performedBy : undefined,
    dateFrom: typeof params.dateFrom === "string" ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === "string" ? params.dateTo : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildAuditLogWhere(filterParams);
  const orderBy = buildAuditLogOrderBy(sortParams);
  const filtersActive = hasActiveAuditLogFilters(filterParams);
  const rawPage = parsePage(params.page);

  const [totalCount, filteredCount, distinctUsers] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["performedBy"],
      select: { performedBy: true },
      orderBy: { performedBy: "asc" },
    }),
  ]);

  const users = distinctUsers.map((u) => ({
    id: u.performedBy,
    name: u.performedBy,
  }));

  const pagination = getPaginationMeta(rawPage, filteredCount);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy,
    skip: pagination.skip,
    take: PAGE_SIZE,
  });

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description={`${totalCount} entr${totalCount !== 1 ? "ies" : "y"} total`}
        breadcrumbs={[]}
      />

      <AuditToolbar resultCount={filteredCount} users={users} />

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="border-border/50 bg-accent/50 grid grid-cols-[160px_110px_120px_1fr_100px_1fr] gap-4 border-b px-6 py-3.5">
          <SortableHeader label="Timestamp" field="createdAt" basePath="/audit-log" defaultSort="createdAt" />
          <SortableHeader label="Action" field="action" basePath="/audit-log" defaultSort="createdAt" />
          <SortableHeader label="Entity" field="entityType" basePath="/audit-log" defaultSort="createdAt" />
          <SortableHeader label="Name" field="entityName" basePath="/audit-log" defaultSort="createdAt" />
          <SortableHeader label="By" field="performedBy" basePath="/audit-log" defaultSort="createdAt" />
          <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Details
          </span>
        </div>

        <div className="divide-border/30 divide-y">
          {logs.map((log) => {
            const actionStyle = AUDIT_ACTION_STYLES[log.action] ?? DEFAULT_STATUS_STYLE;
            return (
              <div
                key={log.id}
                className="grid grid-cols-[160px_110px_120px_1fr_100px_1fr] items-start gap-4 px-6 py-4"
              >
                <span className="text-muted-foreground text-xs">
                  {new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  <span className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </span>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${actionStyle.bg} ${actionStyle.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${actionStyle.dot}`} />
                    {formatStatus(log.action)}
                  </span>
                </div>

                <span className="text-foreground text-sm">
                  {formatStatus(log.entityType)}
                </span>

                <span className="text-foreground truncate text-sm font-medium">
                  {log.entityName}
                </span>

                <span className="text-muted-foreground text-xs">
                  {log.performedBy}
                </span>

                <AuditDetail changes={log.changes} metadata={log.metadata} />
              </div>
            );
          })}
        </div>

        {logs.length === 0 && filteredCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-50" : "bg-accent"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <ScrollText className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                {filtersActive ? "No audit entries match your filters" : "No audit entries yet"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtersActive
                  ? "Try adjusting your search or filters."
                  : "Audit entries will appear here as actions are performed."}
              </p>
            </div>
            {filtersActive && (
              <Link href="/audit-log">
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
