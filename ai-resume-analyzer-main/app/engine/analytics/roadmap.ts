import type { DeterministicEngineResult } from "../scoring/deterministic-engine";

/** Human-readable breakdown labels used in dashboards. */
export const BREAKDOWN_LABELS: Record<ScoreBreakdownKey, string> = {
  atsCompatibility: "ATS Compatibility",
  technicalSkills: "Technical Skills",
  projectQuality: "Project Quality",
  resumeFormatting: "Resume Structure",
  keywordOptimization: "Keyword Optimization",
  leadershipImpact: "Professional readiness",
  experienceRelevance: "Experience relevance",
};

function topSignals(det: DeterministicEngineResult, limit: number): string[] {
  const out: string[] = [];
  for (const [, list] of Object.entries(det.signals)) {
    if (Array.isArray(list)) out.push(...list);
  }
  return out.slice(0, limit);
}

export function buildImprovementRoadmap(
  det: DeterministicEngineResult,
  llmWeaknesses: string[]
): ImprovementRoadmapPhase[] {
  const foundation = topSignals(det, 4);
  const phase1: ImprovementRoadmapPhase = {
    title: "Foundation — ATS & structure",
    items: [
      ...foundation.filter((s) => /section|parser|contact|tab|layout/i.test(s)).slice(0, 3),
      "Standardize headings (Summary, Skills, Experience, Projects, Education).",
    ].filter(Boolean),
  };

  const phase2: ImprovementRoadmapPhase = {
    title: "Evidence — impact & depth",
    items: [
      ...foundation.filter((s) => /metric|percentage|project|verbs/i.test(s)).slice(0, 3),
      ...llmWeaknesses.slice(0, 2),
    ].filter(Boolean),
  };

  const phase3: ImprovementRoadmapPhase = {
    title: "Positioning — role & keywords",
    items: [
      ...foundation.filter((s) => /keyword|JD|overlap|terminology/i.test(s)).slice(0, 3),
      "Mirror high-signal phrases from the job description in your experience bullets.",
    ].filter(Boolean),
  };

  return [phase1, phase2, phase3].map((p) => ({
    ...p,
    items: uniqueStrings(p.items).slice(0, 6),
  }));
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    const t = i.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function buildReasoningTrace(
  det: DeterministicEngineResult,
  resumeTextLength: number
): string[] {
  const trace: string[] = [
    `Deterministic scan: resume text length ≈ ${resumeTextLength} characters`,
    `Structure score ${det.scores.resumeFormatting}/100`,
    `Keyword coverage vs JD ${det.scores.keywordOptimization}/100`,
    `Technical breadth ${det.scores.technicalSkills}/100`,
    `Project evidence ${det.scores.projectQuality}/100`,
    `ATS plaintext health ${det.scores.atsCompatibility}/100`,
    `Professional proofs ${det.scores.leadershipImpact}/100`,
    `JD overlap ${det.scores.experienceRelevance}/100`,
  ];
  return trace;
}
