const clampScore = (value: unknown, fallback = 50) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const asStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : fallback;
};

const asTargetRole = (value: unknown): TargetRole => {
  const roles: TargetRole[] = [
    "Software Engineer",
    "ML Engineer",
    "Data Scientist",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
  ];
  if (typeof value === "string" && roles.includes(value as TargetRole)) {
    return value as TargetRole;
  }
  return "Software Engineer";
};

const defaultCategory = (title: string): ScoreCategory => ({
  score: 50,
  reasoning: `The ${title} section needs stronger evidence and clearer alignment with recruiter expectations.`,
  weaknesses: [`${title} evidence is too generic.`],
  missingKeywords: [],
  formattingIssues: [],
  recruiterConcerns: [`${title} lacks measurable proof.`],
  suggestions: {
    betterBullets: ["Use achievement-oriented bullets with clear outcomes."],
    strongerActionVerbs: ["Built", "Optimized", "Led"],
    quantifiedImpact: ["Add metrics such as % improvement, latency, or revenue impact."],
    missingTechnologies: [],
    missingATSKeywords: [],
  },
  insights: [
    {
      type: "improve",
      title: `${title}: Increase impact`,
      explanation: "Focus on measurable outcomes and role-specific responsibilities.",
    },
  ],
});

const normalizeCategory = (value: unknown, fallbackTitle: string): ScoreCategory => {
  const source = (value ?? {}) as Partial<ScoreCategory>;
  const fallback = defaultCategory(fallbackTitle);
  const suggestions = (source.suggestions ?? {}) as Partial<ScoreCategory["suggestions"]>;
  const insightsRaw = Array.isArray(source.insights) ? source.insights : [];

  return {
    score: clampScore(source.score, fallback.score),
    confidence:
      typeof (source as { confidence?: unknown }).confidence === "number"
        ? clampScore((source as { confidence?: number }).confidence, 72)
        : undefined,
    reasoning: typeof source.reasoning === "string" ? source.reasoning : fallback.reasoning,
    weaknesses: asStringArray(source.weaknesses, fallback.weaknesses),
    missingKeywords: asStringArray(source.missingKeywords, fallback.missingKeywords),
    formattingIssues: asStringArray(source.formattingIssues, fallback.formattingIssues),
    recruiterConcerns: asStringArray(source.recruiterConcerns, fallback.recruiterConcerns),
    suggestions: {
      betterBullets: asStringArray(suggestions.betterBullets, fallback.suggestions.betterBullets),
      strongerActionVerbs: asStringArray(suggestions.strongerActionVerbs, fallback.suggestions.strongerActionVerbs),
      quantifiedImpact: asStringArray(suggestions.quantifiedImpact, fallback.suggestions.quantifiedImpact),
      missingTechnologies: asStringArray(suggestions.missingTechnologies, fallback.suggestions.missingTechnologies),
      missingATSKeywords: asStringArray(suggestions.missingATSKeywords, fallback.suggestions.missingATSKeywords),
    },
    insights: insightsRaw
      .map((item) => {
        const typed = item as Partial<InsightItem>;
        if (typeof typed.title !== "string" || typeof typed.explanation !== "string") return null;
        return {
          type: typed.type === "good" ? "good" : "improve",
          title: typed.title,
          explanation: typed.explanation,
        } as InsightItem;
      })
      .filter((item): item is InsightItem => Boolean(item)),
  };
};

const legacyScore = (value: unknown): number => {
  const source = value as { score?: unknown };
  return clampScore(source?.score, 50);
};

export const normalizeFeedback = (
  rawFeedback: unknown,
  targetRoleHint?: string
): Feedback => {
  const raw = (rawFeedback ?? {}) as Partial<Feedback> & {
    ATS?: { score?: number; tips?: { type: "good" | "improve"; tip: string; explanation?: string }[] };
    toneAndStyle?: { score?: number };
    content?: { score?: number };
    structure?: { score?: number };
    skills?: { score?: number };
  };

  const scoreBreakdown = raw.scoreBreakdown ?? {
    atsCompatibility: { score: legacyScore(raw.ATS) },
    technicalSkills: { score: legacyScore(raw.skills) },
    projectQuality: { score: legacyScore(raw.content) },
    resumeFormatting: { score: legacyScore(raw.structure) },
    keywordOptimization: { score: legacyScore(raw.ATS) },
    leadershipImpact: { score: clampScore(raw.toneAndStyle?.score, 50) },
    experienceRelevance: { score: clampScore(raw.content?.score, 50) },
  };

  const normalized: Feedback = {
    overallScore: clampScore(raw.overallScore, 50),
    targetRole: asTargetRole(raw.targetRole ?? targetRoleHint),
    scoreBreakdown: {
      atsCompatibility: normalizeCategory(scoreBreakdown.atsCompatibility, "ATS Compatibility"),
      technicalSkills: normalizeCategory(scoreBreakdown.technicalSkills, "Technical Skills"),
      projectQuality: normalizeCategory(scoreBreakdown.projectQuality, "Project Quality"),
      resumeFormatting: normalizeCategory(scoreBreakdown.resumeFormatting, "Resume Formatting"),
      keywordOptimization: normalizeCategory(scoreBreakdown.keywordOptimization, "Keyword Optimization"),
      leadershipImpact: normalizeCategory(scoreBreakdown.leadershipImpact, "Leadership & Impact"),
      experienceRelevance: normalizeCategory(scoreBreakdown.experienceRelevance, "Experience Relevance"),
    },
    heatmap: {
      strongSections: asStringArray(raw.heatmap?.strongSections, ["Skills", "Experience"]),
      weakSections: asStringArray(raw.heatmap?.weakSections, ["Projects", "Summary"]),
      keywordDensity: Array.isArray(raw.heatmap?.keywordDensity) && raw.heatmap.keywordDensity.length > 0
        ? raw.heatmap.keywordDensity.map((item) => ({
            section: typeof item.section === "string" ? item.section : "Section",
            score: clampScore(item.score, 50),
          }))
        : [
            { section: "Summary", score: 45 },
            { section: "Experience", score: 70 },
            { section: "Projects", score: 55 },
            { section: "Skills", score: 80 },
          ],
    },
    roleAnalysis: {
      role: asTargetRole(raw.roleAnalysis?.role ?? raw.targetRole ?? targetRoleHint),
      matchScore: clampScore(raw.roleAnalysis?.matchScore, clampScore(raw.overallScore, 50)),
      fitSummary:
        raw.roleAnalysis?.fitSummary ??
        "Your resume demonstrates potential but needs sharper alignment with role-specific outcomes.",
      gaps: asStringArray(raw.roleAnalysis?.gaps, ["Role-specific keywords are underrepresented."]),
      recommendations: asStringArray(raw.roleAnalysis?.recommendations, [
        "Mirror priority responsibilities from the target job description.",
      ]),
    },
    interviewReadiness: {
      technicalReadiness: clampScore(raw.interviewReadiness?.technicalReadiness, 55),
      dsaReadiness: clampScore(raw.interviewReadiness?.dsaReadiness, 50),
      communicationReadiness: clampScore(raw.interviewReadiness?.communicationReadiness, 60),
      aiMlReadiness: clampScore(raw.interviewReadiness?.aiMlReadiness, 50),
      summary:
        raw.interviewReadiness?.summary ??
        "Build stronger project storytelling and practical interview examples to improve readiness.",
    },
    recruiterInsights: {
      strengths: asStringArray(raw.recruiterInsights?.strengths, [
        "Demonstrates hands-on engineering experience.",
      ]),
      hiringConcerns: asStringArray(raw.recruiterInsights?.hiringConcerns, [
        "Impact statements are not quantified enough.",
      ]),
      recommendedImprovements: asStringArray(raw.recruiterInsights?.recommendedImprovements, [
        "Add measurable outcomes and modern toolchain keywords.",
      ]),
      atsOptimizationInsights: asStringArray(raw.recruiterInsights?.atsOptimizationInsights, [
        "Increase coverage of role-specific ATS keywords in experience bullets.",
      ]),
    },
  };

  const persistedHybrid = (raw as Partial<Feedback>).hybrid;
  if (
    persistedHybrid &&
    typeof persistedHybrid === "object" &&
    persistedHybrid.blendWeights &&
    typeof persistedHybrid.blendWeights.deterministic === "number"
  ) {
    normalized.hybrid = persistedHybrid as HybridScoringMeta;
  }

  return normalized;
};

/** Pull plain text from OpenAI-style assistant message content arrays. */
export function extractAiMessageText(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  const parts = content
    .map((part) => {
      if (typeof part === "object" && part !== null && "text" in part) {
        const t = (part as { text?: string }).text;
        return typeof t === "string" ? t : "";
      }
      return "";
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Strip markdown code fences and leading "json" label from model output.
 */
function stripMarkdownJsonFence(raw: string): string {
  let s = raw.trim().replace(/^\uFEFF/, "");

  const closedFence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (closedFence) {
    return closedFence[1].trim();
  }

  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "");
    const endFence = s.lastIndexOf("```");
    if (endFence !== -1) {
      s = s.slice(0, endFence).trim();
    }
  }

  return s.trim();
}

/**
 * First complete top-level `{ ... }` using brace depth (ignores `{`/`}` inside strings).
 * Returns null if the object is not closed (truncated stream).
 */
function extractFirstBalancedJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        continue;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Parse JSON from model output that may include markdown fences, prose, or trailing text.
 */
export function parseAiJsonResponse(raw: string): unknown {
  let s = stripMarkdownJsonFence(raw);

  const balanced = extractFirstBalancedJsonObject(s);
  if (balanced) {
    try {
      return JSON.parse(balanced);
    } catch {
      /* fall through */
    }
  }

  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new SyntaxError(
        `Could not parse AI response as JSON (response may be truncated). Preview: ${s.slice(0, 200)}…`
      );
    }
    return JSON.parse(s.slice(start, end + 1));
  }
}
