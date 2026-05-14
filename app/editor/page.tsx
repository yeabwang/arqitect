import { auth } from "@clerk/nextjs/server";
import getPrisma from "@/lib/prisma";
import { EditorPageClient } from "@/components/editor/editor-page-client";

export default async function EditorPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const prisma = await getPrisma();
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <EditorPageClient
      initialProjects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        isOwner: true,
      }))}
    />
  );
}
