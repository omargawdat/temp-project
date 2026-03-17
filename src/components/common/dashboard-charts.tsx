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

const PIE_COLORS = ["#818cf8", "#34d399", "#8890a4"];

export function ProjectStatusChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={6}
          dataKey="value"
          stroke="none"
          cornerRadius={4}
        >
          {data.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#21242e",
            border: "1px solid #323648",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#dfe1e8",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
          itemStyle={{ color: "#dfe1e8" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#323648"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#8890a4" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8890a4" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#21242e",
            border: "1px solid #323648",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#dfe1e8",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
          formatter={(value) => [
            `$${Number(value).toLocaleString()}`,
            "Revenue",
          ]}
          cursor={{ fill: "rgba(129, 140, 248, 0.06)" }}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
            style={{
              backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
            }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="text-foreground font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
