"use client";

import { Button } from "@/components/ui/button";
import {
  PanelLeftOpen,
  PanelLeftClose,
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
  onShareProject?: () => void;
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
  onShareProject,
  hideUserButton = false,
  saveStatus,
}: EditorNavbarProps) {
  const saveDisplay = saveStatus ? SAVE_STATUS_DISPLAY[saveStatus] : null;
  const SaveIcon = saveDisplay?.icon;
  return (
    <nav className="pointer-events-none fixed left-4 right-4 top-4 z-40 flex items-start justify-between gap-4">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-2xl border border-border-default bg-bg-elevated/90 p-1.5 shadow-2xl backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close projects" : "Open projects"}
          title={isSidebarOpen ? "Close projects" : "Open projects"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="h-5 w-px bg-border-default" />

        <div className="min-w-0 px-1.5">
          <p className="text-[10px] font-medium tracking-wide text-text-faint uppercase">
            Arqitect
          </p>
          {projectName ? (
            <h1 className="max-w-[44vw] truncate text-sm font-semibold text-text-primary md:max-w-[360px]">
              {projectName}
            </h1>
          ) : null}
        </div>

        {saveDisplay && SaveIcon ? (
          <>
            <div className="h-5 w-px bg-border-default" />
            <div
              className={`flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs ${saveDisplay.className}`}
              aria-live="polite"
              aria-label={`Canvas ${saveDisplay.label}`}
            >
              <SaveIcon
                className={`h-3.5 w-3.5 ${
                  saveStatus === "saving" ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">{saveDisplay.label}</span>
            </div>
          </>
        ) : null}
      </div>

      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border-default bg-bg-elevated/90 p-1.5 shadow-2xl backdrop-blur-md">
        {onShareProject ? (
          <Button
            variant="default"
            size="sm"
            onClick={onShareProject}
            aria-label="Share project"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        ) : null}
        {hideUserButton ? null : (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        )}
      </div>
    </nav>
  );
}
