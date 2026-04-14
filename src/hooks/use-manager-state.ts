'use client';

import { useRef, useState, useCallback } from 'react';

interface ManagerState<TForm> {
  dialogOpen: boolean;
  editingId: string | null;
  form: TForm;
  isSaving: boolean;
  deleteDialogOpen: boolean;
  deletingId: string | null;
  usedInPrompts: string[];
  isDeleting: boolean;
  viewDialogOpen: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  openAdd: () => void;
  openEdit: (id: string, formData: TForm) => void;
  openDelete: (id: string, promptNames: string[]) => void;
  openView: () => void;
  closeDialog: () => void;
  closeDelete: () => void;
  closeView: () => void;
  setForm: React.Dispatch<React.SetStateAction<TForm>>;
  setIsSaving: (saving: boolean) => void;
  setIsDeleting: (deleting: boolean) => void;
  setDialogOpen: (open: boolean) => void;
  setViewDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function useManagerState<TForm>(emptyForm: TForm): ManagerState<TForm> {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usedInPrompts, setUsedInPrompts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, [emptyForm]);

  const openEdit = useCallback((id: string, formData: TForm) => {
    setEditingId(id);
    setForm(formData);
    setDialogOpen(true);
  }, []);

  const openDelete = useCallback((id: string, promptNames: string[]) => {
    setDeletingId(id);
    setUsedInPrompts(promptNames);
    setDeleteDialogOpen(true);
  }, []);

  const openView = useCallback(() => {
    setViewDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [emptyForm]);

  const closeDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setUsedInPrompts([]);
  }, []);

  const closeView = useCallback(() => {
    setViewDialogOpen(false);
  }, []);

  return {
    dialogOpen,
    editingId,
    form,
    isSaving,
    deleteDialogOpen,
    deletingId,
    usedInPrompts,
    isDeleting,
    viewDialogOpen,
    fileInputRef,
    openAdd,
    openEdit,
    openDelete,
    openView,
    closeDialog,
    closeDelete,
    closeView,
    setForm,
    setIsSaving,
    setIsDeleting,
    setDialogOpen,
    setViewDialogOpen,
    setDeleteDialogOpen,
  };
}
