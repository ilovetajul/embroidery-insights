import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SheetData } from "@/lib/types";

interface Props {
  data: SheetData;
}

const COLORS = [
  "hsl(222, 47%, 18%)", "hsl(172, 66%, 40%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 47%)", "hsl(120, 40%, 45%)",
];

export function DefectBarChart({ data }: Props) {
  const totals = data.defectColumns.map((col, i) => ({
    name: col,
    value: data.rows.reduce((s, r) => s + (r.defects[col] || 0), 0),
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up border border-border/50">
      <h3 className="text-sm font-semibold text-foreground mb-4">Defect Frequency by Type</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totals} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }}
              angle={-30}
              textAnchor="end"
              interval={0}
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
            <Bar dataKey="value" name="Total" radius={[4, 4, 0, 0]}>
              {totals.map((entry, i) => (
                <rect key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
