"use client";

import { createContext, useContext } from "react";
import type { GenerationMode } from "@/types/onboarding";

export interface DashboardContextValue {
  /** Navigate to the full-screen /dashboard/new onboarding, optionally preselecting a path. */
  openCreateDesign: (mode?: GenerationMode) => void;
  invitationCount: number;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }
  return ctx;
}
