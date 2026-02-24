import { Package, TrendingUp, AlertTriangle, Target } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

const cards = [
  { key: "totalProduction" as const, label: "Total Production", icon: Package, format: (v: number) => v.toLocaleString() },
  { key: "avgDailyVolume" as const, label: "Avg Daily Volume", icon: TrendingUp, format: (v: number) => Math.round(v).toLocaleString() },
  { key: "defectRate" as const, label: "Defect Rate", icon: AlertTriangle, format: (v: number) => v.toFixed(2) + "%" },
  { key: "topDefectCategory" as const, label: "Top Defect", icon: Target, format: (v: string) => v },
];

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const value = data[card.key];
        return (
          <div
            key={card.key}
            className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <card.icon className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {card.format(value as never)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
