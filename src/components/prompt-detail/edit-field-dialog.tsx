'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UrlOrFileField } from '@/components/fields/url-or-file-field';
import type { FormFieldData } from '@/lib/types';

interface EditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldKey: string;
  label: string;
  data: FormFieldData;
  onSave: (data: FormFieldData) => void;
}

export function EditFieldDialog({
  open,
  onOpenChange,
  fieldKey,
  label,
  data,
  onSave,
}: EditFieldDialogProps) {
  const [draft, setDraft] = useState<FormFieldData>(data);

  useEffect(() => {
    if (open) {
      setDraft(data);
    }
  }, [open, data]);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const showTextOption = ['companyInfo', 'productInfo', 'featureInfo'].includes(fieldKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
          <DialogDescription>
            Update the {label.toLowerCase()} for this prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <UrlOrFileField
            data={draft}
            onChange={setDraft}
            label={label}
            showTextOption={showTextOption}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
