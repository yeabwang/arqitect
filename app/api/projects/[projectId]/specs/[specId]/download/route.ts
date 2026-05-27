import { type NextRequest } from "next/server";
import { get } from "@vercel/blob";
import getPrisma from "@/lib/prisma";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]/download">,
) {
  const identity = await getCurrentProjectIdentity();
  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId, specId } = await ctx.params;

  const project = await getProjectWithAccess(projectId, identity);
  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const prisma = await getPrisma();
  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
  });

  if (!spec || spec.projectId !== projectId) {
    return new Response("Not Found", { status: 404 });
  }

  if (!spec.filePath) {
    return new Response("Spec content unavailable", { status: 404 });
  }

  let stream: ReadableStream<Uint8Array>;
  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });
    if (!blob) {
      return new Response("Spec content unavailable", { status: 404 });
    }
    if (blob.statusCode !== 200 || !blob.stream) {
      console.error("[spec-download] unexpected blob response", {
        specId,
        statusCode: blob.statusCode,
      });
      return new Response("Failed to load spec", { status: 502 });
    }
    stream = blob.stream;
  } catch (err) {
    console.error("[spec-download] blob get failed", {
      specId,
      filePath: spec.filePath,
      error: (err as Error).message,
    });
    return new Response("Failed to load spec", { status: 502 });
  }

  const filename = `${specId}.md`;

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
