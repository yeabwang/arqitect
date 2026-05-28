import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import getPrisma from "@/lib/prisma";
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
  const invitationCount = identity.primaryEmail
    ? await prisma.projectInvitation.count({
        where: {
          email: normalizeCollaboratorEmail(identity.primaryEmail),
          status: "PENDING",
        },
      })
    : 0;

  const user = await currentUser();
  const workspaceName =
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
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
