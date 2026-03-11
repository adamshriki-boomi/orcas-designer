"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidFigmaUrl } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Link, Check, AlertCircle } from "lucide-react";

interface FigmaLinkInputProps {
  links: string[];
  onChange: (links: string[]) => void;
}

export function FigmaLinkInput({ links, onChange }: FigmaLinkInputProps) {
  const updateLink = (index: number, value: string) => {
    const next = [...links];
    next[index] = value;
    onChange(next);
  };

  const addLink = () => {
    onChange([...links, ""]);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {links.map((link, index) => {
        const hasValue = link.trim().length > 0;
        const valid = isValidFigmaUrl(link);

        return (
          <div key={index} className="flex items-center gap-2">
            <Link className="size-4 shrink-0 text-muted-foreground" />
            <div className="relative flex-1">
              <Input
                type="url"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                placeholder="https://www.figma.com/..."
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
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => removeLink(index)}
              aria-label="Remove link"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      })}

      <Button variant="ghost" size="sm" onClick={addLink} className="w-fit">
        <Plus className="size-3.5" />
        Add Figma Link
      </Button>
    </div>
  );
}
