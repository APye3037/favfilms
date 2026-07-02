import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TypeBreakdownEntry } from "../hooks/useDashboardStats";

interface FilmsByTypeChartProps {
  data: TypeBreakdownEntry[];
}

export function FilmsByTypeChart({ data }: FilmsByTypeChartProps) {
  if (data.length === 0) {
    return (
      <p className="empty-state" role="status">
        No films yet — add a film to see the breakdown by type.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="typeName" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Films" fill="#4f46e5" />
      </BarChart>
    </ResponsiveContainer>
  );
}
