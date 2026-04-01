import Link from "next/link";
import { FolderOpen, ArrowUpRight } from "lucide-react";
import { DEFAULT_PORTRAITS } from "@/lib/constants";
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

export function PMCard({ pm, colorIndex }: PMCardProps) {
  const initials = getInitials(pm.name);
  const activeCount = pm.projects.filter((p) => p.status === "ACTIVE").length;
  const totalValue = pm.projects.reduce(
    (sum, p) =>
      sum + (typeof p.contractValue === "number" ? p.contractValue : Number(p.contractValue)),
    0,
  );
  const photoSrc = pm.photoUrl || DEFAULT_PORTRAITS[colorIndex % DEFAULT_PORTRAITS.length];
  const hasPhoto = !!pm.photoUrl;

  return (
    <Link
      href={`/project-managers/${pm.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
    >
      {/* Full-bleed image */}
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc}
          alt={pm.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-extralight tracking-widest text-muted-foreground">{initials}</span>
          </div>
          {/* Subtle geometric decoration */}
          <div className="absolute top-8 right-8 h-32 w-32 rounded-full border border-border" />
          <div className="absolute top-12 right-12 h-24 w-24 rounded-full border border-border/50" />
          <div className="absolute bottom-32 left-8 h-16 w-16 rounded-full border border-border" />
        </div>
      )}

      {/* Gradient overlay — bottom half */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Top pills */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {activeCount > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            <span className="text-[10px] font-medium text-secondary-foreground">
              {activeCount} Active
            </span>
          </div>
        ) : (
          <div />
        )}
        {pm.projects.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <FolderOpen className="h-3 w-3 text-secondary-foreground" />
            <span className="text-xs font-medium text-foreground">{pm.projects.length}</span>
          </div>
        )}
      </div>

      {/* Bottom content — overlaid on gradient */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5">

        {/* Name */}
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {pm.name}
        </h3>

        {/* Title */}
        {pm.title && (
          <p className="mt-1 text-sm text-muted-foreground">{pm.title}</p>
        )}

        {/* Value + arrow — bottom row */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-xs text-muted-foreground">
            {totalValue > 0
              ? `$${formatCompactNumber(totalValue)} managed`
              : "No projects yet"}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-secondary-foreground" />
        </div>
      </div>
    </Link>
  );
}
