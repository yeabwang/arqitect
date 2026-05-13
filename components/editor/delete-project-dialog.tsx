"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  projectName,
  isLoading,
  onClose,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            This action will permanently delete{" "}
            <span className="font-medium text-text-secondary">{projectName}</span>.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
