"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { buildRoomId, generateRoomIdSuffix } from "@/lib/project-slug";
import { cn } from "@/lib/utils";
import {
  type GenerationMode,
  type PendingGenerationPayload,
} from "@/types/onboarding";
import { OnboardingHub } from "./onboarding-hub";
import { PathBlank } from "./path-blank";
import { PathPrompt, type PromptPhase } from "./path-prompt";
import { PathTemplate } from "./path-template";

interface OnboardingFlowProps {
  initialPath: GenerationMode | null;
  /** Resolved server-side so the prompt greeting renders without a client fetch. */
  userName: string | null;
  userImageUrl: string | null;
  greeting: string;
}

export function OnboardingFlow({
  initialPath,
  userName,
  userImageUrl,
  greeting,
}: OnboardingFlowProps) {
  const router = useRouter();

  const [path, setPath] = useState<GenerationMode | null>(initialPath);
  const [name, setName] = useState("");
  const [suffix] = useState(() => generateRoomIdSuffix());
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [promptPhase, setPromptPhase] = useState<PromptPhase>("name");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdProjectIdRef = useRef<string | null>(null);

  const roomId = useMemo(() => buildRoomId(name, suffix), [name, suffix]);
  const nameValid = name.trim().length > 0 && roomId.length > 0;
  const isPrompt = path === "prompt";
  const isTemplate = path === "template";
  // Every path renders its own full-height surface once chosen; only the hub
  // (path === null) lets the page scroll.
  const isFullScreen = path !== null;

  const choosePath = useCallback(
    (next: GenerationMode) => {
      setPath(next);
      setPromptPhase("name");
      setError(null);
      window.history.replaceState(null, "", `/dashboard/new?path=${next}`);
    },
    [],
  );

  const backToHub = useCallback(() => {
    setPath(null);
    setPromptPhase("name");
    setError(null);
    window.history.replaceState(null, "", "/dashboard/new");
  }, []);

  const close = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Single create + navigate helper, ported from the old start-design dialog.
  // Does not clear isLoading on success — navigation is in flight.
  const createDesign = useCallback(
    async (
      payload: PendingGenerationPayload | null,
      destination: (projectId: string) => string,
    ) => {
      if (!nameValid || isLoading) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let projectId = createdProjectIdRef.current;
        if (!projectId) {
          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), id: roomId }),
          });
          if (!res.ok) {
            throw new Error("create-project");
          }
          const project = (await res.json()) as { id: string };
          projectId = project.id;
          createdProjectIdRef.current = projectId;
        }

        if (payload) {
          const res = await fetch(
            `/api/projects/${projectId}/pending-generation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload }),
            },
          );
          if (!res.ok) {
            throw new Error("pending-generation");
          }
        }

        router.push(destination(projectId));
      } catch {
        setIsLoading(false);
        setError("Couldn't create your design. Please try again.");
      }
    },
    [isLoading, name, nameValid, roomId, router],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-bg-base",
        isFullScreen ? "overflow-hidden" : "overflow-y-auto",
      )}
    >
      <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
        </div>
        <button
          type="button"
          onClick={path !== null ? backToHub : close}
          aria-label={path !== null ? "Back to start options" : "Close"}
          disabled={isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {path === null ? (
        <OnboardingHub onChoose={choosePath} />
      ) : isPrompt ? (
        <PathPrompt
          name={name}
          nameValid={nameValid}
          isLoading={isLoading}
          createError={error}
          userName={userName}
          userImageUrl={userImageUrl}
          greeting={greeting}
          phase={promptPhase}
          onPhaseChange={setPromptPhase}
          onNameChange={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          onSubmit={(payload) =>
            void createDesign(payload, (id) => `/editor/${id}?start=ai`)
          }
        />
      ) : isTemplate ? (
        <PathTemplate
          name={name}
          roomId={roomId}
          nameValid={nameValid}
          selectedId={templateId}
          isLoading={isLoading}
          createError={error}
          onNameChange={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          onSelect={(id) => {
            setTemplateId(id);
            if (error) setError(null);
          }}
          onCreate={() =>
            void createDesign(
              null,
              (id) => `/editor/${id}?start=template&template=${templateId}`,
            )
          }
        />
      ) : (
        <PathBlank
          name={name}
          roomId={roomId}
          nameValid={nameValid}
          isLoading={isLoading}
          createError={error}
          onNameChange={(value) => {
            setName(value);
            if (error) setError(null);
          }}
          onCreate={() => void createDesign(null, (id) => `/editor/${id}`)}
        />
      )}
    </div>
  );
}

