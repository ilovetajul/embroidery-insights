import * as XLSX from "xlsx";

/**
 * Extract the spreadsheet ID from a Google Sheets URL.
 * Supports formats like:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch a public Google Sheet as an XLSX ArrayBuffer via the export URL.
 */
export async function fetchGoogleSheetAsXlsx(spreadsheetId: string): Promise<ArrayBuffer> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(
      `Google Sheet ফেচ করতে ব্যর্থ। নিশ্চিত করুন শীটটি "Anyone with the link" হিসেবে শেয়ার করা আছে।`
    );
  }
  return response.arrayBuffer();
}

/**
 * Get sheet names from an ArrayBuffer (XLSX data).
 */
export function getSheetNamesFromBuffer(buffer: ArrayBuffer): string[] {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: "array" });
  return workbook.SheetNames;
}

/**
 * Convert ArrayBuffer to a File object so existing parseSheet can reuse it.
 */
export function bufferToFile(buffer: ArrayBuffer, fileName: string): File {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return new File([blob], fileName, { type: blob.type });
}
