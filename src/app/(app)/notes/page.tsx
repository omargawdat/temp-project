import Link from "next/link";
import { StickyNote, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { NotesToolbar } from "@/components/notes/notes-toolbar";
import { NoteRowActions } from "@/components/notes/note-row-actions";
import {
  buildNoteWhere,
  buildNoteOrderBy,
  hasActiveNoteFilters,
} from "@/lib/note-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";
import {
  NOTE_TYPE_STYLES,
  DEFAULT_STATUS_STYLE,
  formatStatus,
} from "@/lib/status-config";

function entityHref(entityType: string, entityId: string): string {
  switch (entityType) {
    case "CLIENT":
      return `/clients/${entityId}#notes`;
    case "PROJECT":
      return `/projects/${entityId}#notes`;
    case "PROJECT_MANAGER":
      return `/project-managers/${entityId}#notes`;
    default:
      return "#";
  }
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    noteType: typeof params.noteType === "string" ? params.noteType : undefined,
    entityType: typeof params.entityType === "string" ? params.entityType : undefined,
    createdBy: typeof params.createdBy === "string" ? params.createdBy : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildNoteWhere(filterParams);
  const orderBy = buildNoteOrderBy(sortParams);
  const filtersActive = hasActiveNoteFilters(filterParams);
  const rawPage = parsePage(params.page);

  const [totalCount, filteredCount, distinctUsers] = await Promise.all([
    prisma.note.count(),
    prisma.note.count({ where }),
    prisma.note.findMany({
      distinct: ["createdBy"],
      select: { createdBy: true },
      orderBy: { createdBy: "asc" },
    }),
  ]);

  const users = distinctUsers.map((u) => ({
    id: u.createdBy,
    name: u.createdBy,
  }));

  const pagination = getPaginationMeta(rawPage, filteredCount);

  const notes = await prisma.note.findMany({
    where,
    orderBy,
    skip: pagination.skip,
    take: PAGE_SIZE,
  });

  // Batch resolve entity names
  const clientIds = notes.filter((n) => n.entityType === "CLIENT").map((n) => n.entityId);
  const projectIds = notes.filter((n) => n.entityType === "PROJECT").map((n) => n.entityId);
  const pmIds = notes.filter((n) => n.entityType === "PROJECT_MANAGER").map((n) => n.entityId);

  const [clients, projects, pms] = await Promise.all([
    clientIds.length > 0
      ? prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } })
      : [],
    projectIds.length > 0
      ? prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
      : [],
    pmIds.length > 0
      ? prisma.projectManager.findMany({ where: { id: { in: pmIds } }, select: { id: true, name: true } })
      : [],
  ]);

  const entityNameMap = new Map<string, string>();
  clients.forEach((c) => entityNameMap.set(c.id, c.name));
  projects.forEach((p) => entityNameMap.set(p.id, p.name));
  pms.forEach((pm) => entityNameMap.set(pm.id, pm.name));

  return (
    <div>
      <PageHeader
        title="Notes"
        description={`${totalCount} note${totalCount !== 1 ? "s" : ""} across all entities`}
        breadcrumbs={[]}
      />

      <NotesToolbar resultCount={filteredCount} users={users} />

      {/* Table */}
      <div className="border-border/50 bg-card overflow-hidden rounded-xl border shadow-lg shadow-black/10">
        <div className="border-border/50 bg-accent/50 grid grid-cols-[130px_1fr_200px_110px_130px_80px] gap-4 border-b px-6 py-3.5">
          <SortableHeader label="Type" field="noteType" basePath="/notes" defaultSort="createdAt" />
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Content
          </span>
          <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
            Entity
          </span>
          <SortableHeader label="Created By" field="createdBy" basePath="/notes" defaultSort="createdAt" />
          <SortableHeader label="Date" field="createdAt" basePath="/notes" defaultSort="createdAt" />
          <span className="text-muted-foreground text-center text-[11px] font-bold tracking-wider uppercase">
            Actions
          </span>
        </div>

        <div className="divide-border/30 divide-y">
          {notes.map((note) => {
            const typeStyle = NOTE_TYPE_STYLES[note.noteType] ?? DEFAULT_STATUS_STYLE;
            const entityName = entityNameMap.get(note.entityId) ?? "(Deleted)";
            const href = entityHref(note.entityType, note.entityId);
            const truncated =
              note.content.length > 100
                ? note.content.slice(0, 100) + "..."
                : note.content;

            return (
              <a
                key={note.id}
                href={href}
                className="table-row-hover group grid grid-cols-[130px_1fr_200px_110px_130px_80px] items-center gap-4 px-6 py-4"
              >
                {/* Note Type Badge */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeStyle.bg} ${typeStyle.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
                    {formatStatus(note.noteType)}
                  </span>
                </div>

                {/* Content */}
                <p
                  className="text-foreground/85 truncate text-sm"
                  title={note.content}
                >
                  {truncated}
                </p>

                {/* Entity */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                    {note.entityType === "PROJECT_MANAGER" ? "PM" : formatStatus(note.entityType)}
                  </span>
                  <span className="truncate text-sm text-teal-400">
                    {entityName}
                  </span>
                </div>

                {/* Created By */}
                <span className="text-muted-foreground truncate text-xs">
                  {note.createdBy}
                </span>

                {/* Date */}
                <span className="text-muted-foreground text-xs">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                {/* Actions */}
                <NoteRowActions
                  note={{
                    id: note.id,
                    content: note.content,
                    noteType: note.noteType,
                    createdBy: note.createdBy,
                    entityType: note.entityType,
                    entityId: note.entityId,
                  }}
                />
              </a>
            );
          })}
        </div>

        {notes.length === 0 && filteredCount === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-500/10" : "bg-amber-500/10"}`}>
              {filtersActive ? (
                <SearchX className="h-8 w-8 text-amber-400" />
              ) : (
                <StickyNote className="h-8 w-8 text-amber-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-semibold">
                {filtersActive ? "No notes match your filters" : "No notes yet"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {filtersActive
                  ? "Try adjusting your search or filters."
                  : "Notes will appear here as they are added to clients, projects, and team members."}
              </p>
            </div>
            {filtersActive && (
              <Link href="/notes">
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />
    </div>
  );
}
