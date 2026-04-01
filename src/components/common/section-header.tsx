import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  count?: number;
  action?: { label: string; href: string };
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  iconColor = "text-muted-foreground",
  title,
  count,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor}`} />}
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h2>
        {count != null && (
          <span className="rounded-full bg-muted px-1.5 py-px text-[11px] font-bold tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-semibold text-primary transition-colors hover:text-primary"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
