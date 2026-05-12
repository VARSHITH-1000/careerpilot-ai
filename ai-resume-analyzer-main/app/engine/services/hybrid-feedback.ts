import { BREAKDOWN_LABELS, buildImprovementRoadmap, buildReasoningTrace } from "../analytics/roadmap";
import { runDeterministicEngine, type DeterministicEngineResult } from "../scoring/deterministic-engine";
import { normalizeFeedback } from "~/lib/feedback";
import type { ContextualInsights } from "~/modules/ai/gemini.server";

const BLEND = { deterministic: 0.6, llm: 0.4 } as const;

const CATEGORY_KEYS: ScoreBreakdownKey[] = [
  "atsCompatibility",
  "technicalSkills",
  "projectQuality",
  "resumeFormatting",
  "keywordOptimization",
  "leadershipImpact",
  "experienceRelevance",
];

function averageDeterministic(scores: CategoryDeterministicScores): number {
  const sum = CATEGORY_KEYS.reduce((a, k) => a + scores[k], 0);
  return Math.round(sum / CATEGORY_KEYS.length);
}

function categoryConfidence(deterministic: number, llm: number, textLen: number): number {
  const agreement = 100 - Math.min(100, Math.abs(deterministic - llm) * 1.2);
  const textBoost = textLen > 900 ? 6 : textLen > 400 ? 0 : -8;
  return Math.max(35, Math.min(98, Math.round(agreement * 0.85 + textBoost)));
}

function overallConfidence(det: CategoryDeterministicScores, llmScores: CategoryDeterministicScores): number {
  let diff = 0;
  for (const k of CATEGORY_KEYS) diff += Math.abs(det[k] - llmScores[k]);
  diff /= CATEGORY_KEYS.length;
  return Math.max(45, Math.min(96, Math.round(100 - diff * 0.85)));
}

function mergeHeatmaps(
  base: Feedback["heatmap"],
  det: DeterministicEngineResult
): Feedback["heatmap"] {
  const fromBuckets = det.keywordBuckets
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((b) => ({
      section: `Keyword "${b.phrase}"`,
      score: Math.min(100, b.count > 4 ? 90 : b.count > 1 ? 70 : Math.max(35, Math.round((b.count + 2) * 15))),
    }));

  const keywordDensity =
    base.keywordDensity && base.keywordDensity.length > 3
      ? base.keywordDensity
      : fromBuckets.length > 0
        ? fromBuckets
        : base.keywordDensity;

  const strong = new Set(base.strongSections);
  const weak = new Set(base.weakSections);
  CATEGORY_KEYS.forEach((k) => {
    if (det.scores[k] >= 72) strong.add(BREAKDOWN_LABELS[k]);
    if (det.scores[k] < 42) weak.add(BREAKDOWN_LABELS[k]);
  });

  return { ...base, keywordDensity, strongSections: [...strong], weakSections: [...weak] };
}

function defaultInsightCategory(title: string): ScoreCategory["suggestions"] {
  return {
    betterBullets: ["Use achievement-oriented bullets with clear outcomes."],
    strongerActionVerbs: ["Built", "Optimized", "Led"],
    quantifiedImpact: ["Add metrics such as % improvement, latency, or revenue impact."],
    missingTechnologies: [],
    missingATSKeywords: [],
  };
}

/** Build a full ScoreCategory by merging deterministic score with LLM category insight. */
function buildCategory(
  key: ScoreBreakdownKey,
  detScore: number,
  insight?: ContextualInsights["categoryInsights"][ScoreBreakdownKey],
  textLen = 500
): ScoreCategory {
  const label = BREAKDOWN_LABELS[key];
  const llmScore = detScore; // deterministic-only mode: no separate LLM score
  const confidence = categoryConfidence(detScore, llmScore, textLen);

  return {
    score: detScore,
    confidence,
    reasoning: insight?.reasoning ?? `${label} scored ${detScore}/100 via deterministic analysis.`,
    weaknesses: insight?.weaknesses?.length ? insight.weaknesses : [`${label} needs more concrete evidence.`],
    missingKeywords: insight?.missingKeywords ?? [],
    formattingIssues: [],
    recruiterConcerns: insight?.recruiterConcerns ?? [],
    suggestions: insight?.suggestions ?? defaultInsightCategory(label),
    insights: [],
  };
}

/**
 * Build hybrid feedback from pre-computed deterministic result + slim AI contextual insights.
 * Scores are 100% deterministic; AI contributes reasoning, recruiter insights, role analysis.
 */
export function buildHybridFeedbackFromInsights(
  resumeText: string | null | undefined,
  jobDescription: string,
  targetRole: TargetRole,
  det: DeterministicEngineResult,
  contextual: ContextualInsights | null
): Feedback {
  const textLen = resumeText?.length ?? 0;
  const overallScore = averageDeterministic(det.scores);

  const scoreBreakdown: Feedback["scoreBreakdown"] = {} as Feedback["scoreBreakdown"];
  for (const k of CATEGORY_KEYS) {
    scoreBreakdown[k] = buildCategory(
      k,
      det.scores[k],
      contextual?.categoryInsights?.[k],
      textLen
    );
  }

  // Heatmap: use AI output if available, otherwise derive from deterministic
  const aiHeatmap: Feedback["heatmap"] = contextual?.heatmap
    ? {
        strongSections: contextual.heatmap.strongSections ?? [],
        weakSections: contextual.heatmap.weakSections ?? [],
        keywordDensity: contextual.heatmap.keywordDensity ?? [],
      }
    : {
        strongSections: [],
        weakSections: [],
        keywordDensity: [],
      };
  const heatmap = mergeHeatmaps(aiHeatmap, det);

  // Role analysis
  const roleAnalysis: Feedback["roleAnalysis"] = {
    role: targetRole,
    matchScore: contextual?.roleAnalysis?.matchScore ?? overallScore,
    fitSummary: contextual?.roleAnalysis?.fitSummary ?? "Analysis based on deterministic scoring.",
    gaps: contextual?.roleAnalysis?.gaps ?? [],
    recommendations: contextual?.roleAnalysis?.recommendations ?? [],
  };

  // Interview readiness
  const interviewReadiness: Feedback["interviewReadiness"] = {
    technicalReadiness: contextual?.interviewReadiness?.technicalReadiness ?? det.scores.technicalSkills,
    dsaReadiness: contextual?.interviewReadiness?.dsaReadiness ?? 55,
    communicationReadiness: contextual?.interviewReadiness?.communicationReadiness ?? 60,
    aiMlReadiness: contextual?.interviewReadiness?.aiMlReadiness ?? 50,
    summary: contextual?.interviewReadiness?.summary ?? "Build stronger project storytelling and interview examples.",
  };

  // Recruiter insights
  const recruiterInsights: Feedback["recruiterInsights"] = {
    strengths: contextual?.recruiterInsights?.strengths ?? ["Demonstrates hands-on engineering experience."],
    hiringConcerns: contextual?.recruiterInsights?.hiringConcerns ?? ["Impact statements need quantification."],
    recommendedImprovements: contextual?.recruiterInsights?.recommendedImprovements ?? ["Add measurable outcomes and modern toolchain keywords."],
    atsOptimizationInsights: contextual?.recruiterInsights?.atsOptimizationInsights ?? ["Increase role-specific ATS keyword coverage."],
  };

  // Improvement roadmap from deterministic signals
  const allWeaknesses = CATEGORY_KEYS.flatMap((k) => scoreBreakdown[k].weaknesses).slice(0, 12);
  const roadmap = buildImprovementRoadmap(det, allWeaknesses);

  const llmScoresForMeta = CATEGORY_KEYS.reduce((acc, k) => {
    acc[k] = det.scores[k];
    return acc;
  }, {} as CategoryDeterministicScores);

  const hybrid: HybridScoringMeta = {
    blendWeights: { deterministic: 1, llm: contextual ? 0 : 0 },
    overallConfidence: overallConfidence(det.scores, llmScoresForMeta),
    categoryConfidence: CATEGORY_KEYS.reduce((acc, k) => {
      acc[k] = scoreBreakdown[k].confidence ?? 80;
      return acc;
    }, {} as Record<ScoreBreakdownKey, number>),
    deterministicScores: det.scores,
    llmScores: llmScoresForMeta,
    reasoningTrace: [
      ...buildReasoningTrace(det, textLen),
      contextual
        ? `AI contextual insights merged successfully.`
        : `AI insights unavailable — deterministic-only result.`,
      `Overall score: ${overallScore}/100 (deterministic).`,
    ],
    improvementRoadmap: roadmap,
    deterministicSignals: det.signals,
    skillDistribution: det.skillDistribution,
    keywordHeatmapBuckets: det.keywordBuckets,
  };

  return {
    overallScore,
    targetRole,
    scoreBreakdown,
    heatmap,
    roleAnalysis,
    interviewReadiness,
    recruiterInsights,
    hybrid,
  };
}

/**
 * Legacy path — kept for backwards compatibility with any code that passes a raw LLM JSON payload.
 */
export function buildHybridFeedback(
  resumeText: string | null | undefined,
  jobDescription: string,
  targetRole: TargetRole,
  llmRaw: unknown,
  opts?: { minTextChars?: number }
): Feedback {
  const minChars = opts?.minTextChars ?? 80;
  const textLen = resumeText?.length ?? 0;
  const llmNormalized = normalizeFeedback(llmRaw, targetRole);

  const llmScores = {} as CategoryDeterministicScores;
  for (const k of CATEGORY_KEYS) llmScores[k] = llmNormalized.scoreBreakdown[k].score;

  if (textLen < minChars) {
    const neutral = CATEGORY_KEYS.reduce((acc, k) => { acc[k] = 50; return acc; }, {} as CategoryDeterministicScores);
    return {
      ...llmNormalized,
      hybrid: {
        blendWeights: { deterministic: 0, llm: 1 },
        overallConfidence: 62,
        categoryConfidence: CATEGORY_KEYS.reduce((acc, k) => { acc[k] = 58; return acc; }, {} as Record<ScoreBreakdownKey, number>),
        deterministicScores: neutral,
        llmScores,
        reasoningTrace: ["Resume text too short for deterministic scoring.", "Scores reflect LLM interpretation only."],
        improvementRoadmap: [],
        deterministicSignals: {},
        skillDistribution: [],
        keywordHeatmapBuckets: [],
      },
    };
  }

  const det = runDeterministicEngine(resumeText!, jobDescription, targetRole);
  const mergedBreakdown = { ...llmNormalized.scoreBreakdown };

  for (const k of CATEGORY_KEYS) {
    const d = det.scores[k];
    const l = llmScores[k];
    const blended = Math.round(BLEND.deterministic * d + BLEND.llm * l);
    mergedBreakdown[k] = {
      ...llmNormalized.scoreBreakdown[k],
      score: blended,
      confidence: categoryConfidence(d, l, textLen),
      reasoning: [
        llmNormalized.scoreBreakdown[k].reasoning,
        `Deterministic: ${d}/100; contextual: ${l}/100; blended ${blended}/100.`,
      ].filter(Boolean).join(" "),
    };
  }

  const detOverall = averageDeterministic(det.scores);
  const llmOverall = llmNormalized.overallScore;
  const overallScore = Math.round(BLEND.deterministic * detOverall + BLEND.llm * llmOverall);
  const roadmap = buildImprovementRoadmap(det, CATEGORY_KEYS.flatMap((k) => mergedBreakdown[k].weaknesses).slice(0, 12));

  return {
    ...llmNormalized,
    overallScore,
    scoreBreakdown: mergedBreakdown,
    heatmap: mergeHeatmaps(llmNormalized.heatmap, det),
    hybrid: {
      blendWeights: BLEND,
      overallConfidence: overallConfidence(det.scores, llmScores),
      categoryConfidence: CATEGORY_KEYS.reduce((acc, k) => { acc[k] = categoryConfidence(det.scores[k], llmScores[k], textLen); return acc; }, {} as Record<ScoreBreakdownKey, number>),
      deterministicScores: det.scores,
      llmScores,
      reasoningTrace: [...buildReasoningTrace(det, textLen), `Blended overall: ${overallScore}/100.`],
      improvementRoadmap: roadmap,
      deterministicSignals: det.signals,
      skillDistribution: det.skillDistribution,
      keywordHeatmapBuckets: det.keywordBuckets,
    },
  };
}
