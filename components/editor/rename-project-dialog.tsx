"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RenameProjectDialogProps {
  open: boolean;
  currentName: string;
  formName: string;
  isLoading: boolean;
  onFormNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  open,
  currentName,
  formName,
  isLoading,
  onFormNameChange,
  onClose,
  onSubmit,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && formName.trim()) {
        e.preventDefault();
        onSubmit();
      }
    },
    [formName, onSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Current name: <span className="font-medium text-text-secondary">{currentName}</span>
          </DialogDescription>
        </DialogHeader>

        <Input
          ref={inputRef}
          placeholder="Project name"
          value={formName}
          onChange={(e) => onFormNameChange(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !formName.trim()}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
