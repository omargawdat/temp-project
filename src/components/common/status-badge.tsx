import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> =
  {
    // Project statuses
    ACTIVE: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    ON_HOLD: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    CLOSED: { bg: "bg-white/5", text: "text-white/40", dot: "bg-white/30" },

    // Milestone statuses
    NOT_STARTED: {
      bg: "bg-white/5",
      text: "text-white/40",
      dot: "bg-white/30",
    },
    IN_PROGRESS: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-400 animate-pulse",
    },
    COMPLETED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    READY_FOR_INVOICING: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      dot: "bg-purple-400",
    },
    INVOICED: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
    },

    // Delivery note statuses
    DRAFT: { bg: "bg-white/5", text: "text-white/40", dot: "bg-white/30" },
    SENT: { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
    SIGNED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },

    // Invoice statuses
    SUBMITTED: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    UNDER_REVIEW: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      dot: "bg-orange-400 animate-pulse",
    },
    APPROVED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    PAID: {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      dot: "bg-teal-400",
    },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  };

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    bg: "bg-white/5",
    text: "text-white/40",
    dot: "bg-white/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent px-2.5 py-0.5 text-[11px] font-semibold",
        config.bg,
        config.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {formatStatus(status)}
    </Badge>
  );
}
