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

const DATE_HINTS = ["date", "datum", "day", "tarikh", "তারিখ"];
const SUMMARY_HINTS = [
  "total check", "check qty", "pass qty", "q.c pass", "qc pass",
  "reject qty", "reject %", "defect %", "emb reject", "print reject",
  "emb defect", "print defect", "total qty", "total rejected",
  "total check qty", "qc pass qty", "total rejected qty",
];

// Keys for extracting specific summary columns
const TOTAL_QTY_HINTS = ["total check", "total check qty", "total qty", "check qty"];
const QC_PASS_HINTS = ["pass qty", "q.c pass", "qc pass", "qc pass qty"];
const REJECTED_QTY_HINTS = ["reject qty", "total rejected", "total rejected qty", "emb reject", "print reject"];
const CATEGORY_HINTS = ["reject details", "defect details", "reject  details"];

function isSummaryColumn(name: string): boolean {
  const n = normalize(name);
  return SUMMARY_HINTS.some((h) => n.includes(h));
}

function isCategoryHeader(name: string): boolean {
  const n = normalize(name);
  return CATEGORY_HINTS.some((h) => n.includes(h));
}

function findHeaderRowFromMatrix(matrix: unknown[][]): number {
  const maxScanRows = Math.min(matrix.length, 40);
  for (let r = 0; r < maxScanRows; r++) {
    const row = matrix[r] ?? [];
    const cells = row.map((v) => normalize(String(v ?? ""))).filter(Boolean);
    if (cells.length < 2) continue;
    const hasDate = cells.some((cell) =>
      DATE_HINTS.some((hint) => cell.includes(hint) || hint.includes(cell))
    );
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
        const subHeaderRow = matrix[headerRowIndex + 1] ?? [];

        // Build column info: merge main header + sub-header
        const headers: string[] = headerRow.map((h, i) => {
          const val = String(h ?? "").trim();
          return val || `col_${i}`;
        });

        // Check if there's a sub-header row (has text in col_X positions)
        const hasSubHeaders = headers.some(
          (h, i) => h.startsWith("col_") && String(subHeaderRow[i] ?? "").trim() !== ""
        );

        // Build final column mapping
        type ColInfo = { index: number; name: string; isDefect: boolean };
        const columns: ColInfo[] = [];
        let currentCategory = "";
        let dataStartRow = headerRowIndex + 1;

        if (hasSubHeaders) {
          dataStartRow = headerRowIndex + 2;
        }

        for (let i = 1; i < headers.length; i++) {
          const mainHeader = headers[i];
          const subHeader = hasSubHeaders ? String(subHeaderRow[i] ?? "").trim() : "";

          if (isCategoryHeader(mainHeader)) {
            // This is a category header like "Reject Details" or "Defect Details"
            currentCategory = mainHeader;
            // If it has its own value in data rows, skip it (it's a total)
            continue;
          }

          if (mainHeader.startsWith("col_") && subHeader) {
            // This is a sub-column under a category - these are actual defect types
            columns.push({ index: i, name: subHeader, isDefect: true });
          } else if (!mainHeader.startsWith("col_")) {
            // Named column - check if it's a summary column
            columns.push({
              index: i,
              name: mainHeader,
              isDefect: !isSummaryColumn(mainHeader),
            });
          }
        }

        // If no sub-headers found and no category headers, treat all non-summary columns as defects
        // (simple format: Date | Defect1 | Defect2 | ...)
        const defectCols = columns.filter((c) => c.isDefect);
        const defectColumns = defectCols.map((c) => c.name);

        console.log("Final defect columns:", defectColumns);
        console.log("Summary columns:", columns.filter((c) => !c.isDefect).map((c) => c.name));

        const rows: DefectRow[] = [];
        for (let r = dataStartRow; r < matrix.length; r++) {
          const row = matrix[r] ?? [];
          if (!row.some((v) => String(v ?? "").trim() !== "")) continue;

          const dateVal = row[0];
          const dateStr = String(dateVal ?? "").trim().toLowerCase();

          if (
            !dateStr ||
            dateStr.includes("total") ||
            dateStr.includes("g-total") ||
            dateStr.includes("grand")
          )
            continue;

          const defects: Record<string, number> = {};
          let totalDefects = 0;

          defectCols.forEach((col) => {
            const val = toNum(row[col.index]);
            defects[col.name] = val;
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
