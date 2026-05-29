import {
  INTERVIEW_FIELDS,
  INTERVIEW_FIELD_META,
  type InterviewAnswers,
  type PendingGenerationPayload,
} from "@/types/onboarding";

/**
 * Compose a single generation prompt from a captured pending generation. The
 * editor uses this to pre-fill the AI architect input so the user confirms or
 * edits before generation is queued (spec 03 owns the actual run).
 */
export function buildGenerationPrompt(
  payload: PendingGenerationPayload,
): string {
  if (payload.kind === "free-form") {
    return payload.prompt.trim();
  }
  return buildInterviewPrompt(payload.answers, payload.openQuestions);
}

function buildInterviewPrompt(
  answers: InterviewAnswers,
  openQuestions: string[],
): string {
  const lines: string[] = [];
  for (const field of INTERVIEW_FIELDS) {
    const value = answers[field].trim();
    if (value.length === 0) {
      continue;
    }
    lines.push(`${INTERVIEW_FIELD_META[field].label}: ${value}`);
  }

  const sections = [
    "Design a system architecture from the following structured brief.",
    lines.join("\n"),
  ];

  if (openQuestions.length > 0) {
    sections.push(
      [
        "The following were left unanswered. Treat them as open questions on the design rather than inventing answers; mark the affected components low-confidence:",
        ...openQuestions.map((question) => `- ${question}`),
      ].join("\n"),
    );
  }

  return sections.filter((section) => section.trim().length > 0).join("\n\n");
}
