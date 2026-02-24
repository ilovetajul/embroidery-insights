import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { ProductionRow } from "@/lib/types";

interface Props {
  data: ProductionRow[];
}

const COLORS = ["hsl(172 66% 40%)", "hsl(222 47% 18%)", "hsl(38 92% 50%)", "hsl(262 52% 47%)"];

export function DefectDonutChart({ data }: Props) {
  const totals = data.reduce(
    (acc, row) => {
      acc.needleHoles += row.needleHoles;
      acc.uncutThreads += row.uncutThreads;
      acc.gapStitches += row.gapStitches;
      return acc;
    },
    { needleHoles: 0, uncutThreads: 0, gapStitches: 0 }
  );

  const chartData = [
    { name: "Needle Holes", value: totals.needleHoles },
    { name: "Uncut Threads", value: totals.uncutThreads },
    { name: "Gap Stitches", value: totals.gapStitches },
  ];

  return (
    <div className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up" style={{ animationDelay: "480ms" }}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Defect Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 13% 91%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
