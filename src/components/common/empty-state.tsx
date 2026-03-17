import type { LucideIcon } from "lucide-react";

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
  return (
    <div className="border-border/50 bg-card flex flex-col items-center gap-4 rounded-2xl border py-20 shadow-lg shadow-black/10">
      <div className={`rounded-2xl p-4 bg-${iconColor}-500/10`}>
        <Icon className={`h-8 w-8 text-${iconColor}-400`} />
      </div>
      <div className="text-center">
        <p className="text-foreground text-base font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
