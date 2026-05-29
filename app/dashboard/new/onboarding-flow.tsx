"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { buildRoomId, generateRoomIdSuffix } from "@/lib/project-slug";
import {
  INTERVIEW_FIELDS,
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
  deriveOpenQuestions,
  emptyInterviewAnswers,
  type GenerationMode,
  type InterviewAnswers,
  type PendingGenerationPayload,
} from "@/types/onboarding";
import { OnboardingHub } from "./onboarding-hub";
import { OnboardingStepper, type StepperStep } from "./onboarding-stepper";
import { PathBlank } from "./path-blank";
import { PathPrompt, type PromptStyle } from "./path-prompt";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdProjectIdRef = useRef<string | null>(null);

  const [answers, setAnswers] = useState<InterviewAnswers>(
    emptyInterviewAnswers,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [promptStyle, setPromptStyle] = useState<PromptStyle>("interview");
  const [freePrompt, setFreePrompt] = useState("");

  const roomId = useMemo(() => buildRoomId(name, suffix), [name, suffix]);
  const nameValid = name.trim().length > 0 && roomId.length > 0;

  const goalAnswered = answers.systemGoal.trim().length > 0;

  const choosePath = useCallback(
    (next: GenerationMode) => {
      setPath(next);
      setTemplateStep(1);
      setError(null);
      window.history.replaceState(null, "", `/dashboard/new?path=${next}`);
    },
    [],
  );

  const backToHub = useCallback(() => {
    setPath(null);
    setTemplateStep(1);
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

  const submitPrompt = useCallback(() => {
    if (promptStyle === "free-form") {
      const trimmed = freePrompt.trim();
      if (trimmed.length === 0) {
        setError("Add a prompt, or switch back to the guided questions.");
        return;
      }
      const payload: PendingGenerationPayload = {
        kind: "free-form",
        prompt: trimmed,
        openQuestions: INTERVIEW_FIELDS.filter(
          (field) => !INTERVIEW_FIELD_META[field].required,
        ).map((field) => INTERVIEW_FIELD_META[field].openQuestion),
      };
      void createDesign(payload, (id) => `/editor/${id}?start=ai`);
      return;
    }

    if (answers.systemGoal.trim().length === 0) {
      setError("A system goal is required before we can draft anything.");
      setStepIndex(0);
      return;
    }

    const trimmedAnswers = INTERVIEW_FIELDS.reduce((acc, field) => {
      acc[field] = answers[field].trim();
      return acc;
    }, {} as InterviewAnswers);

    const payload: PendingGenerationPayload = {
      kind: "interview",
      answers: trimmedAnswers,
      openQuestions: deriveOpenQuestions(trimmedAnswers),
    };
    void createDesign(payload, (id) => `/editor/${id}?start=ai`);
  }, [answers, createDesign, freePrompt, promptStyle]);

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
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                    {PATH_COPY[path].title}
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {PATH_COPY[path].subtitle}
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

                {path === "blank" ? (
                  <PathBlank
                    nameValid={nameValid}
                    isLoading={isLoading}
                    onCreate={() =>
                      void createDesign(null, (id) => `/editor/${id}`)
                    }
                  />
                ) : (
                  <PathPrompt
                answers={answers}
                stepIndex={stepIndex}
                promptStyle={promptStyle}
                freePrompt={freePrompt}
                nameValid={nameValid}
                isLoading={isLoading}
                goalAnswered={goalAnswered}
                onAnswerChange={(field, value) => {
                  setAnswers((prev) => ({ ...prev, [field]: value }));
                  if (error) setError(null);
                }}
                onStepChange={(index) =>
                  setStepIndex(
                    Math.min(Math.max(index, 0), PROMPT_STEPS.length - 1),
                  )
                }
                onFreePromptChange={(value) => {
                  setFreePrompt(value);
                  if (error) setError(null);
                }}
                onUseFreeForm={() => {
                  setPromptStyle("free-form");
                  setError(null);
                }}
                onUseInterview={() => {
                  setPromptStyle("interview");
                  setError(null);
                }}
                    onSubmit={submitPrompt}
                  />
                )}
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
                    ? promptSteps(answers, stepIndex, promptStyle, setStepIndex)
                    : blankSteps(nameValid)
              }
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function promptSteps(
  answers: InterviewAnswers,
  stepIndex: number,
  promptStyle: PromptStyle,
  onJump: (index: number) => void,
): StepperStep[] {
  if (promptStyle === "free-form") {
    return [
      {
        id: "free",
        title: "Free-form prompt",
        subtitle: "Describe it your way",
        state: "active" as const,
      },
    ];
  }
  return PROMPT_STEPS.map(
    (step, index): StepperStep => ({
      id: step.id,
      title: step.title,
      subtitle: step.subtitle,
      state:
        index < stepIndex
          ? ("done" as const)
          : index === stepIndex
            ? ("active" as const)
            : ("upcoming" as const),
      onJump: () => onJump(index),
    }),
  );
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
