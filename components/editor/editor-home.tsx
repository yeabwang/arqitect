"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorHomeProps {
  onCreateProject: () => void;
}

export function EditorHome({ onCreateProject }: EditorHomeProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-lg font-medium text-foreground">
          Create a project or open an existing one
        </h1>
        <p className="max-w-sm text-sm text-text-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <Button onClick={onCreateProject}>
        <Plus />
        New Project
      </Button>
    </div>
  );
}
