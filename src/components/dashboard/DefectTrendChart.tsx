import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SheetData } from "@/lib/types";

interface Props {
  data: SheetData;
}

const COLORS = [
  "hsl(222, 47%, 18%)", "hsl(172, 66%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(200, 70%, 50%)",
];

export function DefectTrendChart({ data }: Props) {
  const chartData = data.rows.map((row) => ({
    date: row.date,
    total: row.totalDefects,
  }));

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4">Defect Trend by Date</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }}
              tickFormatter={(v) => {
                const parts = v.split("-");
                if (parts.length === 3 && parts[0].length === 4) return String(parseInt(parts[2], 10));
                if (parts.length === 3) return String(parseInt(parts[0], 10));
                return v;
              }}
            />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Defects"
              stroke="hsl(0, 72%, 51%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
