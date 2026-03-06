import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SheetData } from "@/lib/types";

interface Props {
  data: SheetData;
}

const COLORS = [
  "hsl(222, 47%, 18%)", "hsl(172, 66%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 47%)", "hsl(120, 40%, 45%)",
];

export function StackedBarChart({ data }: Props) {
  const chartData = data.rows.map((row) => ({
    date: row.date,
    ...row.defects,
  }));

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4">Daily Defect Comparison</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }}
              tickFormatter={(v) => v.slice(5)}
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
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {data.defectColumns.map((col, i) => (
              <Bar
                key={col}
                dataKey={col}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
