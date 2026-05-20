import { currentUser } from "@clerk/nextjs/server";
import { LiveblocksError } from "@liveblocks/node";
import {
  getCurrentProjectIdentity,
  getProjectWithAccess,
} from "@/lib/project-access";
import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks";

export const runtime = "nodejs";

function getRequestedRoomId(body: unknown): string | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const data = body as Record<string, unknown>;
  const room = data.room ?? data.roomId;

  return typeof room === "string" && room.trim() ? room.trim() : null;
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity();

  if (!identity.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const projectId = getRequestedRoomId(body);

  if (!projectId) {
    return new Response("Room ID is required", { status: 400 });
  }

  const project = await getProjectWithAccess(projectId, identity);

  if (!project) {
    return new Response("Forbidden", { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    identity.primaryEmail ??
    "Collaborator";
  const avatarUrl = user?.imageUrl ?? "";
  const cursorColor = getCursorColor(identity.userId);
  const liveblocks = getLiveblocksClient();

  try {
    await liveblocks.getOrCreateRoom(project.id, {
      defaultAccesses: [],
      metadata: { projectId: project.id },
    });

    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        name,
        avatarUrl,
        color: cursorColor,
        cursorColor,
      },
    });

    session.allow(project.id, session.FULL_ACCESS);

    const { status, body: tokenBody } = await session.authorize();

    return new Response(tokenBody, { status });
  } catch (error) {
    if (error instanceof LiveblocksError) {
      return new Response(error.message, { status: error.status });
    }

    throw error;
  }
}
