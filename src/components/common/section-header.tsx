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
  iconColor = "text-white/30",
  title,
  count,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-3.5 w-3.5 ${iconColor}`} />}
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">
          {title}
        </span>
        {count != null && (
          <span className="rounded-full bg-white/[0.06] px-1.5 py-px text-[11px] font-bold tabular-nums text-white/40">
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-semibold text-teal-400 transition-colors hover:text-teal-300"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
