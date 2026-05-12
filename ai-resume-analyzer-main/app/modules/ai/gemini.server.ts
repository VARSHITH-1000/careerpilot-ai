import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverEnv } from "~/config/env.server";
import { logger } from "~/utils/logger.server";

const MAX_RETRIES = 3;
const ATTEMPT_TIMEOUT_MS = 45_000; // 45 seconds per attempt (slim prompt = fast)

type InsightCategory = {
  reasoning: string;
  weaknesses: string[];
  missingKeywords: string[];
  recruiterConcerns: string[];
  suggestions: {
    betterBullets: string[];
    strongerActionVerbs: string[];
    quantifiedImpact: string[];
    missingTechnologies: string[];
    missingATSKeywords: string[];
  };
};

export type ContextualInsights = {
  heatmap: {
    strongSections: string[];
    weakSections: string[];
    keywordDensity: { section: string; score: number }[];
  };
  roleAnalysis: {
    matchScore: number;
    fitSummary: string;
    gaps: string[];
    recommendations: string[];
  };
  interviewReadiness: {
    technicalReadiness: number;
    dsaReadiness: number;
    communicationReadiness: number;
    aiMlReadiness: number;
    summary: string;
  };
  recruiterInsights: {
    strengths: string[];
    hiringConcerns: string[];
    recommendedImprovements: string[];
    atsOptimizationInsights: string[];
  };
  categoryInsights: {
    atsCompatibility: InsightCategory;
    technicalSkills: InsightCategory;
    projectQuality: InsightCategory;
    resumeFormatting: InsightCategory;
    keywordOptimization: InsightCategory;
    leadershipImpact: InsightCategory;
    experienceRelevance: InsightCategory;
  };
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`AI request timed out after ${ms / 1000}s (${label})`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

function safeParseJson(raw: string): unknown {
  let s = raw.trim().replace(/^\uFEFF/, "");
  // Strip markdown fences
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  else if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  // Find first balanced JSON object
  const start = s.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') { inString = false; continue; }
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return JSON.parse(s.slice(start, i + 1));
      }
    }
  }
  return JSON.parse(s);
}

/**
 * Sends a slim, compressed prompt to the AI model requesting ONLY contextual insights.
 * Numeric scoring is handled by the deterministic engine — this call is fast and focused.
 */
export async function generateContextualInsights(prompt: string): Promise<ContextualInsights> {
  const gen = new GoogleGenerativeAI(serverEnv.GEMINI_API_KEY);
  const model = gen.getGenerativeModel({
    model: serverEnv.GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    logger.info(`AI insights attempt ${attempt}/${MAX_RETRIES}`);
    try {
      const result = await withTimeout(
        model.generateContent(prompt),
        ATTEMPT_TIMEOUT_MS,
        `attempt ${attempt}`
      );
      const text = result.response.text();
      if (!text?.trim()) throw new Error("AI returned an empty response");

      const parsed = safeParseJson(text) as ContextualInsights;
      logger.info(`AI insights succeeded on attempt ${attempt}`);
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        const backoff = attempt * 2000;
        logger.info(`Retrying in ${backoff / 1000}s…`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  logger.error(`All ${MAX_RETRIES} AI attempts failed`, lastError);
  throw lastError;
}
