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
    jdMatchPercentage?: number;
    recruiterImpressionScore?: number;
    hiringReadinessScore?: number;
    aiConfidenceScore?: number;
    fitSummary: string;
    gaps: string[];
    missingSkills?: string[];
    missingAtsKeywords?: string[];
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

import { safeParseJson } from "./llm.server";

/**
 * Sends a slim, compressed prompt to the AI model requesting ONLY contextual insights.
 * Numeric scoring is handled by the deterministic engine — this call is fast and focused.
 */
export async function generateContextualInsights(prompt: string): Promise<ContextualInsights> {
  if (!serverEnv.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
  }
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
