import { useState, useCallback } from "react";
import { Link2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  extractSpreadsheetId,
  fetchGoogleSheetAsXlsx,
  getSheetNamesFromBuffer,
  bufferToFile,
} from "@/lib/googleSheets";

interface GoogleSheetInputProps {
  onFileReady: (file: File) => void;
}

export function GoogleSheetInput({ onFileReady }: GoogleSheetInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const id = extractSpreadsheetId(url.trim());
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
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "লোড করুন"
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
