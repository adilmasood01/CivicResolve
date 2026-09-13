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

const COLORS = ["#2563EB", "#059669", "#D97706", "#DC2626", "#8B5CF6", "#EC4899", "#64748B", "#0891B2"];

interface TrendChartProps {
  data: { date: string; submitted: number; resolved: number }[];
}

export function ComplaintTrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No trend data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
        <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DistributionBarChartProps {
  data: { label?: string; priority?: string; name?: string; count: number }[];
  dataKey: string;
  fillColor?: string;
}

export function DistributionBarChart({ data, dataKey, fillColor = "#2563EB" }: DistributionBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey={dataKey} tick={{ fontSize: 11, fill: "#64748B" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
        />
        <Bar dataKey="count" name="Count" fill={fillColor} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  data: { name: string; count: number; percentage: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-400">No category data available</div>;
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
          paddingAngle={3}
          dataKey="count"
          nameKey="name"
          label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
