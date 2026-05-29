"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  DashboardProvider,
  type DashboardContextValue,
} from "@/components/dashboard/dashboard-context";
import type { GenerationMode } from "@/types/onboarding";

interface DashboardShellProps {
  invitationCount: number;
  workspaceName: string;
  children: React.ReactNode;
}

export function DashboardShell({
  invitationCount,
  workspaceName,
  children,
}: DashboardShellProps) {
  const router = useRouter();

  const openCreateDesign = useCallback(
    (mode?: GenerationMode) => {
      router.push(mode ? `/dashboard/new?path=${mode}` : "/dashboard/new");
    },
    [router],
  );

  const ctx: DashboardContextValue = useMemo(
    () => ({ openCreateDesign, invitationCount }),
    [openCreateDesign, invitationCount],
  );

  return (
    <DashboardProvider value={ctx}>
      <div className="min-h-screen bg-bg-base text-text-primary">
        <DashboardSidebar />
        <div className="pl-56">
          <DashboardHeader workspaceName={workspaceName} />
          <main className="px-6 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
