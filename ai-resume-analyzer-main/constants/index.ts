export const AIResponseFormat = `
interface ScoreCategory {
  score: number; // 0-100
  reasoning: string;
  weaknesses: string[]; // minimum 2
  missingKeywords: string[]; // include ATS and domain keywords
  formattingIssues: string[]; // specific visual or parsing issues
  recruiterConcerns: string[]; // what may block interview shortlisting
  suggestions: {
    betterBullets: string[]; // rewrite examples with stronger language
    strongerActionVerbs: string[]; // list of verbs to improve impact
    quantifiedImpact: string[]; // examples with metrics
    missingTechnologies: string[]; // tools/frameworks to include
    missingATSKeywords: string[]; // exact keywords missing
  };
  insights: {
    type: "good" | "improve";
    title: string;
    explanation: string;
  }[];
}

interface Feedback {
  overallScore: number; // 0-100
  targetRole: "Software Engineer" | "ML Engineer" | "Data Scientist" | "Frontend Developer" | "Backend Developer" | "Full Stack Developer";
  scoreBreakdown: {
    atsCompatibility: ScoreCategory;
    technicalSkills: ScoreCategory;
    projectQuality: ScoreCategory;
    resumeFormatting: ScoreCategory;
    keywordOptimization: ScoreCategory;
    leadershipImpact: ScoreCategory;
    experienceRelevance: ScoreCategory;
  };
  heatmap: {
    strongSections: string[];
    weakSections: string[];
    keywordDensity: { section: string; score: number }[]; // 0-100
  };
roleAnalysis: {
    role: "Software Engineer" | "ML Engineer" | "Data Scientist" | "Frontend Developer" | "Backend Developer" | "Full Stack Developer";
    matchScore: number; // 0-100
    jdMatchPercentage: number; // 0-100
    recruiterImpressionScore: number; // 0-100
    hiringReadinessScore: number; // 0-100
    aiConfidenceScore: number; // 0-100
    fitSummary: string;
    gaps: string[];
    missingSkills: string[];
    missingAtsKeywords: string[];
    recommendations: string[];
  };
  interviewReadiness: {
    technicalReadiness: number; // 0-100
    dsaReadiness: number; // 0-100
    communicationReadiness: number; // 0-100
    aiMlReadiness: number; // 0-100
    summary: string;
  };
  recruiterInsights: {
    strengths: string[];
    hiringConcerns: string[];
    recommendedImprovements: string[];
    atsOptimizationInsights: string[];
  };
}`;

export const prepareInstructions = ({
  jobTitle,
  jobDescription,
  targetRole,
}: {
  jobTitle: string;
  jobDescription: string;
  targetRole: TargetRole;
}) =>
  `You are an expert ATS + recruiter intelligence assistant.
Analyze this resume as a premium explainable AI career intelligence engine.
This product blends your output with separate measurable (deterministic) parsers; your numeric scores are contextual judgments used for the LLM portion — still make them defensible and calibrated.
Do not provide generic scoring.
Every score must include reasoning, weaknesses, missing keywords, formatting issues, and recruiter concerns.
Keep scoring strict and realistic.
Use this target role heavily in your analysis: ${targetRole}
Job title provided by user: ${jobTitle}
Job description provided by user: ${jobDescription}

Detailed requirements:
1) Score breakdown categories:
- ATS Compatibility
- Technical Skills
- Project Quality
- Resume Formatting (check grammar, style, section headers)
- Keyword Optimization
- Leadership & Impact
- Experience Relevance (evaluate industry readiness and technical depth)

2) Provide explicit reasoning for each category, including:
- strengths and weaknesses
- missing keywords (skills and ATS)
- formatting and grammar issues
- recruiter concerns

3) Provide actionable recommendations:
- better bullet point recommendations
- stronger action verbs (analyze action verb usage)
- quantified impact suggestions
- missing technologies
- missing ATS keywords

4) Provide heatmap details:
- strong sections
- weak sections
- keyword density by section (0-100)

5) Provide target-role analysis for the specified role:
- role match score, JD match percentage, recruiter impression score, hiring readiness score, AI confidence score
- fit summary (feel like a recruiter + AI career coach analyzed it)
- key gaps, missing skills, missing ATS keywords
- recommendations

6) Provide interview readiness scoring:
- technical readiness
- DSA readiness
- communication readiness
- AI/ML readiness
- summary

7) Provide recruiter style insights:
- strengths
- hiring concerns
- recommended improvements
- ATS optimization insights

Return JSON only in this exact schema:
${AIResponseFormat}
No markdown. No markdown code fences. No backticks. No prose before or after the JSON.`;

// ─────────────────────────────────────────────────────────────────────────────
// SLIM INSIGHTS PROMPT — used by the fast hybrid pipeline.
// Scores come from the deterministic engine; LLM only adds contextual reasoning.
// ─────────────────────────────────────────────────────────────────────────────

/** JSON schema for the slim contextual output (no numeric scoring). */
export const InsightsResponseFormat = `{
  "heatmap": {
    "strongSections": string[],
    "weakSections": string[],
    "keywordDensity": [{ "section": string, "score": number }]
  },
"roleAnalysis": {
    "matchScore": number,
    "jdMatchPercentage": number,
    "recruiterImpressionScore": number,
    "hiringReadinessScore": number,
    "aiConfidenceScore": number,
    "fitSummary": string,
    "gaps": string[],
    "missingSkills": string[],
    "missingAtsKeywords": string[],
    "recommendations": string[]
  },
  "interviewReadiness": {
    "technicalReadiness": number,
    "dsaReadiness": number,
    "communicationReadiness": number,
    "aiMlReadiness": number,
    "summary": string
  },
  "recruiterInsights": {
    "strengths": string[],
    "hiringConcerns": string[],
    "recommendedImprovements": string[],
    "atsOptimizationInsights": string[]
  },
  "categoryInsights": {
    "atsCompatibility":     { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "technicalSkills":      { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "projectQuality":       { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "resumeFormatting":     { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "keywordOptimization":  { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "leadershipImpact":     { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } },
    "experienceRelevance":  { "reasoning": string, "weaknesses": string[], "missingKeywords": string[], "recruiterConcerns": string[], "suggestions": { "betterBullets": string[], "strongerActionVerbs": string[], "quantifiedImpact": string[], "missingTechnologies": string[], "missingATSKeywords": string[] } }
  }
}`;

const RESUME_CHAR_LIMIT = 3000;
const JD_CHAR_LIMIT = 800;

export const prepareInsightsPrompt = ({
  resumeText,
  jobTitle,
  jobDescription,
  targetRole,
  deterministicScores,
}: {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
  targetRole: TargetRole;
  deterministicScores: Record<string, number>;
}): string => {
  const resumeSnippet = resumeText.slice(0, RESUME_CHAR_LIMIT);
  const jdSnippet = jobDescription.slice(0, JD_CHAR_LIMIT);
  const scoresJson = JSON.stringify(deterministicScores);

  return `You are a senior technical recruiter and ATS intelligence engine.
The resume below has already been scored by a deterministic parser. Your job is NOT to re-score — instead, provide deep contextual reasoning, recruiter insights, and specific improvement suggestions. Output should feel like a recruiter + AI career coach analyzed the resume. Analyze grammar/style, missing skills, action verbs, and technical depth. Provide recruiter impression score, hiring readiness score, JD match percentage, missing skills, and AI confidence score.

TARGET ROLE: ${targetRole}
JOB TITLE: ${jobTitle}
JOB DESCRIPTION (truncated): ${jdSnippet}

DETERMINISTIC SCORES (already computed — use as calibration context):
${scoresJson}

RESUME TEXT:
${resumeSnippet}

Return ONLY valid JSON matching this schema exactly. No markdown, no prose, no code fences:
${InsightsResponseFormat}`;
};
