"use client";

import { Button } from "@/components/ui/button";
import {
  PanelLeftOpen,
  PanelLeftClose,
  PanelRightOpen,
  PanelRightClose,
  LayoutTemplate,
  Share2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  onOpenStarterTemplates?: () => void;
  onShareProject?: () => void;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  onOpenStarterTemplates,
  onShareProject,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
}: EditorNavbarProps) {
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
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </div>
    </nav>
  );
}
