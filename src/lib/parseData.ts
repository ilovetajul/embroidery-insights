import * as XLSX from "xlsx";
import type { ProductionRow } from "./types";

export function parseFile(file: File): Promise<ProductionRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const rows: ProductionRow[] = json.map((row) => ({
          date: String(row["Date"] ?? row["date"] ?? ""),
          checkedQty: Number(row["Checked Qty"] ?? row["checked_qty"] ?? row["CheckedQty"] ?? 0),
          rejects: Number(row["Rejects"] ?? row["rejects"] ?? 0),
          needleHoles: Number(row["Needle Holes"] ?? row["needle_holes"] ?? row["NeedleHoles"] ?? 0),
          uncutThreads: Number(row["Uncut Threads"] ?? row["uncut_threads"] ?? row["UncutThreads"] ?? 0),
          gapStitches: Number(row["Gap Stitches"] ?? row["gap_stitches"] ?? row["GapStitches"] ?? 0),
        }));

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
