"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ArrowUpRight, Hash, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";

interface SchemaProjectCardProps {
  id: string;
  name: string;
  clientName: string;
  contractNumber: string;
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  projectManager: string;
  projectManagerPhoto?: string | null;
  status: string;
  milestonesCompleted: number;
  milestonesTotal: number;
  billedAmount: number;
  collectedAmount: number;
  colorIndex: number;
  className?: string;
}

function fmt(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function SchemaProjectCard({
  id,
  name,
  clientName,
  contractNumber,
  contractValue,
  currency,
  startDate,
  endDate,
  projectManager,
  projectManagerPhoto,
  status,
  milestonesCompleted,
  milestonesTotal,
  billedAmount,
  collectedAmount,
  colorIndex,
  className,
}: SchemaProjectCardProps) {
  const progressPct =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;
  const billedPct =
    contractValue > 0
      ? Math.min(100, Math.round((billedAmount / contractValue) * 100))
      : 0;
  const collectedPct =
    contractValue > 0
      ? Math.min(100, Math.round((collectedAmount / contractValue) * 100))
      : 0;
  const outstanding = billedAmount - collectedAmount;

  const pmInitials = projectManager
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

  return (
    <Link
      href={`/projects/${id}`}
      className={cn(
        "card-hover noise-overlay group relative block overflow-hidden rounded-2xl border border-white/[0.06] transition-all duration-300",
        className,
      )}
      style={{
        background:
          "linear-gradient(165deg, rgba(16,24,40,0.97), rgba(11,17,32,0.99))",
      }}
    >
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-teal-500/[0.04] blur-3xl" />

      <div className="relative p-6">
        {/* Row 1: Status + Contract # */}
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <span className="font-mono text-[10px] tracking-wide text-white/25">
            {contractNumber}
          </span>
        </div>

        {/* Row 2: Name + Client */}
        <h3 className="mt-4 text-[17px] font-bold leading-snug tracking-tight text-white/95 transition-colors group-hover:text-white">
          {name}
        </h3>
        <p className="mt-1 text-[13px] text-white/35">{clientName}</p>

        {/* Row 3: Financial grid */}
        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.04]">
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">
              Contract
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {fmt(contractValue, currency)}
            </p>
          </div>
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/50">
              Billed
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {fmt(billedAmount, currency)}
            </p>
          </div>
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/50">
              Collected
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {fmt(collectedAmount, currency)}
            </p>
          </div>
        </div>

        {/* Row 4: Stacked billing bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
            {/* Collected (green, bottom layer) */}
            <div className="relative h-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-500/50 transition-all duration-700"
                style={{ width: `${billedPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/80 transition-all duration-700"
                style={{ width: `${collectedPct}%` }}
              />
            </div>
          </div>
          {outstanding > 0 && (
            <p className="mt-1.5 text-right text-[10px] tabular-nums text-white/20">
              {fmt(outstanding, currency)} outstanding
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-white/[0.05]" />

        {/* Row 5: Milestones */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-white/20" />
            <span className="text-[12px] text-white/40">Milestones</span>
          </div>
          <div className="flex flex-1 items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-teal-500/70 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-white/50">
              {milestonesCompleted}
              <span className="text-white/20">/{milestonesTotal}</span>
            </span>
          </div>
        </div>

        {/* Row 6: Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{fmtDate(startDate)} — {fmtDate(endDate)}</span>
            </div>
            <div className="h-3 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-1.5">
              {projectManagerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projectManagerPhoto}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.08] text-[7px] font-bold text-white/40">
                  {pmInitials}
                </div>
              )}
              <span>{projectManager.split(" ")[0]}</span>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-white/10 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-400/60" />
        </div>
      </div>
    </Link>
  );
}
