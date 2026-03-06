import { useState, useMemo, useCallback } from "react";
import { FileUploadZone } from "@/components/dashboard/FileUploadZone";
import { GoogleSheetInput } from "@/components/dashboard/GoogleSheetInput";
import { KPICards } from "@/components/dashboard/KPICards";
import { DefectBarChart } from "@/components/dashboard/DefectBarChart";
import { DefectDonutChart } from "@/components/dashboard/DefectDonutChart";
import { DefectTrendChart } from "@/components/dashboard/DefectTrendChart";
import { StackedBarChart } from "@/components/dashboard/StackedBarChart";
import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getSheetNames, parseSheet } from "@/lib/parseData";
import { sampleSheets } from "@/lib/sampleData";
import type { SheetData, KPIData } from "@/lib/types";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function computeKPIs(sheet: SheetData): KPIData {
  const totalDefects = sheet.rows.reduce((s, r) => s + r.totalDefects, 0);
  const avgDailyDefect = sheet.rows.length > 0 ? totalDefects / sheet.rows.length : 0;
  const totalDaysRecorded = sheet.rows.length;

  const defectTotals: Record<string, number> = {};
  sheet.rows.forEach((r) => {
    Object.entries(r.defects).forEach(([key, val]) => {
      defectTotals[key] = (defectTotals[key] || 0) + val;
    });
  });

  const mostFrequentDefect =
    Object.entries(defectTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return { totalDefects, mostFrequentDefect, avgDailyDefect, totalDaysRecorded };
}

const Index = () => {
  const [sheets, setSheets] = useState<SheetData[]>(sampleSheets);
  const [activeTab, setActiveTab] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeSheet = sheets[activeTab] ?? sheets[0];
  const kpis = useMemo(() => (activeSheet ? computeKPIs(activeSheet) : null), [activeSheet]);

  const handleFile = useCallback(async (file: File) => {
    try {
      const names = await getSheetNames(file);
      const parsedSheets: SheetData[] = [];
      for (const name of names) {
        const sheetData = await parseSheet(file, name);
        if (sheetData.rows.length > 0) {
          parsedSheets.push(sheetData);
        }
      }
      if (parsedSheets.length > 0) {
        setSheets(parsedSheets);
        setActiveTab(0);
      }
    } catch (err) {
      console.error("Failed to parse file:", err);
    }
  }, []);

  const toggleDark = () => {
    setDarkMode((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-foreground">Defect Analytics Dashboard</h1>
              <p className="text-xs text-muted-foreground">Production quality control insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {activeSheet?.rows.length ?? 0} records
            </span>
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
          {/* Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FileUploadZone onFileAccepted={handleFile} />
            <GoogleSheetInput onFileReady={handleFile} />
          </div>

          {/* Tabs */}
          {sheets.length > 1 && (
            <div className="flex gap-1 p-1 rounded-xl bg-muted/60">
              {sheets.map((sheet, i) => (
                <button
                  key={sheet.sheetName}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    i === activeTab
                      ? "bg-card text-foreground card-shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sheet.sheetName}
                </button>
              ))}
            </div>
          )}

          {/* KPIs */}
          {kpis && <KPICards data={kpis} />}

          {/* Charts Row 1 */}
          {activeSheet && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DefectBarChart data={activeSheet} />
                <DefectDonutChart data={activeSheet} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DefectTrendChart data={activeSheet} />
                <StackedBarChart data={activeSheet} />
              </div>

              <DataTable data={activeSheet} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
