import type { LucideIcon } from "lucide-react";

const colorStyles: Record<string, { bg: string; text: string }> = {
  teal:   { bg: "bg-teal-500/10",   text: "text-teal-400" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400" },
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-400" },
  emerald:{ bg: "bg-emerald-500/10",text: "text-emerald-400" },
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-400" },
  red:    { bg: "bg-red-500/10",    text: "text-red-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
};

interface EmptyStateProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  iconColor = "teal",
  title,
  description,
  action,
}: EmptyStateProps) {
  const c = colorStyles[iconColor] ?? colorStyles.teal;

  return (
    <div className="border-border/50 bg-card flex flex-col items-center gap-4 rounded-2xl border py-20 shadow-lg shadow-black/10">
      <div className={`rounded-2xl p-4 ${c.bg}`}>
        <Icon className={`h-8 w-8 ${c.text}`} />
      </div>
      <div className="text-center">
        <p className="text-foreground text-base font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
