import * as XLSX from "xlsx";
import type { DefectRow, SheetData } from "./types";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim();
}

function parseExcelDate(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number" && value > 1 && value < 100000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split("T")[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value);
}

function toNum(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  let str = String(value).trim().replace(/[^\d.,-]/g, "");
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  if (lastComma > lastDot) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    str = str.replace(/,/g, "");
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export function getSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function findHeaderRowFromMatrix(matrix: unknown[][]): number {
  const dateHints = ["date", "datum", "day", "tarikh", "তারিখ"];
  const maxScanRows = Math.min(matrix.length, 40);

  for (let r = 0; r < maxScanRows; r++) {
    const row = matrix[r] ?? [];
    const cells = row.map((v) => normalize(String(v ?? ""))).filter(Boolean);
    if (cells.length < 2) continue;

    const hasDate = cells.some((cell) =>
      dateHints.some((hint) => cell.includes(hint) || hint.includes(cell))
    );

    // Header row: has "date" and at least 2 other non-empty columns
    if (hasDate && cells.length >= 3) return r;
  }

  return -1;
}

export function parseSheet(file: File, sheetName: string): Promise<SheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          resolve({ sheetName, rows: [], defectColumns: [] });
          return;
        }

        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        const headerRowIndex = findHeaderRowFromMatrix(matrix);
        if (headerRowIndex === -1) {
          console.log("Header row not found for sheet:", sheetName);
          resolve({ sheetName, rows: [], defectColumns: [] });
          return;
        }

        const headerRow = matrix[headerRowIndex] ?? [];
        const headers = headerRow.map((h, i) => {
          const val = String(h ?? "").trim();
          return val || `col_${i}`;
        });

        console.log("Detected headers:", headers);

        // First column is date, rest are defect types
        const defectColumns = headers.slice(1).filter((h) => !h.startsWith("col_"));

        const rows: DefectRow[] = [];
        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const row = matrix[r] ?? [];
          if (!row.some((v) => String(v ?? "").trim() !== "")) continue;

          const dateVal = row[0];
          const dateStr = String(dateVal ?? "").trim().toLowerCase();

          if (!dateStr || dateStr.includes("total") || dateStr.includes("g-total") || dateStr.includes("grand")) continue;

          const defects: Record<string, number> = {};
          let totalDefects = 0;

          defectColumns.forEach((col, i) => {
            const val = toNum(row[i + 1]);
            defects[col] = val;
            totalDefects += val;
          });

          if (totalDefects <= 0) continue;

          rows.push({
            date: parseExcelDate(dateVal),
            defects,
            totalDefects,
          });
        }

        console.log("Parsed rows sample:", rows.slice(0, 3));
        console.log("Total rows parsed:", rows.length);
        console.log("Defect columns:", defectColumns);

        resolve({ sheetName, rows, defectColumns });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
