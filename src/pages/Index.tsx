import { useState, useMemo, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { FileUploadZone } from "@/components/dashboard/FileUploadZone";
import { KPICards } from "@/components/dashboard/KPICards";
import { ProductionBarChart } from "@/components/dashboard/ProductionBarChart";
import { RejectionLineChart } from "@/components/dashboard/RejectionLineChart";
import { DefectDonutChart } from "@/components/dashboard/DefectDonutChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { getSheetNames, parseSheet } from "@/lib/parseData";
import { sampleData } from "@/lib/sampleData";
import type { ProductionRow, KPIData } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react";

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  const kpis = useMemo(() => computeKPIs(data), [data]);

  const handleFile = useCallback(async (file: File) => {
    try {
      setUploadedFile(file);
      const names = await getSheetNames(file);
      setSheetNames(names);
      if (names.length === 1) {
        // শুধু একটি শীট থাকলে সরাসরি লোড করো
        setSelectedSheet(names[0]);
        const rows = await parseSheet(file, names[0]);
        if (rows.length > 0) setData(rows);
      } else {
        setSelectedSheet("");
        setData([]);
      }
    } catch (err) {
      console.error("Failed to parse file:", err);
    }
  }, []);

  const handleSheetSelect = useCallback(async (sheetName: string) => {
    if (!uploadedFile) return;
    setSelectedSheet(sheetName);
    try {
      const rows = await parseSheet(uploadedFile, sheetName);
      if (rows.length > 0) setData(rows);
    } catch (err) {
      console.error("Failed to parse sheet:", err);
    }
  }, [uploadedFile]);

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

          {sheetNames.length > 1 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card card-shadow">
              <FileSpreadsheet className="h-5 w-5 text-accent shrink-0" />
              <span className="text-sm font-medium text-foreground">শীট সিলেক্ট করুন:</span>
              <Select value={selectedSheet} onValueChange={handleSheetSelect}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="একটি শীট বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
