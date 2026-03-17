import Link from "next/link";

interface MilestoneListItemProps {
  name: string;
  subtitle?: string;
  badge: string;
  href: string;
  variant?: "overdue" | "upcoming" | "default";
  badgeUrgent?: boolean;
}

const variantStyles = {
  overdue: {
    bg: "bg-red-500/[0.04]",
    hover: "hover:bg-red-500/[0.08]",
    badge: "text-red-400/70",
  },
  upcoming: {
    bg: "bg-white/[0.02]",
    hover: "hover:bg-white/[0.04]",
    badge: "text-white/30",
  },
  default: {
    bg: "bg-white/[0.02]",
    hover: "hover:bg-white/[0.04]",
    badge: "text-white/30",
  },
};

export function MilestoneListItem({
  name,
  subtitle,
  badge,
  href,
  variant = "default",
  badgeUrgent,
}: MilestoneListItemProps) {
  const v = variantStyles[variant];

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg ${v.bg} px-3 py-2 transition-colors ${v.hover}`}
    >
      <div className="min-w-0 mr-2">
        <p className="text-sm font-medium text-white/80 truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-white/25 truncate">{subtitle}</p>
        )}
      </div>
      <span
        className={`shrink-0 text-xs font-bold tabular-nums ${badgeUrgent ? "text-amber-400/70" : v.badge}`}
      >
        {badge}
      </span>
    </Link>
  );
}
