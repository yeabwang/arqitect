import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "var(--presence-cyan)",
  "var(--presence-purple)",
  "var(--node-blue-text)",
  "var(--node-purple-text)",
  "var(--node-orange-text)",
  "var(--node-red-text)",
  "var(--node-green-text)",
  "var(--node-teal-text)",
] as const;

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocksClient?: Liveblocks;
};

export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocksClient) {
    return globalForLiveblocks.liveblocksClient;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is required");
  }

  const client = new Liveblocks({ secret });
  globalForLiveblocks.liveblocksClient = client;

  return client;
}

export function getCursorColor(userId: string): string {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}
