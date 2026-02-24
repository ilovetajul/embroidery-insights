import { useState, useMemo, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { FileUploadZone } from "@/components/dashboard/FileUploadZone";
import { KPICards } from "@/components/dashboard/KPICards";
import { ProductionBarChart } from "@/components/dashboard/ProductionBarChart";
import { RejectionLineChart } from "@/components/dashboard/RejectionLineChart";
import { DefectDonutChart } from "@/components/dashboard/DefectDonutChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { parseFile } from "@/lib/parseData";
import { sampleData } from "@/lib/sampleData";
import type { ProductionRow, KPIData } from "@/lib/types";

function computeKPIs(rows: ProductionRow[]): KPIData {
  const totalProduction = rows.reduce((s, r) => s + r.checkedQty, 0);
  const avgDailyVolume = rows.length > 0 ? totalProduction / rows.length : 0;
  const totalRejects = rows.reduce((s, r) => s + r.rejects, 0);
  const defectRate = totalProduction > 0 ? (totalRejects / totalProduction) * 100 : 0;

  const defects = {
    "Needle Holes": rows.reduce((s, r) => s + r.needleHoles, 0),
    "Uncut Threads": rows.reduce((s, r) => s + r.uncutThreads, 0),
    "Gap Stitches": rows.reduce((s, r) => s + r.gapStitches, 0),
  };
  const topDefectCategory = Object.entries(defects).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return { totalProduction, avgDailyVolume, defectRate, topDefectCategory };
}

const Index = () => {
  const [data, setData] = useState<ProductionRow[]>(sampleData);

  const kpis = useMemo(() => computeKPIs(data), [data]);

  const handleFile = useCallback(async (file: File) => {
    try {
      const rows = await parseFile(file);
      if (rows.length > 0) setData(rows);
    } catch (err) {
      console.error("Failed to parse file:", err);
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />

      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h1 className="text-lg font-bold text-foreground">Production Dashboard</h1>
            <p className="text-xs text-muted-foreground">Embroidery quality control analytics</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {data.length} records loaded
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <FileUploadZone onFileAccepted={handleFile} />
          <KPICards data={kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductionBarChart data={data} />
            <RejectionLineChart data={data} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DataTable data={data} />
            </div>
            <DefectDonutChart data={data} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
