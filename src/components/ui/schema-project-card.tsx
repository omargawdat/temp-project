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
  type?: string;
  className?: string;
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
  invoiceCount,
  billedAmount,
  collectedAmount,
  colorIndex,
  type,
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
        "card-hover card-elevated group relative block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
        className,
      )}
    >
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-3xl" />

      <div className="relative p-6">
        {/* Row 1: Icon + Name + Status */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <span className="text-sm font-bold text-primary">
              {getInitials(name)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground truncate">
                {name}
              </h3>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground truncate">{clientName}</p>
          </div>
        </div>

        {/* Row 3: Financial grid */}
        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-border">
          <div className="bg-muted px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Contract
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-foreground">
              {formatCurrency(contractValue, currency)}
            </p>
          </div>
          <div className="bg-muted px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600">
              Billed
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-foreground">
              {formatCurrency(billedAmount, currency)}
            </p>
          </div>
          <div className="bg-muted px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
              Collected
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-foreground">
              {formatCurrency(collectedAmount, currency)}
            </p>
          </div>
        </div>

        {/* Row 4: Stacked billing bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="relative h-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-700"
                style={{ width: `${billedPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${collectedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-border" />

        {/* Row 5: Milestones + Invoices */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Milestones</span>
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
                        ? "bg-primary"
                        : "bg-border",
                    )}
                  />
                ))}
              </div>
            ) : null}
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {milestonesCompleted}
              <span className="text-muted-foreground">/{milestonesTotal}</span>
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Invoices</span>
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {invoiceCount}
          </span>
        </div>

        {/* Row 6: Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground overflow-hidden">
            <span className="shrink-0 truncate max-w-[100px] font-mono text-[10px] tracking-wide text-muted-foreground">{contractNumber}</span>
            <div className="h-3 w-px shrink-0 bg-border" />
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(startDate, "month-year")} — {formatDate(endDate, "month-year")}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              {projectManagerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={projectManagerPhoto}
                  alt={projectManager}
                  className="h-4 w-4 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[7px] font-bold text-muted-foreground">
                  {pmInitials}
                </div>
              )}
              <span>{projectManager.split(" ")[0]}</span>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
