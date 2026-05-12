/**
 * Application controller boundary for resume intelligence.
 * Bridges UI routes with deterministic extraction + hybrid scoring orchestration.
 */
import { extractPdfText } from "~/engine/pdf/extract-pdf-text";
import { buildHybridFeedback } from "~/engine/services/hybrid-feedback";
import { validateContextualFeedbackShape } from "~/engine/validators/contextual-feedback";

export async function extractResumeTextForScoring(file: File): Promise<string> {
  try {
    const text = await extractPdfText(file);
    return text ?? "";
  } catch {
    return "";
  }
}

/** Merge deterministic + LLM after JSON has been parsed. */
export function mergeIntoHybridFeedback(
  resumeText: string,
  jobDescription: string,
  targetRole: TargetRole,
  parsedLlmPayload: unknown
): Feedback {
  const validated = validateContextualFeedbackShape(parsedLlmPayload);
  if (!validated.ok && import.meta.env.DEV) {
    console.warn("[resume-analysis] LLM payload issues:", validated.issues);
  }
  return buildHybridFeedback(resumeText, jobDescription, targetRole, parsedLlmPayload);
}

export { buildHybridFeedback, validateContextualFeedbackShape };
