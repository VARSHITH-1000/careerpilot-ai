/** Lightweight structural validation for LLM JSON before normalization. */
export function validateContextualFeedbackShape(data: unknown): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (!data || typeof data !== "object") {
    return { ok: false, issues: ["Root must be an object"] };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.overallScore !== "number") issues.push("overallScore missing or not a number");
  if (!o.scoreBreakdown || typeof o.scoreBreakdown !== "object") issues.push("scoreBreakdown missing");
  if (!o.recruiterInsights || typeof o.recruiterInsights !== "object") issues.push("recruiterInsights missing");
  return { ok: issues.length === 0, issues };
}
