import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials, safePercent, formatMultiCurrency, type CurrencyTotals } from "@/lib/format";
import { SECTOR_STYLES, DEFAULT_STATUS_STYLE, formatSector } from "@/lib/status-config";

interface ClientListItemProps {
  id: string;
  name: string;
  sector: string;
  countryName: string;
  countryFlag: string;
  projectsCount: number;
  activeProjects: number;
  contractByCurrency: CurrencyTotals;
  totalContractValue: number;
  billedAmount: number;
  collectedAmount: number;
  primaryContact: string;
  overdueMilestones: number;
}

export function ClientListItem({
  id,
  name,
  sector,
  countryName,
  countryFlag,
  projectsCount,
  activeProjects,
  contractByCurrency,
  totalContractValue,
  billedAmount,
  collectedAmount,
  primaryContact,
  overdueMilestones,
}: ClientListItemProps) {
  const billedPct = safePercent(billedAmount, totalContractValue);
  const collectedPct = safePercent(collectedAmount, totalContractValue);
  const sectorStyle = SECTOR_STYLES[sector] ?? DEFAULT_STATUS_STYLE;
  const initials = getInitials(name);

  return (
    <Link
      href={`/clients/${id}`}
      className="group flex items-center gap-4 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent last:border-b-0"
    >
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 ring-1 ring-ring/20">
        <span className="text-xs font-bold text-orange-400">{initials}</span>
      </div>

      {/* Name + Sector */}
      <div className="min-w-0 w-44 shrink-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
        <span className={cn("text-xs font-semibold", sectorStyle.text)}>{formatSector(sector)}</span>
      </div>

      {/* Country */}
      <div className="w-28 shrink-0 flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={countryFlag} alt={countryName} className="h-3 w-4 rounded-[2px] object-cover" />
        <span className="text-xs text-muted-foreground truncate">{countryName}</span>
      </div>

      {/* Projects */}
      <div className="w-24 shrink-0 text-center">
        <span className="text-sm font-semibold tabular-nums text-foreground">{projectsCount}</span>
        <span className="ml-1 text-xs text-emerald-500">{activeProjects} active</span>
      </div>

      {/* Contract Value */}
      <div className="w-36 shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatMultiCurrency(contractByCurrency)}</p>
      </div>

      {/* Primary Contact */}
      <div className="hidden xl:block w-32 shrink-0">
        <p className="text-xs text-muted-foreground truncate">{primaryContact}</p>
      </div>

      {/* Overdue indicator */}
      <div className="w-16 shrink-0 text-center">
        {overdueMilestones > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold tabular-nums text-red-600">
            {overdueMilestones}
          </span>
        )}
      </div>

      {/* Billed / Collected */}
      <div className="w-24 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="relative h-full">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-500/50" style={{ width: `${billedPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/80" style={{ width: `${collectedPct}%` }} />
            </div>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{billedPct}%</span>
        </div>
      </div>
    </Link>
  );
}
