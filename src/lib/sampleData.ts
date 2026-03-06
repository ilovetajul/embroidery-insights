import type { SheetData } from "./types";

const embDefects = ["Broken Thread", "Missing Stitch", "Dirty Spot", "Puckering", "Thread Break"];
const printDefects = ["Color Bleeding", "Misalignment", "Ink Smudge", "Fading", "Double Print"];

function genRows(defectNames: string[], days: number) {
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const date = `2026-01-${String(d).padStart(2, "0")}`;
    const defects: Record<string, number> = {};
    let total = 0;
    defectNames.forEach((name) => {
      const v = Math.floor(Math.random() * 15) + 1;
      defects[name] = v;
      total += v;
    });
    rows.push({ date, defects, totalDefects: total });
  }
  return rows;
}

export const sampleSheets: SheetData[] = [
  {
    sheetName: "EMB-January26",
    rows: genRows(embDefects, 25),
    defectColumns: embDefects,
  },
  {
    sheetName: "Printing January26",
    rows: genRows(printDefects, 25),
    defectColumns: printDefects,
  },
];
