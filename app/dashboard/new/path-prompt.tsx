"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  SendHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRovingFocus } from "@/hooks/use-roving-focus";
import { cn } from "@/lib/utils";
import type { PendingGenerationPayload } from "@/types/onboarding";

export type PromptPhase = "name" | "describe" | "chat" | "summary";

interface TranscriptEntry {
  question: string;
  answer: string;
}

interface PathPromptProps {
  name: string;
  nameValid: boolean;
  /** Project-creation request in flight (owned by the parent flow). */
  isLoading: boolean;
  /** Project-creation error surfaced by the parent flow. */
  createError?: string | null;
  phase: PromptPhase;
  onPhaseChange: (phase: PromptPhase) => void;
  onNameChange: (value: string) => void;
  onSubmit: (payload: PendingGenerationPayload) => void;
}

interface TurnResponse {
  done: boolean;
  recommendation: string;
  question: string;
  options: string[];
  rationale: string;
}

interface SummaryResponse {
  summary: string;
  openQuestions: string[];
}

const MAX_PROMPT = 8000;

const PHASE_ORDER: PromptPhase[] = ["name", "describe", "chat", "summary"];
const PHASE_STEPS: { phase: PromptPhase; label: string }[] = [
  { phase: "name", label: "Name" },
  { phase: "describe", label: "Describe" },
  { phase: "chat", label: "Clarify" },
  { phase: "summary", label: "Review" },
];

function composePrompt(summary: string, transcript: TranscriptEntry[]): string {
  let out = summary.trim();
  const ctx = transcript
    .filter((entry) => entry.answer.trim().length > 0)
    .map((entry) => `Q: ${entry.question}\nA: ${entry.answer.trim()}`)
    .join("\n\n");
  if (ctx) {
    out += `\n\nContext from the onboarding conversation:\n${ctx}`;
  }
  return out.length > MAX_PROMPT ? out.slice(0, MAX_PROMPT) : out;
}

export function PathPrompt({
  name,
  nameValid,
  isLoading,
  createError,
  phase,
  onPhaseChange,
  onNameChange,
  onSubmit,
}: PathPromptProps) {
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [rationale, setRationale] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const callAgent = useCallback(
    async <T,>(
      mode: "turn" | "summary",
      nextDescription: string,
      nextTranscript: TranscriptEntry[],
    ): Promise<T> => {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          name,
          description: nextDescription,
          transcript: nextTranscript,
        }),
      });
      if (!res.ok) throw new Error("agent");
      return (await res.json()) as T;
    },
    [name],
  );

  const clearTurn = useCallback(() => {
    setQuestion(null);
    setRecommendation(null);
    setOptions([]);
    setRationale(null);
  }, []);

  const runSummary = useCallback(
    async (desc: string, nextTranscript: TranscriptEntry[]) => {
      setAgentBusy(true);
      setAgentError(null);
      try {
        const result = await callAgent<SummaryResponse>(
          "summary",
          desc,
          nextTranscript,
        );
        setSummary(result.summary);
        setOpenQuestions(result.openQuestions);
        onPhaseChange("summary");
      } catch {
        setAgentError(
          "Couldn't draft the brief. Retry, or open the canvas with what you've written.",
        );
      } finally {
        setAgentBusy(false);
      }
    },
    [callAgent, onPhaseChange],
  );

  const runTurn = useCallback(
    async (desc: string, nextTranscript: TranscriptEntry[]) => {
      setAgentBusy(true);
      setAgentError(null);
      try {
        const result = await callAgent<TurnResponse>(
          "turn",
          desc,
          nextTranscript,
        );
        if (result.done || !result.question) {
          await runSummary(desc, nextTranscript);
          return;
        }
        setQuestion(result.question);
        setRecommendation(result.recommendation || null);
        setOptions(result.options ?? []);
        setRationale(result.rationale || null);
      } catch {
        setAgentError(
          "Couldn't reach the architect. Retry, or open the canvas with what you've written.",
        );
      } finally {
        setAgentBusy(false);
      }
    },
    [callAgent, runSummary],
  );

  // Composer send — behaviour depends on the current phase.
  const send = useCallback(() => {
    const value = input.trim();
    if (value.length === 0 || agentBusy || isLoading) return;

    if (phase === "name") {
      onNameChange(value);
      setInput("");
      onPhaseChange("describe");
      return;
    }
    if (phase === "describe") {
      setDescription(value);
      setInput("");
      onPhaseChange("chat");
      void runTurn(value, []);
      return;
    }
    // chat
    if (!question) return;
    const next = [...transcript, { question, answer: value }];
    setTranscript(next);
    setInput("");
    clearTurn();
    void runTurn(description, next);
  }, [
    input,
    agentBusy,
    isLoading,
    phase,
    question,
    transcript,
    description,
    onNameChange,
    onPhaseChange,
    runTurn,
    clearTurn,
  ]);

  const pickOption = useCallback(
    (option: string) => {
      if (!question || agentBusy) return;
      const next = [...transcript, { question, answer: option }];
      setTranscript(next);
      setInput("");
      clearTurn();
      void runTurn(description, next);
    },
    [question, agentBusy, transcript, description, runTurn, clearTurn],
  );

  const skip = useCallback(() => {
    if (!question || agentBusy) return;
    const next = [...transcript, { question, answer: "" }];
    setTranscript(next);
    setInput("");
    clearTurn();
    void runTurn(description, next);
  }, [question, agentBusy, transcript, description, runTurn, clearTurn]);

  const finishEarly = useCallback(() => {
    if (agentBusy) return;
    void runSummary(description, transcript);
  }, [agentBusy, description, transcript, runSummary]);

  const approve = useCallback(() => {
    onSubmit({
      kind: "free-form",
      prompt: composePrompt(summary, transcript),
      openQuestions,
    });
  }, [summary, transcript, openQuestions, onSubmit]);

  const skipToCanvas = useCallback(() => {
    if (description.trim().length === 0 || !nameValid) return;
    onSubmit({
      kind: "free-form",
      prompt: description.trim().slice(0, MAX_PROMPT),
      openQuestions: [],
    });
  }, [description, nameValid, onSubmit]);

  const named = phase !== "name";
  const described = phase === "chat" || phase === "summary";

  const placeholder =
    phase === "name"
      ? "Name this design — e.g. Billing service"
      : phase === "describe"
        ? "Describe what you're building…"
        : options.length > 0
          ? "Pick one above, or type your answer…"
          : "Type your answer…";

  const sendDisabled = input.trim().length === 0 || agentBusy || isLoading;

  // Thread scrolling: the thread is the only scroll region. Autoscroll to the
  // newest content on meaningful changes, and reveal a "jump to latest" pill
  // when the user has scrolled away from the bottom.
  const threadRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 80);
  }, []);

  // New message / phase / thinking state should pull the view to the bottom.
  // `summary` is intentionally excluded so editing the brief doesn't yank scroll.
  useEffect(() => {
    scrollToBottom();
  }, [phase, transcript.length, agentBusy, question, agentError, scrollToBottom]);

  const onChipKeyDown = useRovingFocus<HTMLButtonElement>({
    itemCount: options.length,
    columns: "auto",
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Chat header — centered kickoff label */}
      <div className="shrink-0 border-b border-border-default">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-center px-6 py-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Architecture kickoff
          </span>
        </div>
      </div>

      {/* Phase progress — vertical connected thread, pinned right-middle */}
      <PhaseProgress phase={phase} />

      {/* Thread — sole scroll region */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={threadRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-6 py-8">
            <ArchitectMessage>
              I&rsquo;ll help you turn this into a system we can design and
              generate a spec from. First — what should we call this design?
            </ArchitectMessage>

            {named ? <YouMessage>{name}</YouMessage> : null}

            {named ? (
              <ArchitectMessage>
                Good. Now, in your own words — what are you building? A few
                sentences is plenty.
              </ArchitectMessage>
            ) : null}

            {described ? <YouMessage>{description}</YouMessage> : null}

            {transcript.map((entry, index) => (
              <div key={index} className="flex flex-col gap-8">
                <ArchitectMessage>{entry.question}</ArchitectMessage>
                <YouMessage muted={!entry.answer}>
                  {entry.answer || "Skipped"}
                </YouMessage>
              </div>
            ))}

            {phase === "chat" && question && !agentBusy ? (
              <ArchitectMessage>
                {recommendation ? (
                  <span className="mb-2.5 block border-l-2 border-accent-primary/50 pl-3 text-text-secondary">
                    {recommendation}
                  </span>
                ) : null}
                <span className="block text-[15px] font-medium text-text-primary">
                  {question}
                </span>
                {rationale ? (
                  <span className="mt-1.5 block text-xs leading-relaxed text-text-muted">
                    {rationale}
                  </span>
                ) : null}
              </ArchitectMessage>
            ) : null}

            {agentBusy ? <ThinkingMessage /> : null}

            {phase === "summary" ? (
              <ArchitectMessage>
                Here&rsquo;s the architecture brief from our conversation. Edit
                anything, then open the canvas to start designing.
              </ArchitectMessage>
            ) : null}

            {phase === "summary" ? (
              <div className="flex flex-col gap-4 pl-10">
                <Textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-[240px] resize-y bg-bg-elevated font-mono text-[13px] leading-relaxed"
                />
                {openQuestions.length > 0 ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-border-default bg-bg-surface p-4">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-text-muted uppercase">
                      Open questions
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {openQuestions.map((q) => (
                        <li
                          key={q}
                          className="flex gap-2 text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-state-warning" />
                          {q}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-text-faint">
                      These carry onto the canvas as open questions instead of
                      being guessed.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {agentError ? (
              <div className="ml-10 flex flex-col gap-2 rounded-xl border border-state-error/30 bg-bg-surface p-4">
                <p className="text-xs text-state-error">{agentError}</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void runTurn(description, transcript)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                  <button
                    type="button"
                    onClick={skipToCanvas}
                    className="text-xs text-text-muted underline-offset-4 hover:text-text-secondary hover:underline"
                  >
                    Open the canvas with what I wrote
                  </button>
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} aria-hidden className="h-px w-full" />
          </div>
        </div>

        {/* Jump to latest */}
        {!atBottom ? (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            aria-label="Scroll to latest"
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border-default bg-bg-elevated/90 px-3 py-1.5 text-[11px] text-text-secondary shadow-sm backdrop-blur transition-colors hover:border-border-hover hover:text-text-primary"
          >
            <ArrowDown className="h-3 w-3" />
            Latest
          </button>
        ) : null}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border-default bg-bg-base/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2 px-6 py-4">
          {createError ? (
            <p className="text-xs text-state-error">{createError}</p>
          ) : null}

          {phase === "summary" ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onPhaseChange("chat")}
                disabled={isLoading || agentBusy}
                className="text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
              >
                ← Back to questions
              </button>
              <Button
                onClick={approve}
                disabled={isLoading || summary.trim().length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Approve &amp; open canvas
              </Button>
            </div>
          ) : (
            <>
              {phase === "chat" && options.length > 0 && !agentBusy ? (
                <div
                  role="group"
                  aria-label="Suggested answers"
                  onKeyDown={onChipKeyDown.handleKeyDown}
                  className="flex flex-wrap gap-2"
                >
                  {options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      {...onChipKeyDown.getItemProps(index)}
                      onClick={() => pickOption(option)}
                      className="rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent-primary/50 hover:text-text-primary focus-visible:border-accent-primary/60 focus-visible:text-text-primary focus-visible:outline-none"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-2">
                <Textarea
                  autoFocus
                  value={input}
                  placeholder={placeholder}
                  disabled={agentBusy || isLoading}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  className="min-h-[48px] resize-none bg-bg-elevated text-sm"
                />
                <Button
                  size="icon"
                  onClick={send}
                  disabled={sendDisabled}
                  aria-label="Send"
                >
                  {agentBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-text-faint">
                  Enter to send · Shift + Enter for a new line
                </p>
                {phase === "describe" ? (
                  <button
                    type="button"
                    onClick={skipToCanvas}
                    disabled={input.trim().length === 0 || isLoading}
                    className="text-[11px] text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
                  >
                    Skip questions, open the canvas
                  </button>
                ) : null}
                {phase === "chat" && question && !agentBusy ? (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={skip}
                      className="text-[11px] text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={finishEarly}
                      className="text-[11px] text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline"
                    >
                      Draft the brief
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseProgress({ phase }: { phase: PromptPhase }) {
  const current = PHASE_ORDER.indexOf(phase);
  return (
    <ol
      aria-label="Progress"
      className="absolute top-1/2 right-8 z-10 hidden -translate-y-1/2 flex-col lg:flex"
    >
      {PHASE_STEPS.map((step, index) => {
        const state =
          index < current ? "done" : index === current ? "active" : "upcoming";
        const isLast = index === PHASE_STEPS.length - 1;
        return (
          <li
            key={step.phase}
            aria-current={state === "active" ? "step" : undefined}
            className="flex gap-3"
          >
            {/* Rail: dot + connecting thread */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                  state === "done" && "bg-text-muted",
                  state === "active" && "bg-accent-primary",
                  state === "upcoming" && "bg-border-subtle",
                )}
              />
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    "w-px flex-1 transition-colors",
                    index < current ? "bg-text-faint" : "bg-border-subtle",
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.12em] uppercase transition-colors",
                isLast ? "pb-0" : "pb-7",
                state === "active" ? "text-text-secondary" : "text-text-faint",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ArchitectMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent-primary/30 bg-accent-primary-dim text-accent-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
          Arqitect
        </span>
        <div className="text-sm leading-relaxed text-text-primary">
          {children}
        </div>
      </div>
    </div>
  );
}

function YouMessage({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-row-reverse items-center gap-3">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-elevated text-text-muted">
        <User className="h-3.5 w-3.5" />
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl border border-border-default bg-bg-surface px-3.5 py-2.5 text-sm leading-relaxed",
          muted ? "text-text-faint italic" : "text-text-secondary",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ThinkingMessage() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent-primary/30 bg-accent-primary-dim text-accent-primary">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      </span>
      <div className="flex items-center gap-1.5 pt-1.5 text-sm text-text-muted">
        Thinking
        <span className="inline-flex gap-0.5">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1 w-1 animate-bounce rounded-full bg-text-muted"
      style={{ animationDelay: delay }}
    />
  );
}
