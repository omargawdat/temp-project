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
    bg: "bg-red-50",
    hover: "hover:bg-red-500/[0.08]",
    badge: "text-red-500",
  },
  upcoming: {
    bg: "bg-accent",
    hover: "hover:bg-accent",
    badge: "text-muted-foreground",
  },
  default: {
    bg: "bg-accent",
    hover: "hover:bg-accent",
    badge: "text-muted-foreground",
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
        <p className="text-sm font-medium text-secondary-foreground truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/50 truncate">{subtitle}</p>
        )}
      </div>
      <span
        className={`shrink-0 text-xs font-bold tabular-nums ${badgeUrgent ? "text-amber-500" : v.badge}`}
      >
        {badge}
      </span>
    </Link>
  );
}
