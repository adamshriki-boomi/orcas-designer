"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fileToAttachment, formatFileSize } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { Upload, X, File } from "lucide-react";
import type { FileAttachment } from "@/lib/types";

interface FileUploadProps {
  file: FileAttachment | null;
  onFileChange: (file: FileAttachment | null) => void;
  accept?: string;
}

export function FileUpload({ file, onFileChange, accept }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (rawFile: globalThis.File) => {
      try {
        setError(null);
        const attachment = await fileToAttachment(rawFile);
        onFileChange(attachment);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file.");
      }
    },
    [onFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (file) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2">
        <File className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onFileChange(null)}
          aria-label="Remove file"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/40"
        )}
      >
        <Upload className="size-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop a file here, or click to browse
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
