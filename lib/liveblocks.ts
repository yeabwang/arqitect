import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#00c8d4",
  "#8b82ff",
  "#52a8ff",
  "#bf7af0",
  "#ff990a",
  "#ff6166",
  "#62c073",
  "#0ac7b4",
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
