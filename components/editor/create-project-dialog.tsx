"use client";

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

interface CreateProjectDialogProps {
  open: boolean;
  formName: string;
  roomIdPreview: string;
  isLoading: boolean;
  error?: string | null;
  onFormNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateProjectDialog({
  open,
  formName,
  roomIdPreview,
  isLoading,
  error,
  onFormNameChange,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Give your new architecture workspace a name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Input
            placeholder="Project name"
            value={formName}
            onChange={(e) => onFormNameChange(e.target.value)}
          />
          {roomIdPreview && (
            <p className="text-xs text-text-muted">
              Room ID: <span className="font-mono text-text-secondary">{roomIdPreview}</span>
            </p>
          )}
          {!roomIdPreview && formName && (
            <p className="text-xs text-text-muted">
              Room ID: <span className="font-mono text-text-faint">waiting for valid input&hellip;</span>
            </p>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !formName.trim() || !roomIdPreview}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
