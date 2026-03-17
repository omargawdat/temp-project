import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { PMSheet } from "@/components/common/pm-sheet";
import { Users, SearchX } from "lucide-react";
import { SortableHeader } from "@/components/toolbar/sortable-header";
import { PMToolbar } from "@/components/project-managers/pm-toolbar";
import { computePMStats } from "@/lib/pm-stats";
import { buildPMWhere, sortPMStats, hasActivePMFilters } from "@/lib/pm-queries";
import { Button } from "@/components/ui/button";
import { OverdueAlert } from "@/components/project-managers/overdue-alert";

export default async function ProjectManagersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const where = buildPMWhere(filterParams);
  const filtersActive = hasActivePMFilters(filterParams);

  const [managers, totalCount] = await Promise.all([
    prisma.projectManager.findMany({
      where,
      include: {
        projects: {
          include: {
            milestones: {
              include: {
                invoice: { select: { id: true, status: true, totalPayable: true } },
              },
            },
          },
        },
      },
    }),
    prisma.projectManager.count(),
  ]);

  const now = new Date();

  const pmStats = computePMStats(managers);
  const sortedStats = sortPMStats(pmStats, sortParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description={`${totalCount} project manager${totalCount !== 1 ? "s" : ""}`}
        breadcrumbs={[]}
      >
        <PMSheet />
      </PageHeader>

      <PMToolbar resultCount={sortedStats.length} />

      {sortedStats.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/25 bg-card/50">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left">
                  <SortableHeader label="Manager" field="name" basePath="/project-managers" defaultSort="name" />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Projects" field="projects" align="center" basePath="/project-managers" defaultSort="name" />
                </th>
                <th className="px-4 py-3.5 text-left">
                  <SortableHeader label="Milestones" field="milestones" basePath="/project-managers" defaultSort="name" />
                </th>
                <th className="px-4 py-3.5 text-left">
                  <SortableHeader label="Next Deadline" field="nextDeadline" basePath="/project-managers" defaultSort="name" />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortableHeader label="Portfolio" field="portfolio" align="right" basePath="/project-managers" defaultSort="name" />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortableHeader label="Billed" field="billed" align="right" basePath="/project-managers" defaultSort="name" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((pm, idx) => {
                const initials = pm.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

                // Next deadline formatting
                let deadlineLabel = "—";
                let deadlineColor = "text-muted-foreground/30";
                if (pm.nextDeadline) {
                  const d = new Date(pm.nextDeadline);
                  const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  deadlineLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  if (daysUntil <= 7) {
                    deadlineColor = "text-amber-400";
                  } else {
                    deadlineColor = "text-muted-foreground/70";
                  }
                }

                return (
                  <tr
                    key={pm.id}
                    className={`group transition-colors hover:bg-teal-500/[0.03] ${
                      idx < sortedStats.length - 1 ? "border-b border-border/10" : ""
                    }`}
                  >
                    {/* Manager */}
                    <td className="px-6 py-4">
                      <Link href={`/project-managers/${pm.id}`} className="flex items-center gap-3">
                        {pm.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pm.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border/20" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-xs font-bold text-teal-400 ring-2 ring-border/20">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-teal-400 transition-colors">{pm.name}</p>
                          {pm.title && <p className="text-xs text-muted-foreground/70">{pm.title}</p>}
                        </div>
                      </Link>
                    </td>

                    {/* Projects */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">{pm.totalProjects}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/50">total</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-emerald-400">{pm.activeProjects}</span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/50">active</span>
                        </div>
                      </div>
                    </td>

                    {/* Milestones completion */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-teal-500/70 transition-all" style={{ width: `${pm.completionPct}%` }} />
                        </div>
                        <span className="text-sm tabular-nums text-foreground/70">{pm.completedMilestones}/{pm.totalMilestones}</span>
                        {pm.overdueMilestones > 0 && (
                          <OverdueAlert count={pm.overdueMilestones} details={pm.overdueMilestoneDetails} />
                        )}
                      </div>
                    </td>

                    {/* Next Deadline */}
                    <td className="px-4 py-4">
                      <span className={`text-sm font-semibold ${deadlineColor}`}>{deadlineLabel}</span>
                    </td>

                    {/* Portfolio */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-bold tabular-nums text-foreground">${pm.portfolioValue.toLocaleString()}</span>
                    </td>

                    {/* Billed */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold tabular-nums text-foreground/90">${pm.billed.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-amber-500/10">
                            <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${pm.billedPct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground/60">{pm.billedPct}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/20 bg-card/40 py-20">
          <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-500/10" : "bg-teal-500/10"}`}>
            {filtersActive ? (
              <SearchX className="h-8 w-8 text-amber-400" />
            ) : (
              <Users className="h-8 w-8 text-teal-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              {filtersActive ? "No managers match your search" : "No project managers yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtersActive
                ? "Try adjusting your search term."
                : "Add your first PM to start assigning projects."}
            </p>
          </div>
          {filtersActive ? (
            <Link href="/project-managers">
              <Button variant="outline" size="sm">
                Clear search
              </Button>
            </Link>
          ) : (
            <PMSheet />
          )}
        </div>
      )}
    </div>
  );
}
