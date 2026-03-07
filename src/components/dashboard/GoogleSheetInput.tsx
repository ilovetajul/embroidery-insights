import { useState, useCallback, useEffect } from "react";
import { Link2, Loader2, AlertCircle, Bookmark, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  extractSpreadsheetId,
  fetchGoogleSheetAsXlsx,
  bufferToFile,
} from "@/lib/googleSheets";

const STORAGE_KEY = "defectiq_saved_urls";

interface GoogleSheetInputProps {
  onFileReady: (file: File) => void;
}

function getSavedUrls(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUrl(url: string) {
  const urls = getSavedUrls().filter((u) => u !== url);
  urls.unshift(url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls.slice(0, 5)));
}

function removeUrl(url: string) {
  const urls = getSavedUrls().filter((u) => u !== url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export function GoogleSheetInput({ onFileReady }: GoogleSheetInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);

  useEffect(() => {
    setSavedUrls(getSavedUrls());
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const trimmed = url.trim();
    const id = extractSpreadsheetId(trimmed);
    if (!id) {
      setError("সঠিক Google Sheets লিংক দিন।");
      return;
    }

    setLoading(true);
    try {
      const buffer = await fetchGoogleSheetAsXlsx(id);
      const file = bufferToFile(buffer, "GoogleSheet.xlsx");
      onFileReady(file);
    } catch (err: any) {
      setError(err.message || "শীট লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [url, onFileReady]);

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    saveUrl(trimmed);
    setSavedUrls(getSavedUrls());
  };

  const handleRemove = (u: string) => {
    removeUrl(u);
    setSavedUrls(getSavedUrls());
  };

  const handleSelectSaved = (u: string) => {
    setUrl(u);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 card-shadow">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Link2 className="h-5 w-5 text-accent" />
        Google Sheets থেকে ডাটা লোড করুন
      </div>
      <p className="text-xs text-muted-foreground">
        শীটটি অবশ্যই <strong>"Anyone with the link"</strong> হিসেবে শেয়ার করা থাকতে হবে।
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          className="flex-1"
          disabled={loading}
        />
        <Button onClick={handleSubmit} disabled={loading || !url.trim()} size="default">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "লোড"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSave}
          disabled={!url.trim()}
          title="লিংক সেভ করুন"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {savedUrls.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            সেভ করা লিংক
          </span>
          {savedUrls.map((u) => (
            <div
              key={u}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => handleSelectSaved(u)}
                className="flex-1 text-left text-xs text-muted-foreground hover:text-foreground truncate transition-colors"
              >
                {u}
              </button>
              <button
                onClick={() => handleRemove(u)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
