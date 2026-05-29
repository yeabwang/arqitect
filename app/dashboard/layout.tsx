import { redirect } from "next/navigation";
import getPrisma, { isPrismaTransientConnectionError } from "@/lib/prisma";
import { getCurrentProjectIdentity } from "@/lib/project-access";
import { normalizeCollaboratorEmail } from "@/lib/project-collaborators";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    redirect("/sign-in");
  }

  const prisma = await getPrisma();
  let invitationCount = 0;
  if (identity.primaryEmail) {
    try {
      invitationCount = await prisma.projectInvitation.count({
        where: {
          email: normalizeCollaboratorEmail(identity.primaryEmail),
          status: "PENDING",
        },
      });
    } catch (error) {
      if (!isPrismaTransientConnectionError(error)) {
        throw error;
      }
    }
  }

  const workspaceName =
    identity.displayName ||
    identity.primaryEmail?.split("@")[0] ||
    "Workspace";

  return (
    <DashboardShell
      invitationCount={invitationCount}
      workspaceName={workspaceName}
    >
      {children}
    </DashboardShell>
  );
}
