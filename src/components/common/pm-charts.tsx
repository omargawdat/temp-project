"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const RING_COLORS = ["#fbbf24", "#2dd4bf", "#243752"];

export function BillingRingChart({
  billed,
  collected,
  total,
}: {
  billed: number;
  collected: number;
  total: number;
}) {
  const unbilled = Math.max(0, total - billed);
  const outstanding = Math.max(0, billed - collected);

  const data = [
    { name: "Collected", value: collected },
    { name: "Outstanding", value: outstanding },
    { name: "Unbilled", value: unbilled },
  ].filter((d) => d.value > 0);

  // If everything is 0, show empty ring
  if (data.length === 0) {
    data.push({ name: "Empty", value: 1 });
  }

  const colors = data.map((d) => {
    if (d.name === "Collected") return "#34d399";
    if (d.name === "Outstanding") return "#fbbf24";
    if (d.name === "Unbilled") return "#1e2f4a";
    return "#1e2f4a";
  });

  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={52}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">{collectedPct}%</span>
          <span className="text-[10px] text-muted-foreground/50">collected</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-muted-foreground/60">Collected</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-muted-foreground/60">Outstanding</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1e2f4a]" />
          <span className="text-muted-foreground/60">Unbilled</span>
        </span>
      </div>
    </div>
  );
}

interface ProjectBarData {
  name: string;
  collected: number;
  outstanding: number;
  unbilled: number;
}

export function ProjectBreakdownChart({ data }: { data: ProjectBarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" barSize={14} barGap={2}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          type="number"
          tickFormatter={(v) => `$${v.toLocaleString()}`}
          tick={{ fontSize: 11, fill: "rgba(136,153,175,0.5)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "rgba(234,240,248,0.7)" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            background: "#141e30",
            border: "1px solid rgba(36,55,82,0.6)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`$${Number(value).toLocaleString()}`]}
          labelStyle={{ color: "rgba(234,240,248,0.8)", fontWeight: 600 }}
        />
        <Bar dataKey="collected" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} name="Collected" />
        <Bar dataKey="outstanding" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Outstanding" />
        <Bar dataKey="unbilled" stackId="a" fill="#1e2f4a" radius={[0, 4, 4, 0]} name="Unbilled" />
      </BarChart>
    </ResponsiveContainer>
  );
}
