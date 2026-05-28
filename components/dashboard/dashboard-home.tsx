import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";
import {
  ContinueWorking,
  type ContinueWorkingProject,
} from "@/components/dashboard/continue-working";
import {
  DesignsSummary,
  type DesignsSummaryItem,
} from "@/components/dashboard/designs-summary";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyDashboard } from "@/components/dashboard/empty-dashboard";
import { GetStartedPanel } from "@/components/dashboard/get-started-panel";
import { PendingInvitationsStrip } from "@/components/dashboard/pending-invitations-strip";
import type { ProjectInvitation } from "@/lib/project-invitations";

interface DashboardHomeProps {
  greeting: string;
  totalDesigns: number;
  totalSpecs: number;
  totalAiRuns: number;
  totalCollaborators: number;
  continueWith: ContinueWorkingProject | null;
  designs: DesignsSummaryItem[];
  activity: ActivityItem[];
  invitations: ProjectInvitation[];
}

export function DashboardHome(props: DashboardHomeProps) {
  const {
    greeting,
    totalDesigns,
    totalSpecs,
    totalAiRuns,
    totalCollaborators,
    continueWith,
    designs,
    activity,
    invitations,
  } = props;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold text-text-primary">
            {greeting}
          </h1>
        </div>
        <p className="font-mono text-[11px] tracking-[0.14em] text-text-muted uppercase">
          {totalDesigns} design{totalDesigns === 1 ? "" : "s"} ·{" "}
          {totalCollaborators} collaborator
          {totalCollaborators === 1 ? "" : "s"} · {totalAiRuns} AI run
          {totalAiRuns === 1 ? "" : "s"}
        </p>
      </header>

      {invitations.length > 0 ? (
        <PendingInvitationsStrip initial={invitations} />
      ) : null}

      {continueWith ? (
        <ContinueWorking project={continueWith} />
      ) : (
        <EmptyDashboard />
      )}

      <QuickActions />

      {totalDesigns === 0 ? (
        <GetStartedPanel
          totalDesigns={totalDesigns}
          totalSpecs={totalSpecs}
          totalAiRuns={totalAiRuns}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DesignsSummary items={designs} />
        <ActivityFeed items={activity} />
      </section>
    </div>
  );
}
