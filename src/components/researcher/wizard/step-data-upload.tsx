"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fileToAttachment } from "@/lib/file-utils";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { ResearcherConfig } from "@/lib/researcher-types";

interface StepDataUploadProps {
  dataUpload: ResearcherConfig["dataUpload"];
  onChange: (data: ResearcherConfig["dataUpload"]) => void;
}

const ACCEPTED_TYPES = ".pdf,.docx,.csv,.txt,.md,.json,.xlsx";

export function StepDataUpload({ dataUpload, onChange }: StepDataUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles = [...dataUpload.files];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const attachment = await fileToAttachment(fileList[i]);
        newFiles.push(attachment);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to read file"
        );
      }
    }

    onChange({ ...dataUpload, files: newFiles });

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(fileId: string) {
    onChange({
      ...dataUpload,
      files: dataUpload.files.filter((f) => f.id !== fileId),
    });
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Data Upload
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload research data such as interview transcripts, survey results, or
          analytics exports. You can also paste text data directly.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Paste Text Data</Label>
          <Textarea
            placeholder="Paste interview transcripts, survey responses, or other text data..."
            value={dataUpload.textData}
            onChange={(e) =>
              onChange({ ...dataUpload, textData: e.target.value })
            }
            rows={6}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label>Upload Files</Label>
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload PDF, DOCX, CSV, TXT, or JSON files
            </p>
            <p className="text-xs text-muted-foreground">Max 10 MB per file</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {dataUpload.files.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Files ({dataUpload.files.length})</Label>
            <div className="grid gap-2">
              {dataUpload.files.map((file) => (
                <Card key={file.id} size="sm">
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFile(file.id)}
                      className="shrink-0"
                    >
                      <X className="size-4 text-muted-foreground" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
