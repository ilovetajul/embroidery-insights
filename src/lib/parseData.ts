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

export function parseFile(file: File): Promise<ProductionRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: "" });

        if (json.length === 0) {
          resolve([]);
          return;
        }

        // Log detected headers for debugging
        console.log("Detected headers:", Object.keys(json[0]));

        const rows: ProductionRow[] = json.map((row) => ({
          date: parseExcelDate(findKey(row, ["date", "datum", "day", "tarikh"])),
          checkedQty: toNum(findKey(row, ["checked qty", "quantity checked", "qty checked", "checked", "check qty"])),
          rejects: toNum(findKey(row, ["rejects", "reject", "rejection", "rej"])),
          needleHoles: toNum(findKey(row, ["needle holes", "needle hole", "nh"])),
          uncutThreads: toNum(findKey(row, ["uncut threads", "uncut thread", "ut"])),
          gapStitches: toNum(findKey(row, ["gap stitches", "gap stitch", "gs"])),
        }));

        console.log("Parsed rows sample:", rows.slice(0, 3));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
