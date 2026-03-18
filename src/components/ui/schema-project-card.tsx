"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ArrowUpRight, Hash, Target, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { getInitials, safePercent, formatCurrency, formatDate } from "@/lib/format";

interface SchemaProjectCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
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
  invoiceCount: number;
  billedAmount: number;
  collectedAmount: number;
  colorIndex: number;
  className?: string;
}

export function SchemaProjectCard({
  id,
  name,
  imageUrl,
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
  invoiceCount,
  billedAmount,
  collectedAmount,
  colorIndex,
  className,
}: SchemaProjectCardProps) {
  const progressPct = safePercent(milestonesCompleted, milestonesTotal);
  const billedPct = safePercent(billedAmount, contractValue);
  const collectedPct = safePercent(collectedAmount, contractValue);

  const pmInitials = getInitials(projectManager);

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
        {/* Row 1: Icon + Name + Status */}
        <div className="flex items-start gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-teal-500/5 ring-1 ring-teal-500/20">
              <span className="text-sm font-bold text-teal-400">
                {getInitials(name)}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold leading-snug tracking-tight text-white/95 transition-colors group-hover:text-white truncate">
                {name}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-[13px] text-white/35 truncate">{clientName}</p>
          </div>
        </div>

        {/* Row 3: Financial grid */}
        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.04]">
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/25">
              Contract
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {formatCurrency(contractValue, currency)}
            </p>
          </div>
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/50">
              Billed
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {formatCurrency(billedAmount, currency)}
            </p>
          </div>
          <div className="bg-[#0d1525] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/50">
              Collected
            </p>
            <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
              {formatCurrency(collectedAmount, currency)}
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
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-white/[0.05]" />

        {/* Row 5: Milestones + Invoices */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-white/20" />
            <span className="text-[12px] text-white/40">Milestones</span>
          </div>
          <div className="flex items-center gap-2">
            {milestonesTotal > 0 ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: milestonesTotal }).map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      idx < milestonesCompleted
                        ? "bg-teal-400"
                        : "bg-white/[0.08]",
                    )}
                  />
                ))}
              </div>
            ) : null}
            <span className="text-[12px] font-semibold tabular-nums text-white/50">
              {milestonesCompleted}
              <span className="text-white/20">/{milestonesTotal}</span>
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-white/20" />
            <span className="text-[12px] text-white/40">Invoices</span>
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-white/50">
            {invoiceCount}
          </span>
        </div>

        {/* Row 6: Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-white/25 overflow-hidden">
            <span className="shrink-0 truncate max-w-[100px] font-mono text-[10px] tracking-wide text-white/20">{contractNumber}</span>
            <div className="h-3 w-px shrink-0 bg-white/[0.06]" />
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(startDate, "month-year")} — {formatDate(endDate, "month-year")}</span>
            </div>
            <div className="h-3 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-1.5">
              {projectManagerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projectManagerPhoto}
                  alt={projectManager}
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
