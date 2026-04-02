import Link from "next/link";
import { FolderOpen, ArrowUpRight } from "lucide-react";
import { getInitials, formatCompactNumber } from "@/lib/format";

interface PMCardProps {
  pm: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    photoUrl: string | null;
    projects: {
      id: string;
      name: string;
      client: { name: string };
      status: string;
      contractValue: number | { toNumber(): number };
      currency: string;
    }[];
  };
  colorIndex: number;
}

export function PMCard({ pm }: PMCardProps) {
  const initials = getInitials(pm.name);
  const activeCount = pm.projects.filter((p) => p.status === "ACTIVE").length;
  const totalValue = pm.projects.reduce(
    (sum, p) =>
      sum + (typeof p.contractValue === "number" ? p.contractValue : Number(p.contractValue)),
    0,
  );

  return (
    <Link
      href={`/project-managers/${pm.id}`}
      className="card-hover group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300"
    >
      <div className="p-6">
        {/* Avatar */}
        <div className="flex items-start justify-between mb-4">
          {pm.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pm.photoUrl}
              alt={pm.name}
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-ring/20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-ring/20">
              <span className="text-lg font-bold text-primary">{initials}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {activeCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                {activeCount} active
              </span>
            )}
            {pm.projects.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <FolderOpen className="h-3 w-3" />
                {pm.projects.length}
              </span>
            )}
          </div>
        </div>

        {/* Name + Title */}
        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          {pm.name}
        </h3>
        {pm.title && (
          <p className="mt-0.5 text-sm text-muted-foreground">{pm.title}</p>
        )}

        {/* Value + arrow */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-xs text-muted-foreground">
            {totalValue > 0
              ? `$${formatCompactNumber(totalValue)} managed`
              : "No projects yet"}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
