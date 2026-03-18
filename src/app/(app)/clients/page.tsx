import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { ClientsToolbar } from "@/components/clients/clients-toolbar";
import { ClientSheet } from "@/components/common/client-sheet";
import { Building2, SearchX } from "lucide-react";
import { OverdueAlert } from "@/components/project-managers/overdue-alert";
import { ContactActions } from "@/components/clients/contact-actions";
import { sumUniqueInvoices } from "@/lib/financial";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildClientWhere,
  buildClientOrderBy,
  hasActiveClientFilters,
} from "@/lib/client-queries";
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

  const where = buildClientWhere(filterParams);
  const orderBy = buildClientOrderBy(sortParams);
  const filtersActive = hasActiveClientFilters(filterParams);

  const [clients, totalCount, countries] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
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
    prisma.country.findMany({
      select: { id: true, name: true, code: true, flag: true, _count: { select: { clients: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

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
        resultCount={clients.length}
      />

      {clients.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const activeProjects = client.projects.filter(
              (p) => p.status === "ACTIVE",
            ).length;

            // Aggregate contract value across all projects (group by currency)
            const allMilestones = client.projects.flatMap((p) => p.milestones);
            const billedAmount = sumUniqueInvoices(allMilestones);
            const collectedAmount = sumUniqueInvoices(allMilestones, "PAID");

            // Sum contract values grouped by currency
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
                className="card-hover noise-overlay group relative block overflow-hidden rounded-2xl border border-white/[0.06] transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(16,24,40,0.97), rgba(11,17,32,0.99))",
                }}
              >
                {/* Subtle top glow */}
                <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-orange-500/[0.04] blur-3xl" />

                {/* Overdue indicator with hover tooltip */}
                {overdueMilestones > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <OverdueAlert count={overdueMilestones} details={overdueDetails} />
                  </div>
                )}

                <div className="relative p-6">
                  {/* Row 1: Image/Initials + Name + Code */}
                  <div className="flex items-start gap-3">
                    {client.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={client.imageUrl}
                        alt={client.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 ring-1 ring-orange-500/20">
                        <span className="text-sm font-bold text-orange-400">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[17px] font-bold leading-snug tracking-tight text-white/95 transition-colors group-hover:text-white truncate">
                          {client.name}
                        </h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={client.country.flag} alt={client.country.name} className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[12px] tracking-wide text-white/30">
                          {client.code}
                        </span>
                        <span className={cn("text-[11px] font-semibold", sector.text)}>
                          {formatSector(client.sector)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.04]">
                    <div className="bg-[#0d1525] px-3.5 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">
                        Projects
                      </p>
                      <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
                        {client.projects.length}
                        <span className="ml-1 text-[11px] font-medium text-emerald-400/60">
                          {activeProjects} active
                        </span>
                      </p>
                    </div>
                    <div className="bg-[#0d1525] px-3.5 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">
                        Contract Value
                      </p>
                      <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
                        {formatMultiCurrency(contractByCurrency)}
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Financial progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-white/20">
                        Billed / Collected
                      </span>
                      <span className="text-[10px] tabular-nums text-white/25">
                        {billedPct}% / {collectedPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                      <div className="relative h-full">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-amber-500/50 transition-all duration-700"
                          style={{ width: `${billedPct}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/80 transition-all duration-700"
                          style={{ width: `${collectedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-4 h-px bg-white/[0.05]" />

                  {/* Row 5: Contact info */}
                  <ContactActions
                    contact={client.primaryContact}
                    email={client.email}
                    phone={client.phone}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border-border/50 bg-card flex flex-col items-center gap-4 rounded-2xl border py-20 shadow-lg shadow-black/10">
          <div className={`rounded-2xl p-4 ${filtersActive ? "bg-amber-500/10" : "bg-orange-500/10"}`}>
            {filtersActive ? (
              <SearchX className="h-8 w-8 text-amber-400" />
            ) : (
              <Building2 className="h-8 w-8 text-orange-400" />
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
