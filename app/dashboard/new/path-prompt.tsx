"use client";

import { ArrowLeft, ArrowRight, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERVIEW_FIELD_META,
  PROMPT_STEPS,
  type InterviewAnswers,
  type InterviewField,
} from "@/types/onboarding";

export type PromptStyle = "interview" | "free-form";

interface PathPromptProps {
  answers: InterviewAnswers;
  stepIndex: number;
  promptStyle: PromptStyle;
  freePrompt: string;
  nameValid: boolean;
  isLoading: boolean;
  goalAnswered: boolean;
  onAnswerChange: (field: InterviewField, value: string) => void;
  onStepChange: (index: number) => void;
  onFreePromptChange: (value: string) => void;
  onUseFreeForm: () => void;
  onUseInterview: () => void;
  onSubmit: () => void;
}

export function PathPrompt({
  answers,
  stepIndex,
  promptStyle,
  freePrompt,
  nameValid,
  isLoading,
  goalAnswered,
  onAnswerChange,
  onStepChange,
  onFreePromptChange,
  onUseFreeForm,
  onUseInterview,
  onSubmit,
}: PathPromptProps) {
  if (promptStyle === "free-form") {
    return (
      <div className="flex flex-col gap-4">
        <Textarea
          autoFocus
          value={freePrompt}
          placeholder="Describe the system you want Arqitect to draft..."
          onChange={(event) => onFreePromptChange(event.target.value)}
          className="min-h-[180px] resize-none bg-bg-elevated text-sm"
        />
        <p className="rounded-lg border border-state-warning/30 bg-state-warning/10 px-3 py-2 text-xs text-state-warning">
          Free-form prompts produce designs with more open questions and lower
          confidence. That&rsquo;s visible in the result, not hidden.
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onUseInterview}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
          >
            <PenLine className="h-3.5 w-3.5" />
            Back to guided questions
          </button>
          <Button
            onClick={onSubmit}
            disabled={isLoading || !nameValid || freePrompt.trim().length === 0}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Draft now
          </Button>
        </div>
      </div>
    );
  }

  const step = PROMPT_STEPS[stepIndex]!;
  const isLastStep = stepIndex === PROMPT_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {step.fields.map((field, fieldIndex) => {
          const meta = INTERVIEW_FIELD_META[field];
          const value = answers[field];
          return (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">
                {meta.question}
                {meta.required ? null : (
                  <span className="ml-2 font-mono text-[10px] tracking-[0.12em] text-text-faint uppercase">
                    Optional
                  </span>
                )}
              </label>
              <p className="text-xs text-text-muted">{meta.hint}</p>
              {meta.multiline ? (
                <Textarea
                  autoFocus={fieldIndex === 0}
                  value={value}
                  placeholder={meta.placeholder}
                  onChange={(event) => onAnswerChange(field, event.target.value)}
                  className="min-h-[88px] resize-none bg-bg-elevated text-sm"
                />
              ) : (
                <Input
                  autoFocus={fieldIndex === 0}
                  value={value}
                  placeholder={meta.placeholder}
                  onChange={(event) => onAnswerChange(field, event.target.value)}
                  className="bg-bg-elevated"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStepChange(stepIndex - 1)}
          disabled={isLoading || stepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {!isLastStep ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStepChange(stepIndex + 1)}
              disabled={isLoading}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            onClick={onSubmit}
            disabled={isLoading || !nameValid || !goalAnswered}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Draft now
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={onUseFreeForm}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 self-start text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:underline disabled:opacity-50"
      >
        <PenLine className="h-3.5 w-3.5" />
        Skip the questions and write a free-form prompt
      </button>
    </div>
  );
}
