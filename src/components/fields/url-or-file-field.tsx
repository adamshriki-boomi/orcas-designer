"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UrlInput } from "./url-input";
import { FileUpload } from "./file-upload";
import { MultiFileUpload } from "./multi-file-upload";
import { AdditionalContext } from "./additional-context";
import type { FormFieldData, FieldType } from "@/lib/types";

interface UrlOrFileFieldProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
  label: string;
  urlPlaceholder?: string;
  acceptFiles?: string;
  multiFile?: boolean;
  showTextOption?: boolean;
}

export function UrlOrFileField({
  data,
  onChange,
  label,
  urlPlaceholder,
  acceptFiles,
  multiFile = false,
  showTextOption = false,
}: UrlOrFileFieldProps) {
  const update = (partial: Partial<FormFieldData>) => {
    onChange({ ...data, ...partial });
  };

  const handleTabChange = (value: string | number | null) => {
    if (value !== null) {
      update({ inputType: value as FieldType });
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <Tabs value={data.inputType} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
          {showTextOption && <TabsTrigger value="text">Text</TabsTrigger>}
        </TabsList>

        <TabsContent value="url">
          <UrlInput
            value={data.urlValue}
            onChange={(urlValue) => update({ urlValue })}
            placeholder={urlPlaceholder}
          />
        </TabsContent>

        <TabsContent value="file">
          {multiFile ? (
            <MultiFileUpload
              files={data.files}
              onFilesChange={(files) => update({ files })}
              accept={acceptFiles}
            />
          ) : (
            <FileUpload
              file={data.files[0] ?? null}
              onFileChange={(file) => update({ files: file ? [file] : [] })}
              accept={acceptFiles}
            />
          )}
        </TabsContent>

        {showTextOption && (
          <TabsContent value="text">
            <Textarea
              value={data.textValue}
              onChange={(e) => update({ textValue: e.target.value })}
              placeholder="Paste or type content here..."
              rows={5}
            />
          </TabsContent>
        )}
      </Tabs>

      <AdditionalContext
        value={data.additionalContext}
        onChange={(additionalContext) => update({ additionalContext })}
      />
    </div>
  );
}
