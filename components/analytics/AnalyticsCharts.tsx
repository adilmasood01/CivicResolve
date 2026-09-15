"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/** CivicResolve chart palette aligned to --cr-* tokens */
const COLORS = [
  "#3B6FD9", // primary blue
  "#3D8B5C", // success
  "#C4892A", // warn
  "#C44B3A", // danger
  "#5A7A9A", // muted blue-gray
  "#6B7280", // neutral
  "#2F6B8A", // info teal
  "#8B7355", // earth
];

const GRID = "#E8ECF1";
const TICK = "#6B7280";
const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-foreground">No data to display</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

interface TrendChartProps {
  data: { date: string; submitted: number; resolved: number }[];
}

export function ComplaintTrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <ChartEmpty message="Complaint volume over this period will appear here once cases are submitted." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        <Area
          type="monotone"
          dataKey="submitted"
          name="Submitted"
          stroke={COLORS[0]}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSubmitted)"
        />
        <Area
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke={COLORS[1]}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorResolved)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DistributionBarChartProps {
  data: { label?: string; priority?: string; name?: string; count: number }[];
  dataKey: string;
  fillColor?: string;
}

export function DistributionBarChart({
  data,
  dataKey,
  fillColor = COLORS[0],
}: DistributionBarChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmpty message="Distribution data for this metric is not available yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey={dataKey} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: TICK }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Count" fill={fillColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  data: { name: string; count: number; percentage: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return <ChartEmpty message="Category breakdown will appear when complaints are categorized." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
          label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { COLORS as CHART_COLORS };
