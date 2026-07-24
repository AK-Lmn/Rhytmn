"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ActivityChart({ data }: { data: Array<{ label: string; poop: number; pee: number }> }) {
  return (
    <div className="chart-wrap" aria-label="Seven day bowel and urination activity chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis hide allowDecimals={false} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} contentStyle={{ borderRadius: 14, borderColor: "var(--line)", background: "var(--surface)" }} />
          <Bar dataKey="poop" name="Bowel" fill="var(--amber)" radius={[5, 5, 2, 2]} />
          <Bar dataKey="pee" name="Urination" fill="var(--blue)" radius={[5, 5, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="sr-only">Text summary: bowel and urination counts for each of the last seven days.</p>
    </div>
  );
}

export function HydrationChart({ data, goal }: { data: Array<{ label: string; hydration: number }>; goal: number }) {
  return (
    <div className="chart-wrap" aria-label="Seven day hydration chart">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs><linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0.03} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis hide domain={[0, Math.max(goal, ...data.map((item) => item.hydration))]} />
          <Tooltip contentStyle={{ borderRadius: 14, borderColor: "var(--line)", background: "var(--surface)" }} formatter={(value) => [`${Number(value).toLocaleString()} ml`, "Hydration"]} />
          <Area type="monotone" dataKey="hydration" stroke="var(--teal)" fill="url(#waterFill)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BristolDistribution({ data }: { data: Array<{ type: string; value: number }> }) {
  const colors = ["#b98755", "#c99c69", "#d9ae76", "#5fa58f", "#7cb59e", "#d88f66", "#c96f63"];
  return (
    <div className="chart-wrap donut" aria-label="Bristol stool type distribution chart">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="type" innerRadius={58} outerRadius={88} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={entry.type} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 14, borderColor: "var(--line)", background: "var(--surface)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
