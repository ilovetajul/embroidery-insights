import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import type { SheetData } from "@/lib/types";

interface Props {
  data: SheetData;
}

const PAGE_SIZE = 10;

export function DataTable({ data }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const allColumns = ["date", ...data.defectColumns, "totalDefects"];

  const filtered = useMemo(() => {
    let rows = data.rows;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => {
        if (r.date.toLowerCase().includes(q)) return true;
        return data.defectColumns.some((col) => col.toLowerCase().includes(q));
      });
    }
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        let va: number | string, vb: number | string;
        if (sortCol === "date") {
          va = a.date;
          vb = b.date;
        } else if (sortCol === "totalDefects") {
          va = a.totalDefects;
          vb = b.totalDefects;
        } else {
          va = a.defects[sortCol] || 0;
          vb = b.defects[sortCol] || 0;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const formatHeader = (col: string) => {
    if (col === "date") return "Date";
    if (col === "totalDefects") return "Total";
    return col;
  };

  return (
    <div className="rounded-xl bg-card card-shadow animate-fade-in-up border border-border/50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Defect Data</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-8 rounded-lg border border-input bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {allColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    {formatHeader(col)}
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                  No data found
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.date}</td>
                  {data.defectColumns.map((col) => (
                    <td key={col} className="px-4 py-2.5">{row.defects[col] || 0}</td>
                  ))}
                  <td className="px-4 py-2.5 font-semibold">{row.totalDefects}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {filtered.length} row{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
