import { clerkClient } from "@clerk/nextjs/server";
import getPrisma, { isPrismaTransientConnectionError } from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  type ProjectAccessIdentity,
} from "@/lib/project-access";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborators";
import { fetchUserInvitations } from "@/lib/project-invitations";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { DashboardLoadError } from "@/components/dashboard/dashboard-load-error";
import type { ContinueWorkingProject } from "@/components/dashboard/continue-working";
import type { DesignsSummaryItem } from "@/components/dashboard/designs-summary";
import type { ActivityItem } from "@/components/dashboard/activity-feed";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const ACTIVITY_LIMIT = 12;

function fourteenDaysAgo(): Date {
  return new Date(Date.now() - FOURTEEN_DAYS_MS);
}

export default async function DashboardHomePage() {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) return null;

  try {
    return await renderDashboardHome(identity);
  } catch (error) {
    if (isPrismaTransientConnectionError(error)) {
      return <DashboardLoadError />;
    }
    throw error;
  }
}

async function renderDashboardHome(identity: ProjectAccessIdentity) {
  if (!identity.userId) return null;

  const prisma = await getPrisma();
  const userId = identity.userId;
  const normalizedEmail = identity.primaryEmail
    ? normalizeCollaboratorEmail(identity.primaryEmail)
    : null;

  const sharedFilter = normalizedEmail
    ? [{ collaborators: { some: { email: normalizedEmail } } }]
    : [];

  const accessibleProjects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, ...sharedFilter] },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      ownerId: true,
      updatedAt: true,
      _count: { select: { collaborators: true } },
    },
  });

  const accessibleIds = accessibleProjects.map((p) => p.id);

  const since = fourteenDaysAgo();

  const [
    totalSpecs,
    totalAiRuns,
    collaboratorRows,
    recentSpecs,
    recentRuns,
    recentCollaborators,
  ] = await Promise.all([
    accessibleIds.length
      ? prisma.projectSpec.count({
          where: { projectId: { in: accessibleIds } },
        })
      : Promise.resolve(0),
    prisma.taskRun.count({ where: { userId } }),
    accessibleIds.length
      ? prisma.projectCollaborator.findMany({
          where: { projectId: { in: accessibleIds } },
          select: { email: true },
        })
      : Promise.resolve([] as { email: string }[]),
    accessibleIds.length
      ? prisma.projectSpec.findMany({
          where: { projectId: { in: accessibleIds }, createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: ACTIVITY_LIMIT,
          select: { id: true, projectId: true, createdAt: true },
        })
      : Promise.resolve(
          [] as { id: string; projectId: string; createdAt: Date }[]
        ),
    accessibleIds.length
      ? prisma.taskRun.findMany({
          where: {
            userId,
            projectId: { in: accessibleIds },
            createdAt: { gte: since },
          },
          orderBy: { createdAt: "desc" },
          take: ACTIVITY_LIMIT,
          select: { id: true, projectId: true, createdAt: true },
        })
      : Promise.resolve(
          [] as { id: string; projectId: string; createdAt: Date }[]
        ),
    accessibleIds.length
      ? prisma.projectCollaborator.findMany({
          where: {
            projectId: { in: accessibleIds },
            createdAt: { gte: since },
          },
          orderBy: { createdAt: "desc" },
          take: ACTIVITY_LIMIT,
          select: {
            id: true,
            projectId: true,
            email: true,
            createdAt: true,
          },
        })
      : Promise.resolve(
          [] as {
            id: string;
            projectId: string;
            email: string;
            createdAt: Date;
          }[]
        ),
  ]);

  const totalCollaborators = new Set(
    collaboratorRows
      .map((c) => c.email.toLowerCase())
      .filter((e) => e !== normalizedEmail)
  ).size;

  const projectsById = new Map(
    accessibleProjects.map((p) => [p.id, p] as const)
  );

  const activity: ActivityItem[] = [];
  for (const project of accessibleProjects) {
    if (project.updatedAt >= since) {
      activity.push({
        id: `edit:${project.id}:${project.updatedAt.getTime()}`,
        kind: "edit",
        projectId: project.id,
        projectName: project.name,
        whenISO: project.updatedAt.toISOString(),
      });
    }
  }
  for (const spec of recentSpecs) {
    const p = projectsById.get(spec.projectId);
    if (!p) continue;
    activity.push({
      id: `spec:${spec.id}`,
      kind: "spec",
      projectId: spec.projectId,
      projectName: p.name,
      whenISO: spec.createdAt.toISOString(),
      detail: `${spec.id}.md`,
    });
  }
  for (const run of recentRuns) {
    const p = projectsById.get(run.projectId);
    if (!p) continue;
    activity.push({
      id: `ai:${run.id}`,
      kind: "ai",
      projectId: run.projectId,
      projectName: p.name,
      whenISO: run.createdAt.toISOString(),
    });
  }
  for (const c of recentCollaborators) {
    const p = projectsById.get(c.projectId);
    if (!p) continue;
    activity.push({
      id: `collab:${c.id}`,
      kind: "collaborator",
      projectId: c.projectId,
      projectName: p.name,
      whenISO: c.createdAt.toISOString(),
      detail: c.email,
    });
  }
  activity.sort((a, b) => b.whenISO.localeCompare(a.whenISO));
  const activityLimited = activity.slice(0, ACTIVITY_LIMIT);

  const designs: DesignsSummaryItem[] = accessibleProjects.slice(0, 5).map(
    (p) => ({
      id: p.id,
      name: p.name,
      updatedAtISO: p.updatedAt.toISOString(),
      isOwner: p.ownerId === userId,
      collaboratorCount: p._count.collaborators,
    })
  );

  let continueWith: ContinueWorkingProject | null = null;
  const latest = accessibleProjects[0];
  if (latest) {
    let ownerName: string | null = null;
    if (latest.ownerId !== userId) {
      try {
        const client = await clerkClient();
        const owner = await client.users.getUser(latest.ownerId);
        ownerName =
          owner.firstName ||
          owner.username ||
          owner.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          null;
      } catch {
        ownerName = null;
      }
    }
    continueWith = {
      id: latest.id,
      name: latest.name,
      updatedAtISO: latest.updatedAt.toISOString(),
      isOwner: latest.ownerId === userId,
      collaboratorCount: latest._count.collaborators,
      ownerName,
    };
  }

  const invitations = await fetchUserInvitations(identity.primaryEmail);

  const greeting = identity.displayName
    ? `Welcome back, ${identity.displayName}.`
    : "Welcome back.";

  return (
    <DashboardHome
      greeting={greeting}
      totalDesigns={accessibleProjects.length}
      totalSpecs={totalSpecs}
      totalAiRuns={totalAiRuns}
      totalCollaborators={totalCollaborators}
      continueWith={continueWith}
      designs={designs}
      activity={activityLimited}
      invitations={invitations}
    />
  );
}
