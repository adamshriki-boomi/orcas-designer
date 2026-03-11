"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fileToAttachment, formatFileSize } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { Upload, X, File } from "lucide-react";
import type { FileAttachment } from "@/lib/types";

interface MultiFileUploadProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function MultiFileUpload({
  files,
  onFilesChange,
  accept,
  maxFiles,
}: MultiFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (rawFiles: globalThis.File[]) => {
      try {
        setError(null);
        const remaining = maxFiles ? maxFiles - files.length : rawFiles.length;
        if (remaining <= 0) {
          setError(`Maximum of ${maxFiles} files allowed.`);
          return;
        }
        const toProcess = rawFiles.slice(0, remaining);
        const attachments = await Promise.all(toProcess.map(fileToAttachment));
        onFilesChange([...files, ...attachments]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file(s).");
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      addFiles(Array.from(selected));
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length > 0) addFiles(Array.from(dropped));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const atLimit = maxFiles !== undefined && files.length >= maxFiles;

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2"
            >
              <File className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => removeFile(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!atLimit && (
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
              ? "border-ring bg-ring/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/40"
          )}
        >
          <Upload className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here, or click to browse
          </p>
          {maxFiles && (
            <p className="text-xs text-muted-foreground">
              {files.length} / {maxFiles} files
            </p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
