"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#334155",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

function getCurrencySymbol(currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? currency;
}

function formatAxisValue(v: number, symbol: string): string {
  if (v >= 1_000_000) return `${symbol}${Math.round(v / 1_000_000)}M`;
  if (v >= 1000) return `${symbol}${Math.round(v / 1000)}k`;
  return `${symbol}${v}`;
}

// ── Cash Flow Funnel Chart ──
export function CashFlowFunnelChart({
  data,
  currency = "USD",
}: {
  data: { name: string; value: number; fill: string }[];
  currency?: string;
}) {
  const sym = getCurrencySymbol(currency);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={48}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatAxisValue(v, sym)}
          width={52}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [`${sym}${Number(value).toLocaleString()}`, "Amount"]}
          labelStyle={{ color: "#0f172a", fontWeight: 600 }}
          itemStyle={{ color: "#334155" }}
          cursor={{ fill: "rgba(99,102,241,0.04)" }}
        />
        <defs>
          <linearGradient id="cfPortfolio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="cfBilled" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="cfCollected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.name === "Portfolio"
                  ? "url(#cfPortfolio)"
                  : entry.name === "Billed"
                    ? "url(#cfBilled)"
                    : "url(#cfCollected)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Dashboard Billing Ring ──
export function DashboardBillingRing({
  collected,
  outstanding,
  unbilled,
  collectedPct,
}: {
  collected: number;
  outstanding: number;
  unbilled: number;
  collectedPct: number;
}) {
  const data = [
    { name: "Collected", value: collected },
    { name: "Outstanding", value: outstanding },
    { name: "Unbilled", value: unbilled },
  ].filter((d) => d.value > 0);

  if (data.length === 0) data.push({ name: "Empty", value: 1 });

  const colors = data.map((d) => {
    if (d.name === "Collected") return "#34d399";
    if (d.name === "Outstanding") return "#fbbf24";
    return "#e2e8f0";
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              cornerRadius={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{collectedPct}%</span>
          <span className="text-[10px] text-muted-foreground">collected</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Collected</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-muted-foreground">Outstanding</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="text-muted-foreground">Unbilled</span>
        </span>
      </div>
    </div>
  );
}

// ── Milestone Status Donut ──
const MILESTONE_COLORS: Record<string, string> = {
  NOT_STARTED: "#475569",
  IN_PROGRESS: "#60a5fa",
  COMPLETED: "#34d399",
  INVOICED: "#818cf8",
};

const MILESTONE_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
};

export function MilestoneStatusDonut({
  data,
  total,
}: {
  data: { name: string; value: number }[];
  total: number;
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) filtered.push({ name: "NOT_STARTED", value: 1 });

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {filtered.map((entry, i) => (
                <Cell key={i} fill={MILESTONE_COLORS[entry.name] ?? "#475569"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">{total}</span>
          <span className="text-[8px] text-muted-foreground">total</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {data.filter((d) => d.value > 0).map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: MILESTONE_COLORS[entry.name] ?? "#475569" }}
            />
            <span className="text-muted-foreground">{MILESTONE_LABELS[entry.name] ?? entry.name}</span>
            <span className="ml-auto tabular-nums font-medium text-secondary-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Revenue by Client Chart ──
export function RevenueByClientChart({
  data,
  currency = "USD",
}: {
  data: { name: string; collected: number; outstanding: number; unbilled: number }[];
  currency?: string;
}) {
  const sym = getCurrencySymbol(currency);
  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart data={data} layout="vertical" barSize={16} barGap={2}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatAxisValue(v, sym)}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [`${sym}${Number(value).toLocaleString()}`]}
          labelStyle={{ color: "#0f172a", fontWeight: 600 }}
          itemStyle={{ color: "#334155" }}
          cursor={false}
        />
        <Bar dataKey="collected" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Collected" />
        <Bar dataKey="outstanding" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Outstanding" />
        <Bar dataKey="unbilled" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} name="Unbilled" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Invoice Pipeline Bar ──
const INVOICE_COLORS: Record<string, string> = {
  DRAFT: "#cbd5e1",
  SUBMITTED: "#f59e0b",
  UNDER_REVIEW: "#f97316",
  APPROVED: "#10b981",
  PAID: "#6366f1",
  REJECTED: "#ef4444",
};

const INVOICE_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
};

export function InvoicePipelineBar({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <div
              key={d.status}
              className="h-full transition-all"
              style={{
                width: `${(d.count / total) * 100}%`,
                backgroundColor: INVOICE_COLORS[d.status] ?? "#475569",
              }}
            />
          ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <div key={d.status} className="flex items-center gap-1.5 text-[10px]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: INVOICE_COLORS[d.status] ?? "#475569" }}
              />
              <span className="text-muted-foreground">{INVOICE_LABELS[d.status] ?? d.status}</span>
              <span className="tabular-nums font-medium text-secondary-foreground">{d.count}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Keep PieLegend for backward compat ──
const PIE_COLORS = ["#2dd4bf", "#60a5fa", "#5f7590"];

export function PieLegend({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="text-foreground font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
