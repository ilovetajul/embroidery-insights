import { AlertTriangle, TrendingUp, Calendar, Target } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

const cards = [
  { key: "totalDefects" as const, label: "Total Defects", icon: AlertTriangle, color: "text-destructive", format: (v: number) => v.toLocaleString() },
  { key: "mostFrequentDefect" as const, label: "Most Frequent Defect", icon: Target, color: "text-accent", format: (v: string) => v },
  { key: "avgDailyDefect" as const, label: "Avg Daily Defect", icon: TrendingUp, color: "text-primary", format: (v: number) => Math.round(v).toLocaleString() },
  { key: "totalDaysRecorded" as const, label: "Total Days Recorded", icon: Calendar, color: "text-muted-foreground", format: (v: number) => v.toString() },
];

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const value = data[card.key];
        return (
          <div
            key={card.key}
            className="rounded-xl bg-card p-5 card-shadow animate-fade-in-up border border-border/50"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
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
