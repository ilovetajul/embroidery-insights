import * as XLSX from "xlsx";
import type { ProductionRow } from "./types";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim();
}

function findKey(row: Record<string, unknown>, aliases: string[]): unknown {
  const normalizedAliases = aliases.map(normalize);
  for (const key of Object.keys(row)) {
    const nk = normalize(String(key));
    for (const alias of normalizedAliases) {
      if (nk === alias || nk.startsWith(alias) || nk.includes(alias)) {
        return row[key];
      }
    }
  }
  return undefined;
}

function parseExcelDate(value: unknown): string {
  if (value == null || value === "") return "";
  // Excel serial date
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
  const headerHints = [
    "date",
    "total check qty",
    "checked qty",
    "emb reject qty",
    "reject",
    "needle hole",
    "uncut thread",
    "gap stitch",
  ];

  const maxScanRows = Math.min(matrix.length, 40);
  for (let r = 0; r < maxScanRows; r++) {
    const row = matrix[r] ?? [];
    const cells = row.map((v) => normalize(String(v ?? ""))).filter(Boolean);
    if (cells.length === 0) continue;

    const matchCount = headerHints.filter((hint) =>
      cells.some((cell) => cell.includes(hint) || hint.includes(cell))
    ).length;

    // Header row must contain date + at least one quantity/defect column
    const hasDate = cells.some((cell) => cell.includes("date"));
    if (hasDate && matchCount >= 2) return r;
  }

  return -1;
}

export function parseSheet(file: File, sheetName: string): Promise<ProductionRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          resolve([]);
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
          resolve([]);
          return;
        }

        const headerRow = matrix[headerRowIndex] ?? [];
        const subHeaderRow = matrix[headerRowIndex + 1] ?? [];

        const headers = headerRow.map((h, i) => {
          const top = String(h ?? "").trim();
          const sub = String(subHeaderRow[i] ?? "").trim();
          const topNorm = normalize(top);
          if (!top || topNorm === "reject details" || topNorm === "defect details") {
            return sub || `col_${i}`;
          }
          return top;
        });

        console.log("Detected headers:", headers);

        const rows: ProductionRow[] = [];
        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const row = matrix[r] ?? [];
          if (!row.some((v) => String(v ?? "").trim() !== "")) continue;

          const rowObj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            rowObj[h] = row[i] ?? "";
          });

          const dateVal = findKey(rowObj, ["date", "datum", "day", "tarikh"]);
          const dateStr = String(dateVal ?? "").trim().toLowerCase();

          if (!dateStr || dateStr.includes("total") || dateStr.includes("g-total")) continue;

          const checkedQty = toNum(
            findKey(rowObj, [
              "total check qty",
              "checked qty",
              "quantity checked",
              "qty checked",
              "checked",
              "check qty",
            ])
          );

          // skip invalid/summary lines like #DIV/0 rows
          if (checkedQty <= 0) continue;

          rows.push({
            date: parseExcelDate(dateVal),
            checkedQty,
            rejects: toNum(findKey(rowObj, ["emb reject qty", "reject qty", "rejects", "reject", "rejection", "rej"])),
            needleHoles: toNum(findKey(rowObj, ["needle hole", "needle holes", "nh"])),
            uncutThreads: toNum(findKey(rowObj, ["uncut thread", "uncut threads", "ut"])),
            gapStitches: toNum(findKey(rowObj, ["gap stitch", "gap stitches", "gs"])),
          });
        }

        console.log("Parsed rows sample:", rows.slice(0, 3));
        console.log("Total rows parsed:", rows.length);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
