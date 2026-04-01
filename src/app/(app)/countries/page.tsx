import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { CountrySheet } from "@/components/common/country-sheet";
import { DeleteCountryButton } from "@/components/common/delete-country-button";
import { serializeForClient } from "@/lib/serialize";
import { Globe } from "lucide-react";

export default async function CountriesPage() {
  const countries = await prisma.country.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { clients: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Countries"
        description={`${countries.length} countr${countries.length !== 1 ? "ies" : "y"}`}
        breadcrumbs={[]}
      >
        <CountrySheet />
      </PageHeader>

      {countries.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border/25 bg-card card-elevated">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border/15">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Flag
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Clients
                </th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country, idx) => (
                <tr
                  key={country.id}
                  className={`group transition-colors hover:bg-accent ${
                    idx < countries.length - 1 ? "border-b border-border/10" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={country.flag} alt={country.name} className="h-7 w-10 rounded-sm object-cover" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {country.name}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {country.code}
                    </code>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm tabular-nums text-muted-foreground/70">
                      {country._count.clients}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <CountrySheet country={serializeForClient(country)} variant="edit" />
                      <DeleteCountryButton countryId={country.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/20 bg-card card-elevated py-20">
          <div className="rounded-2xl bg-accent p-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              No countries yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first country to start organizing clients by region.
            </p>
          </div>
          <CountrySheet />
        </div>
      )}
    </div>
  );
}
