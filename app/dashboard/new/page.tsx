import type { GenerationMode } from "@/types/onboarding";
import { OnboardingFlow } from "./onboarding-flow";

// Auth is enforced by app/dashboard/layout.tsx (redirects unauthenticated users).
interface NewDesignPageProps {
  searchParams: Promise<{ path?: string }>;
}

function resolvePath(path: string | undefined): GenerationMode | null {
  if (path === "blank" || path === "template" || path === "prompt") {
    return path;
  }
  return null;
}

export default async function NewDesignPage({
  searchParams,
}: NewDesignPageProps) {
  const { path } = await searchParams;
  return <OnboardingFlow initialPath={resolvePath(path)} />;
}
