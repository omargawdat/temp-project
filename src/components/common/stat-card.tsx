import type { LucideIcon } from "lucide-react";

const colorMap: Record<string, { icon: string; glow: string; badge?: string }> = {
  teal:    { icon: "text-teal-400",    glow: "bg-teal-500/[0.06]" },
  amber:   { icon: "text-amber-400",   glow: "bg-amber-500/[0.06]",  badge: "bg-amber-400/10 text-amber-400/80" },
  emerald: { icon: "text-emerald-400", glow: "bg-emerald-500/[0.06]", badge: "bg-emerald-400/10 text-emerald-400/80" },
  blue:    { icon: "text-blue-400",    glow: "bg-blue-500/[0.06]" },
  red:     { icon: "text-red-400",     glow: "bg-red-500/[0.06]" },
  purple:  { icon: "text-purple-400",  glow: "bg-purple-500/[0.06]" },
  orange:  { icon: "text-orange-400",  glow: "bg-orange-500/[0.06]" },
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
      className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-card/60 px-4 py-3.5 ${className ?? ""}`}
    >
      <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full ${c.glow} blur-2xl`} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-${color}-500/10`}>
            <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/30">
            {label}
          </span>
        </div>
        {badge}
      </div>
      <p className="text-xl font-bold tracking-tight text-white tabular-nums">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-white/35">{subtitle}</p>}
    </div>
  );
}
