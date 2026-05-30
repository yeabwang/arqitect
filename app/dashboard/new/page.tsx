import type { GenerationMode } from "@/types/onboarding";
import { getDisplayIdentity } from "@/lib/project-access";
import { pickOnboardingGreeting } from "@/lib/onboarding-greetings";
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
  // Resolve identity server-side from the session token so the greeting renders
  // fully formed on first paint — no client fetch, no name pop-in, no hydration
  // hack. Uses session claims (no backend round-trip when claims are configured).
  const identity = await getDisplayIdentity();
  return (
    <OnboardingFlow
      initialPath={resolvePath(path)}
      userName={identity.displayName}
      userImageUrl={identity.avatarUrl}
      greeting={pickOnboardingGreeting()}
    />
  );
}
