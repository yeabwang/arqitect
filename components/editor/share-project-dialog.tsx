"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Mail, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CollaboratorProfile {
  id: string;
  email: string;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface InvitationProfile {
  id: string;
  email: string;
  invitedById: string;
  inviterName: string | null;
  inviterAvatarUrl: string | null;
  status: "PENDING" | "DENIED";
  createdAt: string;
}

interface CollaboratorResponse {
  canManage: boolean;
  collaborators: CollaboratorProfile[];
  invitations: InvitationProfile[];
}

interface ShareProjectDialogProps {
  open: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function ShareProjectDialog({
  open,
  projectId,
  projectName,
  onClose,
}: ShareProjectDialogProps) {
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [invitations, setInvitations] = useState<InvitationProfile[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/editor/${projectId}`;
    }

    return `${window.location.origin}/editor/${projectId}`;
  }, [projectId]);

  function handleClose() {
    setEmail("");
    setError(null);
    setCopied(false);
    onClose();
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadCollaborators() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/projects/${projectId}/collaborators`);
        if (!res.ok) {
          throw new Error("Failed to load collaborators");
        }

        const data = (await res.json()) as CollaboratorResponse;
        if (!cancelled) {
          setCollaborators(data.collaborators);
          setInvitations(data.invitations);
          setCanManage(data.canManage);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load sharing settings.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCollaborators();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to invite collaborator");
      }

      const data = (await res.json()) as CollaboratorResponse;
      setCollaborators(data.collaborators);
      setInvitations(data.invitations);
      setCanManage(data.canManage);
      setEmail("");
    } catch {
      setError("Failed to invite collaborator. Check the email and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(collaboratorId: string) {
    setRemovingId(collaboratorId);
    setError(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to remove collaborator");
      }

      setCollaborators((prev) =>
        prev.filter((collaborator) => collaborator.id !== collaboratorId)
      );
    } catch {
      setError("Failed to remove collaborator. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Failed to copy the project link.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            Manage who can open {projectName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={projectUrl} readOnly aria-label="Project link" />
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          {canManage ? (
            <form className="flex gap-2" onSubmit={handleInvite}>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="collaborator@example.com"
                aria-label="Collaborator email"
              />
              <Button type="submit" disabled={isSubmitting || !email.trim()}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Mail />}
                Invite
              </Button>
            </form>
          ) : (
            <p className="rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              You can view collaborators, but only the owner can manage access.
            </p>
          )}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              Collaborators
            </h3>

            <div className="max-h-72 space-y-2 overflow-auto">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading collaborators
                </div>
              ) : collaborators.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
                  No collaborators yet
                </div>
              ) : (
                collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-muted-foreground">
                      {collaborator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={collaborator.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {collaborator.displayName ?? collaborator.email}
                      </p>
                      {collaborator.displayName ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {collaborator.email}
                        </p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(collaborator.id)}
                        disabled={removingId === collaborator.id}
                        aria-label={`Remove ${collaborator.email}`}
                      >
                        {removingId === collaborator.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
                        )}
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {canManage ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Invitations
              </h3>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading invitations
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
                    No pending invitations
                  </div>
                ) : (
                  invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invitation.status === "DENIED"
                            ? "Invitation denied"
                            : "Invitation pending"}
                        </p>
                      </div>
                      <span
                        className={
                          invitation.status === "DENIED"
                            ? "rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive"
                            : "rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                        }
                      >
                        {invitation.status === "DENIED" ? "Denied" : "Pending"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
