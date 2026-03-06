export interface DefectRow {
  date: string;
  defects: Record<string, number>;
  totalDefects: number;
}

export interface SheetData {
  sheetName: string;
  rows: DefectRow[];
  defectColumns: string[];
}

export interface KPIData {
  totalDefects: number;
  mostFrequentDefect: string;
  avgDailyDefect: number;
  totalDaysRecorded: number;
}
