export interface ProductionRow {
  date: string;
  checkedQty: number;
  rejects: number;
  needleHoles: number;
  uncutThreads: number;
  gapStitches: number;
  [key: string]: string | number;
}

export interface KPIData {
  totalProduction: number;
  avgDailyVolume: number;
  defectRate: number;
  topDefectCategory: string;
}
