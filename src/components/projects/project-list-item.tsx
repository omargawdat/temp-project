import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";
import { getInitials, safePercent, formatCurrency, formatDate } from "@/lib/format";

interface ProjectListItemProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  clientName: string;
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  projectManager: string;
  projectManagerPhoto?: string | null;
  status: string;
  milestonesCompleted: number;
  milestonesTotal: number;
  billedAmount: number;
  collectedAmount: number;
}

export function ProjectListItem({
  id,
  name,
  imageUrl,
  clientName,
  contractValue,
  currency,
  startDate,
  endDate,
  projectManager,
  projectManagerPhoto,
  status,
  milestonesCompleted,
  milestonesTotal,
  billedAmount,
  collectedAmount,
}: ProjectListItemProps) {
  const billedPct = safePercent(billedAmount, contractValue);
  const collectedPct = safePercent(collectedAmount, contractValue);
  const progressPct = safePercent(milestonesCompleted, milestonesTotal);
  const pmInitials = getInitials(projectManager);

  return (
    <Link
      href={`/projects/${id}`}
      className="group flex items-center gap-4 border-b border-border/50 px-4 py-3 transition-colors hover:bg-accent last:border-b-0"
    >
      {/* Avatar */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-ring/20" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
          <span className="text-xs font-bold text-primary">{getInitials(name)}</span>
        </div>
      )}

      {/* Name + Client */}
      <div className="min-w-0 w-48 shrink-0">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{clientName}</p>
      </div>

      {/* Status */}
      <div className="w-28 shrink-0">
        <StatusBadge status={status} />
      </div>

      {/* Contract */}
      <div className="w-32 shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(contractValue, currency)}</p>
      </div>

      {/* Milestones */}
      <div className="w-24 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{milestonesCompleted}/{milestonesTotal}</span>
        </div>
      </div>

      {/* Billed / Collected */}
      <div className="w-24 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="relative h-full">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400" style={{ width: `${billedPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: `${collectedPct}%` }} />
            </div>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{billedPct}%</span>
        </div>
      </div>

      {/* PM */}
      <div className="w-28 shrink-0 flex items-center gap-1.5">
        {projectManagerPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={projectManagerPhoto} alt={projectManager} className="h-5 w-5 rounded-full object-cover ring-1 ring-border" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-muted-foreground">{pmInitials}</div>
        )}
        <span className="text-xs text-muted-foreground truncate">{projectManager.split(" ")[0]}</span>
      </div>

      {/* Dates */}
      <div className="hidden xl:block w-36 shrink-0 text-xs text-muted-foreground">
        {formatDate(startDate, "short")} — {formatDate(endDate, "short")}
      </div>
    </Link>
  );
}
