"use client";

import { Button } from "@/components/ui/button";
import {
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  LayoutTemplate,
  Share2,
  Check,
  CircleAlert,
  Loader2,
  Save,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { CanvasSaveStatus } from "@/hooks/useCanvasAutosave";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  onOpenStarterTemplates?: () => void;
  onShareProject?: () => void;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  hideUserButton?: boolean;
  saveStatus?: CanvasSaveStatus;
}

interface SaveStatusDisplay {
  icon: typeof Save;
  label: string;
  className: string;
}

const SAVE_STATUS_DISPLAY: Record<CanvasSaveStatus, SaveStatusDisplay> = {
  idle: {
    icon: Save,
    label: "Save",
    className: "text-muted-foreground",
  },
  saving: {
    icon: Loader2,
    label: "Saving…",
    className: "text-muted-foreground",
  },
  saved: {
    icon: Check,
    label: "Saved",
    className: "text-foreground",
  },
  error: {
    icon: CircleAlert,
    label: "Save failed",
    className: "text-destructive",
  },
};

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  onOpenStarterTemplates,
  onShareProject,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  hideUserButton = false,
  saveStatus,
}: EditorNavbarProps) {
  const saveDisplay = saveStatus ? SAVE_STATUS_DISPLAY[saveStatus] : null;
  const SaveIcon = saveDisplay?.icon;
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center border-b border-border bg-background">
      <div className="flex items-center px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-3">
        {projectName ? (
          <h1 className="truncate text-sm font-medium text-foreground">
            {projectName}
          </h1>
        ) : null}
      </div>

      <div className="flex items-center gap-2 px-2">
        {saveDisplay && SaveIcon ? (
          <div
            className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-xs ${saveDisplay.className}`}
            aria-live="polite"
            aria-label={`Canvas ${saveDisplay.label}`}
          >
            <SaveIcon
              className={`h-3.5 w-3.5 ${
                saveStatus === "saving" ? "animate-spin" : ""
              }`}
            />
            <span>{saveDisplay.label}</span>
          </div>
        ) : null}
        {onOpenStarterTemplates ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenStarterTemplates}
            aria-label="Start from a template"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>
        ) : null}
        {onShareProject ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShareProject}
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        ) : null}
        {onToggleAiSidebar ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleAiSidebar}
            aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
          >
            {isAiSidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        ) : null}
        {hideUserButton ? null : (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
        )}
      </div>
    </nav>
  );
}
