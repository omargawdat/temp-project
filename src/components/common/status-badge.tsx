import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, DEFAULT_STATUS_STYLE, formatStatus } from "@/lib/status-config";

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS_STYLE;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        size === "lg" ? "gap-2 px-3.5 py-1 text-sm" : "gap-1.5 px-2.5 py-0.5 text-xs",
        config.ring ? `ring-1 border-transparent ${config.ring}` : "border-transparent",
        config.bg,
        config.text,
      )}
    >
      <span className={cn("rounded-full", size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5", config.dot)} />
      {formatStatus(status)}
    </Badge>
  );
}
