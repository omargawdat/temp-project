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
  backgroundColor: "#141e30",
  border: "1px solid rgba(36,55,82,0.6)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#dfe1e8",
  boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
};

// ── Cash Flow Funnel Chart ──
export function CashFlowFunnelChart({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={48}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `$${Math.round(v / 1_000_000)}M`;
            if (v >= 1000) return `$${Math.round(v / 1000)}k`;
            return `$${v}`;
          }}
          width={52}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]}
          labelStyle={{ color: "#dfe1e8", fontWeight: 600 }}
          itemStyle={{ color: "#dfe1e8" }}
          cursor={{ fill: "rgba(255,255,255,0.02)" }}
        />
        <defs>
          <linearGradient id="cfPortfolio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="cfBilled" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="cfCollected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
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
    return "#1e2f4a";
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
          <span className="text-3xl font-bold text-white">{collectedPct}%</span>
          <span className="text-[10px] text-white/30">collected</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-white/40">Collected</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-white/40">Outstanding</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1e2f4a]" />
          <span className="text-white/40">Unbilled</span>
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
  READY_FOR_INVOICING: "#a78bfa",
  INVOICED: "#818cf8",
};

const MILESTONE_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  READY_FOR_INVOICING: "Ready to Invoice",
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
          <span className="text-lg font-bold text-white">{total}</span>
          <span className="text-[8px] text-white/25">total</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {data.filter((d) => d.value > 0).map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: MILESTONE_COLORS[entry.name] ?? "#475569" }}
            />
            <span className="text-white/40">{MILESTONE_LABELS[entry.name] ?? entry.name}</span>
            <span className="ml-auto tabular-nums font-medium text-white/60">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Revenue by Client Chart ──
export function RevenueByClientChart({
  data,
}: {
  data: { name: string; collected: number; outstanding: number; unbilled: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart data={data} layout="vertical" barSize={16} barGap={2}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          type="number"
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `$${Math.round(v / 1_000_000)}M`;
            if (v >= 1000) return `$${Math.round(v / 1000)}k`;
            return `$${v}`;
          }}
          tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [`$${Number(value).toLocaleString()}`]}
          labelStyle={{ color: "#dfe1e8", fontWeight: 600 }}
          itemStyle={{ color: "#dfe1e8" }}
          cursor={false}
        />
        <Bar dataKey="collected" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} name="Collected" />
        <Bar dataKey="outstanding" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Outstanding" />
        <Bar dataKey="unbilled" stackId="a" fill="#1e2f4a" radius={[0, 4, 4, 0]} name="Unbilled" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Invoice Pipeline Bar ──
const INVOICE_COLORS: Record<string, string> = {
  DRAFT: "rgba(255,255,255,0.12)",
  SUBMITTED: "#f59e0b",
  UNDER_REVIEW: "#f97316",
  APPROVED: "#34d399",
  PAID: "#2dd4bf",
  REJECTED: "#f43f5e",
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
              <span className="text-white/35">{INVOICE_LABELS[d.status] ?? d.status}</span>
              <span className="tabular-nums font-medium text-white/55">{d.count}</span>
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
