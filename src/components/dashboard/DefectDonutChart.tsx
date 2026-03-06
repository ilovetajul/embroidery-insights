import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { SheetData } from "@/lib/types";

interface Props {
  data: SheetData;
}

const COLORS = [
  "hsl(172, 66%, 40%)", "hsl(222, 47%, 18%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 47%)", "hsl(120, 40%, 45%)",
];

export function DefectDonutChart({ data }: Props) {
  const chartData = data.defectColumns.map((col) => ({
    name: col,
    value: data.rows.reduce((s, r) => s + (r.defects[col] || 0), 0),
  }));

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4">Defect Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
