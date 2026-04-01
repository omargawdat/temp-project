import type { LucideIcon } from "lucide-react";

const colorMap: Record<string, { icon: string; glow: string; iconBg: string; badge?: string }> = {
  teal:    { icon: "text-primary",    glow: "bg-teal-500/[0.06]",    iconBg: "bg-accent" },
  amber:   { icon: "text-amber-400",   glow: "bg-amber-500/[0.06]",   iconBg: "bg-amber-50",   badge: "bg-amber-100 text-amber-600" },
  emerald: { icon: "text-emerald-400", glow: "bg-emerald-500/[0.06]", iconBg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-600" },
  blue:    { icon: "text-blue-400",    glow: "bg-blue-500/[0.06]",    iconBg: "bg-blue-500/10" },
  red:     { icon: "text-red-400",     glow: "bg-red-500/[0.06]",     iconBg: "bg-red-50" },
  purple:  { icon: "text-purple-400",  glow: "bg-purple-500/[0.06]",  iconBg: "bg-purple-500/10" },
  orange:  { icon: "text-orange-400",  glow: "bg-orange-500/[0.06]",  iconBg: "bg-orange-500/10" },
};

interface StatCardProps {
  icon: LucideIcon;
  color?: string;
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function StatCard({
  icon: Icon,
  color = "teal",
  label,
  value,
  subtitle,
  badge,
  className,
}: StatCardProps) {
  const c = colorMap[color] ?? colorMap.teal;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card card-elevated px-4 py-3.5 ${className ?? ""}`}
    >
      <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full ${c.glow} blur-2xl`} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg}`}>
            <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </span>
        </div>
        {badge}
      </div>
      <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
