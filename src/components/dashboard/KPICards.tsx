import { AlertTriangle, TrendingUp, Calendar, Target, Package, CheckCircle, XCircle } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

const cards = [
  { key: "totalQty" as const, label: "Total Qty", icon: Package, color: "text-primary", format: (v: number) => v > 0 ? v.toLocaleString() : "—" },
  { key: "qcPassQty" as const, label: "QC Pass Qty", icon: CheckCircle, color: "text-accent", format: (v: number) => v > 0 ? v.toLocaleString() : "—" },
  { key: "totalRejectedQty" as const, label: "Total Rejected Qty", icon: XCircle, color: "text-destructive", format: (v: number) => v > 0 ? v.toLocaleString() : "—" },
  { key: "totalDefects" as const, label: "Total Defects", icon: AlertTriangle, color: "text-destructive", format: (v: number) => v.toLocaleString() },
  { key: "mostFrequentDefect" as const, label: "Most Frequent Defect", icon: Target, color: "text-accent", format: (v: string) => v },
  { key: "avgDailyDefect" as const, label: "Avg Daily Defect", icon: TrendingUp, color: "text-primary", format: (v: number) => Math.round(v).toLocaleString() },
  { key: "totalDaysRecorded" as const, label: "Total Days Recorded", icon: Calendar, color: "text-muted-foreground", format: (v: number) => v.toString() },
];

export function KPICards({ data }: KPICardsProps) {
  // Filter out cards with zero values for qty fields
  const visibleCards = cards.filter((card) => {
    if (card.key === "totalQty" || card.key === "qcPassQty" || card.key === "totalRejectedQty") {
      return (data[card.key] as number) > 0;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {visibleCards.map((card, i) => {
        const value = data[card.key];
        return (
          <div
            key={card.key}
            className="rounded-xl bg-card p-4 card-shadow animate-fade-in-up border border-border/50"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">
                {card.label}
              </span>
              <card.icon className={`h-3.5 w-3.5 ${card.color} shrink-0`} />
            </div>
            <p className="text-lg font-bold text-foreground truncate">
              {card.format(value as never)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
