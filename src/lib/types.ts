export interface DefectRow {
  date: string;
  defects: Record<string, number>;
  totalDefects: number;
  /** Production summary fields (optional) */
  totalQty?: number;
  qcPassQty?: number;
  totalRejectedQty?: number;
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
  totalQty: number;
  qcPassQty: number;
  totalRejectedQty: number;
}
