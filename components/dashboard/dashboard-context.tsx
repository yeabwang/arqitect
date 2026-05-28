"use client";

import { createContext, useContext } from "react";

export type StartDesignMode = "blank" | "template" | "ai";

export interface DashboardContextValue {
  openCreateDesign: (mode?: StartDesignMode) => void;
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
