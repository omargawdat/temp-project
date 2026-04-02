"use client";

import { Briefcase, FileCheck, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";

interface KpiStripProps {
  portfolioValue: number;
  totalBilled: number;
  totalCollected: number;
  billedPct: number;
  collectedPct: number;
  activeProjects: number;
  onHoldCount: number;
  totalOverdueItems: number;
  overdueMilestones: number;
  overdueInvoices: number;
  currency: string;
  sparklineData?: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width={60} height={24}>
      <LineChart data={points}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function KpiStrip({
  portfolioValue,
  totalBilled,
  totalCollected,
  billedPct,
  collectedPct,
  activeProjects,
  onHoldCount,
  totalOverdueItems,
  overdueMilestones,
  overdueInvoices,
  currency,
  sparklineData,
}: KpiStripProps) {
  const hasSparkline = sparklineData && sparklineData.length > 1;

  return (
    <div className="grid grid-cols-5 gap-3">
      {/* Portfolio */}
      <div className="rounded-xl bg-card card-elevated px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Briefcase className="h-3 w-3 text-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio</span>
          </div>
          {hasSparkline && <Sparkline data={sparklineData} color="#6366f1" />}
        </div>
        <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(portfolioValue, currency)}</p>
      </div>

      {/* Billed */}
      <div className="rounded-xl bg-card card-elevated px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
              <FileCheck className="h-3 w-3 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billed</span>
          </div>
          <div className="flex items-center gap-2">
            {hasSparkline && <Sparkline data={sparklineData} color="#f59e0b" />}
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-700">{billedPct}%</span>
          </div>
        </div>
        <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(totalBilled, currency)}</p>
      </div>

      {/* Collected */}
      <div className="rounded-xl bg-card card-elevated px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50">
              <DollarSign className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Collected</span>
          </div>
          <div className="flex items-center gap-2">
            {hasSparkline && <Sparkline data={sparklineData} color="#10b981" />}
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700">{collectedPct}%</span>
          </div>
        </div>
        <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(totalCollected, currency)}</p>
      </div>

      {/* Active */}
      <div className="rounded-xl bg-card card-elevated px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
              <TrendingUp className="h-3 w-3 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active</span>
          </div>
          {hasSparkline && <Sparkline data={sparklineData} color="#3b82f6" />}
        </div>
        <p className="text-lg font-bold tabular-nums text-foreground">{activeProjects}</p>
        <p className="text-xs text-muted-foreground">{onHoldCount} on hold</p>
      </div>

      {/* Overdue */}
      <div className={`rounded-xl px-4 py-3 ${totalOverdueItems > 0 ? "bg-red-50 border border-red-200" : "bg-card card-elevated"}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${totalOverdueItems > 0 ? "bg-red-100" : "bg-red-50"}`}>
              <AlertTriangle className="h-3 w-3 text-red-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            {hasSparkline && <Sparkline data={sparklineData} color="#ef4444" />}
            {totalOverdueItems > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
            )}
          </div>
        </div>
        <p className={`text-lg font-bold tabular-nums ${totalOverdueItems > 0 ? "text-red-500" : "text-foreground"}`}>{totalOverdueItems}</p>
        <p className="text-xs text-muted-foreground">{overdueMilestones} milestones, {overdueInvoices} invoices</p>
      </div>
    </div>
  );
}
