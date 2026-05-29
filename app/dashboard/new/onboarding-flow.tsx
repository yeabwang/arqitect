"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { buildRoomId, generateRoomIdSuffix } from "@/lib/project-slug";
import {
  type GenerationMode,
  type PendingGenerationPayload,
} from "@/types/onboarding";
import { OnboardingHub } from "./onboarding-hub";
import { OnboardingStepper, type StepperStep } from "./onboarding-stepper";
import { PathBlank } from "./path-blank";
import { PathPrompt, type PromptPhase } from "./path-prompt";
import { PathTemplate } from "./path-template";

interface OnboardingFlowProps {
  initialPath: GenerationMode | null;
}

const PATH_COPY: Record<
  GenerationMode,
  { title: string; subtitle: string }
> = {
  blank: {
    title: "Start from a blank canvas",
    subtitle: "Name your design and open an empty system canvas.",
  },
  template: {
    title: "Start from a proven pattern",
    subtitle: "Name your design, then adapt an architecture that already works.",
  },
  prompt: {
    title: "Describe your system",
    subtitle:
      "Tell Arqitect what you're building. It drafts the first architecture — and the spec you'll hand off from it.",
  },
};

export function OnboardingFlow({ initialPath }: OnboardingFlowProps) {
  const router = useRouter();

  const [path, setPath] = useState<GenerationMode | null>(initialPath);
  const [name, setName] = useState("");
  const [suffix] = useState(() => generateRoomIdSuffix());
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateStep, setTemplateStep] = useState<1 | 2>(1);
  const [promptPhase, setPromptPhase] = useState<PromptPhase>("name");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdProjectIdRef = useRef<string | null>(null);

  const roomId = useMemo(() => buildRoomId(name, suffix), [name, suffix]);
  const nameValid = name.trim().length > 0 && roomId.length > 0;

  const choosePath = useCallback(
    (next: GenerationMode) => {
      setPath(next);
      setTemplateStep(1);
      setPromptPhase("name");
      setError(null);
      window.history.replaceState(null, "", `/dashboard/new?path=${next}`);
    },
    [],
  );

  const backToHub = useCallback(() => {
    setPath(null);
    setTemplateStep(1);
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg-base">
      <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" />
          {path !== null ? (
            <>
              <span aria-hidden className="h-4 w-px bg-border-default" />
              <button
                type="button"
                onClick={backToHub}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                All start options
              </button>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          disabled={isLoading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition-colors hover:border-border-hover hover:text-text-primary disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {path === null ? (
        <OnboardingHub onChoose={choosePath} />
      ) : (
        <div className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_240px]">
          <div className="flex flex-col gap-6">
            {path === "template" ? (
              <PathTemplate
                name={name}
                roomId={roomId}
                nameValid={nameValid}
                step={templateStep}
                selectedId={templateId}
                isLoading={isLoading}
                onNameChange={(value) => {
                  setName(value);
                  if (error) setError(null);
                }}
                onStepChange={setTemplateStep}
                onSelect={(id) => {
                  setTemplateId(id);
                  if (error) setError(null);
                }}
                onCreate={() =>
                  void createDesign(
                    null,
                    (id) =>
                      `/editor/${id}?start=template&template=${templateId}`,
                  )
                }
              />
            ) : path === "prompt" ? (
              <PathPrompt
                name={name}
                roomId={roomId}
                nameValid={nameValid}
                isLoading={isLoading}
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
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                    {PATH_COPY.blank.title}
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {PATH_COPY.blank.subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="design-name"
                    className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase"
                  >
                    Design name
                  </label>
                  <Input
                    id="design-name"
                    autoFocus
                    placeholder="e.g. Billing service"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && nameValid && !isLoading) {
                        event.preventDefault();
                        void createDesign(null, (id) => `/editor/${id}`);
                      }
                    }}
                  />
                  {roomId ? (
                    <p className="text-xs text-text-muted">
                      Room ID:{" "}
                      <span className="font-mono text-text-secondary">
                        {roomId}
                      </span>
                    </p>
                  ) : null}
                </div>

                <PathBlank
                  nameValid={nameValid}
                  isLoading={isLoading}
                  onCreate={() =>
                    void createDesign(null, (id) => `/editor/${id}`)
                  }
                />
              </>
            )}

            {error ? (
              <p className="text-xs text-state-error">{error}</p>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <OnboardingStepper
              steps={
                path === "template"
                  ? templateSteps(templateId !== null, templateStep)
                  : path === "prompt"
                    ? promptSteps(promptPhase)
                    : blankSteps(nameValid)
              }
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function promptSteps(phase: PromptPhase): StepperStep[] {
  const order: PromptPhase[] = ["name", "describe", "chat", "summary"];
  const current = order.indexOf(phase);
  const stepState = (index: number): StepperStep["state"] =>
    index < current ? "done" : index === current ? "active" : "upcoming";
  return [
    {
      id: "name",
      title: "Name it",
      subtitle: "Give the design a name",
      state: stepState(0),
    },
    {
      id: "describe",
      title: "Describe",
      subtitle: "What you're building",
      state: stepState(1),
    },
    {
      id: "clarify",
      title: "Clarify",
      subtitle: "A few sharp questions",
      state: stepState(2),
    },
    {
      id: "review",
      title: "Review brief",
      subtitle: "Approve and open canvas",
      state: stepState(3),
    },
  ];
}

function blankSteps(nameValid: boolean): StepperStep[] {
  return [
    {
      id: "name",
      title: "Name your design",
      subtitle: "Give it a short, clear name",
      state: nameValid ? "done" : "active",
    },
    {
      id: "canvas",
      title: "Open canvas",
      subtitle: "Start building",
      state: "upcoming",
    },
  ];
}

function templateSteps(picked: boolean, step: 1 | 2): StepperStep[] {
  return [
    {
      id: "name",
      title: "Name your design",
      subtitle: "Give it a short, clear name",
      state: step === 1 ? "active" : "done",
    },
    {
      id: "pick",
      title: "Choose a template",
      subtitle: "Start from a known pattern",
      state: step === 2 ? (picked ? "done" : "active") : "upcoming",
    },
    {
      id: "canvas",
      title: "Open canvas",
      subtitle: "Adjust and build",
      state: "upcoming",
    },
  ];
}
