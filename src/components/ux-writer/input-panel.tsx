'use client';

import { useState } from 'react';
import { Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { HistoryList } from './history-list';
import type { AnalysisEntry } from '@/hooks/use-ux-writer';

interface InputPanelProps {
  onAnalyze: (params: {
    screenshotUrl: string | null;
    description: string;
    focusNotes: string | null;
    includeAiVoice: boolean;
  }) => void;
  analyzing: boolean;
  history: AnalysisEntry[];
  onHistorySelect: (entry: AnalysisEntry) => void;
  onHistoryDelete: (id: string) => void;
  onScreenshotUpload: (file: File) => Promise<string>;
}

export function InputPanel({
  onAnalyze, analyzing, history, onHistorySelect, onHistoryDelete, onScreenshotUpload,
}: InputPanelProps) {
  const [description, setDescription] = useState('');
  const [focusNotes, setFocusNotes] = useState('');
  const [includeAiVoice, setIncludeAiVoice] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onScreenshotUpload(file);
      setScreenshotUrl(url);
      setScreenshotName(file.name);
    } catch {
      // Error handled by parent
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    onAnalyze({
      screenshotUrl,
      description: description.trim(),
      focusNotes: focusNotes.trim() || null,
      includeAiVoice,
    });
  }

  function handleHistorySelect(entry: AnalysisEntry) {
    setDescription(entry.description);
    setFocusNotes(entry.focusNotes ?? '');
    setScreenshotUrl(entry.screenshotUrl);
    setScreenshotName(entry.screenshotUrl ? 'Previous screenshot' : null);
    onHistorySelect(entry);
  }

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Screenshot upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Screenshot (optional)</label>
          {screenshotUrl ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30">
              <Upload className="size-4 text-muted-foreground" />
              <span className="text-xs flex-1 truncate">{screenshotName}</span>
              <button
                type="button"
                onClick={() => { setScreenshotUrl(null); setScreenshotName(null); }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-3 py-6 rounded-md border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Upload className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {uploading ? 'Uploading...' : 'Drop an image or click to upload'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="ux-description">
            Description *
          </label>
          <Textarea
            id="ux-description"
            rows={3}
            placeholder="e.g., Login dialog with error states for invalid credentials"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Focus notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="ux-focus">
            Focus on (optional)
          </label>
          <Input
            id="ux-focus"
            type="text"
            placeholder="e.g., error messages, button labels, tooltips"
            value={focusNotes}
            onChange={(e) => setFocusNotes(e.target.value)}
          />
        </div>

        {/* AI Voice toggle — uses ExToggle via Switch wrapper */}
        <label className="flex items-center justify-between py-1 cursor-pointer">
          <div>
            <p className="text-xs font-medium">Include AI Voice guidelines</p>
            <p className="text-[10px] text-muted-foreground">For AI features (chatbot, assistant text)</p>
          </div>
          <Switch
            checked={includeAiVoice}
            onCheckedChange={setIncludeAiVoice}
            size="sm"
          />
        </label>

        {/* Analyze button */}
        <Button type="submit" className="w-full" disabled={!description.trim() || analyzing}>
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </Button>
      </form>

      {/* History */}
      <div className="mt-6 border-t border-border pt-4">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground cursor-pointer"
        >
          <span>History ({history.length})</span>
          {historyOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {historyOpen && (
          <div className="mt-2 max-h-60 overflow-y-auto">
            <HistoryList
              entries={history}
              onSelect={handleHistorySelect}
              onDelete={onHistoryDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
