"use client";

import * as React from "react";
import Link from "next/link";
import { ListChecks, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";

interface SchemaProjectCardProps {
  id: string;
  name: string;
  clientName: string;
  contractNumber: string;
  contractValue: number;
  currency: string;
  endDate: Date;
  projectManager: string;
  status: string;
  milestonesCompleted: number;
  milestonesTotal: number;
  colorIndex: number;
  className?: string;
}

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=300&fit=crop",
];

const ACCENT_COLORS = [
  {
    line: "from-indigo-500 to-purple-500",
    badge: "border-indigo-400/30 text-indigo-300",
    overlay: "from-indigo-950/80 via-indigo-950/50",
  },
  {
    line: "from-emerald-500 to-teal-500",
    badge: "border-emerald-400/30 text-emerald-300",
    overlay: "from-emerald-950/80 via-emerald-950/50",
  },
  {
    line: "from-amber-500 to-orange-500",
    badge: "border-amber-400/30 text-amber-300",
    overlay: "from-amber-950/80 via-amber-950/50",
  },
  {
    line: "from-rose-500 to-pink-500",
    badge: "border-rose-400/30 text-rose-300",
    overlay: "from-rose-950/80 via-rose-950/50",
  },
  {
    line: "from-sky-500 to-cyan-500",
    badge: "border-sky-400/30 text-sky-300",
    overlay: "from-sky-950/80 via-sky-950/50",
  },
];

export function SchemaProjectCard({
  id,
  name,
  clientName,
  contractNumber,
  contractValue,
  currency,
  endDate,
  projectManager,
  status,
  milestonesCompleted,
  milestonesTotal,
  colorIndex,
  className,
}: SchemaProjectCardProps) {
  const i = colorIndex % ACCENT_COLORS.length;
  const accent = ACCENT_COLORS[i];
  const progressPercent =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        "card-border group animate-float relative block overflow-hidden rounded-lg transition-all duration-300 hover:border-white/15",
        className,
      )}
      style={{ animationDelay: `${colorIndex * 0.8}s` }}
    >
      {/* Cover image */}
      <div className="relative h-44 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={COVER_IMAGES[i]}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${accent.overlay} to-transparent`}
        />

        {/* Progress overlay */}
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent px-5 pt-8 pb-4">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/50">Progress</span>
            <span className="font-bold text-white/80">{progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accent.line} transition-all duration-700`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Content */}
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <StatusBadge status={status} />
          <span
            className={`glass rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${accent.badge}`}
          >
            {milestonesCompleted}/{milestonesTotal} milestones
          </span>
        </div>

        <h3 className="text-base font-bold text-white">{name}</h3>
        <p className="mt-0.5 text-xs text-white/50">{clientName}</p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1 text-white/40">
            <DollarSign className="h-3 w-3" />
            <span className="font-semibold text-white/70">
              {contractValue.toLocaleString("en-US", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Calendar className="h-3 w-3" />
            <span className="text-white/70">
              {new Date(endDate).toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <ListChecks className="h-3 w-3" />
            <span className="text-white/70">{projectManager}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="glass rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
            {contractNumber}
          </span>
          <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" />
        </div>
      </div>
    </Link>
  );
}
