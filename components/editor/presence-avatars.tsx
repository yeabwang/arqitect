"use client";

import { useMemo } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";
import { shallow } from "@liveblocks/react";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_AVATARS = 5;
const AVATAR_SIZE_CLASS = "h-7 w-7";

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) {
    return "?";
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

interface CollaboratorAvatarProps {
  name: string;
  avatarUrl: string;
  color: string;
}

function CollaboratorAvatar({ name, avatarUrl, color }: CollaboratorAvatarProps) {
  const initials = getInitials(name);
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full ring-2 ring-background select-none",
        AVATAR_SIZE_CLASS
      )}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="text-[10px] font-semibold leading-none text-white">
          {initials}
        </span>
      )}
    </div>
  );
}

export function PresenceAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;

  const others = useOthers(
    (connections) =>
      connections.map((other) => ({
        connectionId: other.connectionId,
        id: other.id ?? "",
        name: other.info?.name ?? "Collaborator",
        avatarUrl: other.info?.avatarUrl ?? "",
        color: other.info?.color ?? "#475569",
      })),
    shallow
  );

  const collaborators = useMemo(
    () => others.filter((other) => other.id && other.id !== currentUserId),
    [others, currentUserId]
  );

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div
      className="pointer-events-auto absolute top-3 right-3 z-30 flex items-center gap-2 rounded-full border border-border bg-card/80 px-2 py-1 shadow-md backdrop-blur-md"
      aria-label="Room participants"
    >
      {hasCollaborators ? (
        <div className="flex items-center -space-x-2">
          {visible.map((other) => (
            <CollaboratorAvatar
              key={other.connectionId}
              name={other.name}
              avatarUrl={other.avatarUrl}
              color={other.color}
            />
          ))}
          {overflow > 0 ? (
            <div
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-bg-elevated text-[10px] font-semibold text-foreground ring-2 ring-background",
                AVATAR_SIZE_CLASS
              )}
              title={`${overflow} more`}
              aria-label={`${overflow} more collaborators`}
            >
              +{overflow}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasCollaborators ? (
        <span aria-hidden className="h-5 w-px bg-border" />
      ) : null}

      <UserButton
        appearance={{
          elements: {
            avatarBox: AVATAR_SIZE_CLASS,
          },
        }}
      />
    </div>
  );
}
