import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ProductionRow } from "@/lib/types";

interface Props {
  data: ProductionRow[];
}

export function RejectionLineChart({ data }: Props) {
  const chartData = data.map((row) => ({
    date: row.date,
    rate: row.checkedQty > 0 ? +((row.rejects / row.checkedQty) * 100).toFixed(2) : 0,
  }));

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up" style={{ animationDelay: "400ms" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Rejection Rate Trend (%)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 13% 91%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="rate" name="Rejection %" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
