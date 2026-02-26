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

function findHeaderRow(sheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string" && normalize(cell.v).includes("date")) {
        return r;
      }
    }
  }
  return 0;
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

        // Find the actual header row (skip company name, address, title rows)
        const headerRowIndex = findHeaderRow(sheet);
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

        // Read headers from the header row (may span 2 rows for merged headers)
        const headers: string[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell1 = sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
          const cell2 = sheet[XLSX.utils.encode_cell({ r: headerRowIndex + 1, c })];
          const h1 = cell1 ? String(cell1.v).trim() : "";
          const h2 = cell2 ? String(cell2.v).trim() : "";
          // Use sub-header if main header is empty or generic
          headers.push(h2 || h1 || `col_${c}`);
        }

        console.log("Detected headers:", headers);

        // Read data rows starting after header rows
        const dataStartRow = headerRowIndex + 2;
        const rows: ProductionRow[] = [];

        for (let r = dataStartRow; r <= range.e.r; r++) {
          const rowObj: Record<string, unknown> = {};
          let hasData = false;
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v != null && cell.v !== "") {
              rowObj[headers[c - range.s.c]] = cell.v;
              hasData = true;
            }
          }
          if (!hasData) continue;

          // Skip total/summary rows
          const dateVal = findKey(rowObj, ["date", "datum", "day", "tarikh"]);
          if (dateVal == null || String(dateVal).toLowerCase().includes("total")) continue;

          const checkedQty = toNum(findKey(rowObj, ["total check qty", "checked qty", "quantity checked", "qty checked", "checked", "check qty"]));
          if (checkedQty === 0) continue; // Skip empty/invalid rows

          rows.push({
            date: parseExcelDate(dateVal),
            checkedQty,
            rejects: toNum(findKey(rowObj, ["emb reject qty", "rejects", "reject", "rejection", "rej", "reject qty"])),
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
