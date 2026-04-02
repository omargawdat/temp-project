import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { ClientsToolbar } from "@/components/clients/clients-toolbar";
import { ClientSheet } from "@/components/common/client-sheet";
import { Building2, SearchX } from "lucide-react";
import { OverdueAlert } from "@/components/project-managers/overdue-alert";
import { ClientListItem } from "@/components/clients/client-list-item";
import { sumUniqueInvoices } from "@/lib/financial";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildClientWhere,
  buildClientOrderBy,
  hasActiveClientFilters,
} from "@/lib/client-queries";
import { parsePage, getPaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/components/common/pagination";
import { filterOverdue, daysDifference } from "@/lib/milestones";
import { getInitials, safePercent, formatMultiCurrency, addToCurrency, type CurrencyTotals } from "@/lib/format";
import { SECTOR_STYLES, DEFAULT_STATUS_STYLE, formatSector } from "@/lib/status-config";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filterParams = {
    q: typeof params.q === "string" ? params.q : undefined,
    sector: typeof params.sector === "string" ? params.sector : undefined,
    country: typeof params.country === "string" ? params.country : undefined,
  };
  const sortParams = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    dir: typeof params.dir === "string" ? params.dir : undefined,
  };

  const view = typeof params.view === "string" ? params.view : "list";

  const where = buildClientWhere(filterParams);
  const orderBy = buildClientOrderBy(sortParams);
  const filtersActive = hasActiveClientFilters(filterParams);
  const rawPage = parsePage(params.page);
  const skip = (rawPage - 1) * PAGE_SIZE;

  const [clients, totalCount, filteredCount, countries, contactCounts] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      include: {
        country: true,
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            contractValue: true,
            currency: true,
            milestones: {
              select: {
                name: true,
                status: true,
                plannedDate: true,
                invoice: {
                  select: { id: true, totalPayable: true, status: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.client.count(),
    prisma.client.count({ where }),
    prisma.country.findMany({
      select: { id: true, name: true, code: true, flag: true, _count: { select: { clients: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.contact.groupBy({
      by: ["entityId"],
      where: { entityType: "Client" },
      _count: true,
    }),
  ]);

  const contactCountMap = new Map(contactCounts.map((c) => [c.entityId, c._count]));

  const pagination = getPaginationMeta(rawPage, filteredCount);

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${totalCount} client${totalCount !== 1 ? "s" : ""} across all sectors`}
        breadcrumbs={[]}
      >
        <ClientSheet countries={countries} />
      </PageHeader>

      <ClientsToolbar
        countries={countries
          .filter((c) => c._count.clients > 0)
          .map((c) => ({ id: c.id, name: c.name, flag: c.flag, count: c._count.clients }))}
        resultCount={filteredCount}
      />

      {filteredCount > 0 ? (
        <>
        {view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => {
              const activeProjects = client.projects.filter(
                (p) => p.status === "ACTIVE",
              ).length;

              const allMilestones = client.projects.flatMap((p) => p.milestones);
              const billedAmount = sumUniqueInvoices(allMilestones);
              const collectedAmount = sumUniqueInvoices(allMilestones, "PAID");

              const contractByCurrency: CurrencyTotals = {};
              for (const p of client.projects) {
                addToCurrency(contractByCurrency, p.currency, Number(p.contractValue));
              }
              const totalContractValue = Object.values(contractByCurrency).reduce((s, v) => s + v, 0);

              const billedPct = safePercent(billedAmount, totalContractValue);
              const collectedPct = safePercent(collectedAmount, totalContractValue);

              const now = new Date();
              const overdueDetails = client.projects.flatMap((p) =>
                filterOverdue(p.milestones, now).map((m) => ({
                  milestoneName: m.name,
                  projectName: p.name,
                  plannedDate: m.plannedDate,
                  daysOverdue: daysDifference(m.plannedDate, now),
                })),
              );
              const overdueMilestones = overdueDetails.length;

              const sector = SECTOR_STYLES[client.sector] ?? DEFAULT_STATUS_STYLE;

              const initials = getInitials(client.name);

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="card-hover noise-overlay group relative block overflow-hidden rounded-2xl border border-border transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(165deg, rgba(255,255,255,1), rgba(248,250,252,1))",
                  }}
                >
                  <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-orange-500/[0.04] blur-3xl" />

                  {overdueMilestones > 0 && (
                    <div className="absolute top-3 right-3 z-10">
                      <OverdueAlert count={overdueMilestones} details={overdueDetails} />
                    </div>
                  )}

                  <div className="relative p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 ring-1 ring-ring/20">
                        <span className="text-sm font-bold text-orange-400">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground truncate">
                            {client.name}
                          </h3>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={client.country.flag} alt={client.country.name} className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={cn("text-xs font-semibold", sector.text)}>
                            {formatSector(client.sector)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-accent">
                      <div className="bg-accent px-3.5 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Projects</p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                          {client.projects.length}
                          <span className="ml-1 text-sm font-medium text-emerald-500">{activeProjects} active</span>
                        </p>
                      </div>
                      <div className="bg-accent px-3.5 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Contract Value</p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{formatMultiCurrency(contractByCurrency)}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-muted-foreground">Billed / Collected</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{billedPct}% / {collectedPct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                        <div className="relative h-full">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-amber-500/50 transition-all duration-700" style={{ width: `${billedPct}%` }} />
                          <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/80 transition-all duration-700" style={{ width: `${collectedPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="my-4 h-px bg-muted" />

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="tabular-nums font-medium">{contactCountMap.get(client.id) ?? 0}</span> contacts
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Column headers */}
            <div className="flex items-center gap-4 border-b border-border/50 px-4 py-3">
              <div className="h-9 w-9 shrink-0" />
              <div className="w-44 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Client</div>
              <div className="w-28 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Country</div>
              <div className="w-24 shrink-0 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Projects</div>
              <div className="w-36 shrink-0 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Portfolio</div>
              <div className="hidden xl:block w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Contact</div>
              <div className="w-16 shrink-0 text-center text-xs font-bold uppercase tracking-wider text-red-400">Overdue</div>
              <div className="w-24 shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Billed</div>
            </div>
            {clients.map((client) => {
              const activeProjects = client.projects.filter((p) => p.status === "ACTIVE").length;
              const allMilestones = client.projects.flatMap((p) => p.milestones);
              const billedAmount = sumUniqueInvoices(allMilestones);
              const collectedAmount = sumUniqueInvoices(allMilestones, "PAID");
              const contractByCurrency: CurrencyTotals = {};
              for (const p of client.projects) {
                addToCurrency(contractByCurrency, p.currency, Number(p.contractValue));
              }
              const totalContractValue = Object.values(contractByCurrency).reduce((s, v) => s + v, 0);
              const now = new Date();
              const overdueMilestones = client.projects.flatMap((p) => filterOverdue(p.milestones, now)).length;

              return (
                <ClientListItem
                  key={client.id}
                  id={client.id}
                  name={client.name}
                  sector={client.sector}
                  countryName={client.country.name}
                  countryFlag={client.country.flag}
                  projectsCount={client.projects.length}
                  activeProjects={activeProjects}
                  contractByCurrency={contractByCurrency}
                  totalContractValue={totalContractValue}
                  billedAmount={billedAmount}
                  collectedAmount={collectedAmount}
                  contactCount={contactCountMap.get(client.id) ?? 0}
                  overdueMilestones={overdueMilestones}
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
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-foreground text-base font-semibold">
              {filtersActive ? "No clients match your filters" : "No clients yet"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtersActive
                ? "Try adjusting your search or filters."
                : "Create your first client to start tracking projects."}
            </p>
          </div>
          {filtersActive && (
            <Link href="/clients">
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
