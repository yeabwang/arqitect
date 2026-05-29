/**
 * Project name → room ID helpers. A room ID is a slug of the design name plus a
 * short random suffix so repeated names never collide. Kept in one place so the
 * dashboard shell and the start-design dialog derive IDs identically.
 */

export function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateRoomIdSuffix(): string {
  return crypto.randomUUID().slice(0, 6);
}

export function buildRoomId(name: string, suffix: string): string {
  const base = slugifyProjectName(name);
  if (!base) {
    return "";
  }
  return suffix ? `${base}-${suffix}` : base;
}
