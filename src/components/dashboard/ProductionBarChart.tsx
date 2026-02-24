import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ProductionRow } from "@/lib/types";

interface Props {
  data: ProductionRow[];
}

export function ProductionBarChart({ data }: Props) {
  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up" style={{ animationDelay: "320ms" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Daily Production Volume</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 13% 91%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Bar dataKey="checkedQty" name="Checked Qty" fill="hsl(222 47% 18%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
