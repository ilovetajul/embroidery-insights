import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

interface FileUploadZoneProps {
  onFileAccepted: (file: File) => void;
}

export function FileUploadZone({ onFileAccepted }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${
        dragOver
          ? "border-accent bg-accent/5 scale-[1.01]"
          : "border-border bg-card hover:border-accent/50"
      } card-shadow`}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {fileName ? (
        <>
          <FileSpreadsheet className="h-10 w-10 text-accent" />
          <p className="text-sm font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground">Click or drop to replace</p>
        </>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop your Excel or CSV file here
          </p>
          <p className="text-xs text-muted-foreground">
            Supports .xlsx, .xls, and .csv formats
          </p>
        </>
      )}
    </div>
  );
}
