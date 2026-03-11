"use client";

import { Input } from "@/components/ui/input";
import { isValidUrl } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UrlInput({ value, onChange, placeholder = "https://..." }: UrlInputProps) {
  const hasValue = value.trim().length > 0;
  const valid = isValidUrl(value);

  return (
    <div className="relative">
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-8"
      />
      {hasValue && (
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          {valid ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <AlertCircle className="size-4 text-destructive" />
          )}
        </div>
      )}
    </div>
  );
}
