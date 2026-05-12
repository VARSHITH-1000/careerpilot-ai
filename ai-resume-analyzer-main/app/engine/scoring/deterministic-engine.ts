import { emphasizedCategoryWeights, getRoleProfile } from "../role-profiles/profiles";
import { countOccurrences, lower, normalizeResumeText, tokenizeMeaningful, unique } from "../utils/text";

export interface DeterministicEngineResult {
  scores: CategoryDeterministicScores;
  signals: Partial<Record<ScoreBreakdownKey, string[]>>;
  skillDistribution: {
    label: string;
    matched: string[];
    weight: number;
  }[];
  keywordBuckets: {
    phrase: string;
    count: number;
    weight: number;
  }[];
}

const SECTION_PATTERNS: { key: keyof SectionPresence; patterns: RegExp[] }[] = [
  {
    key: "summary",
    patterns: [/^\s*(professional\s*)?(summary|objective|profile|about\s*me)\s*:?\s*$/im, /\b(summary|objective)\b/i],
  },
  { key: "skills", patterns: [/^\s*(technical\s*)?skills\s*:?\s*$/im, /\bskills\b/i] },
  { key: "projects", patterns: [/^\s*projects?\s*:?\s*$/im, /\b(key\s*)?projects?\b/i] },
  { key: "experience", patterns: [/^\s*(work\s*)?experience\s*:?\s*$/im, /\bexperience\b/i] },
  { key: "education", patterns: [/^\s*education\s*:?\s*$/im, /\beducation\b/i] },
  { key: "certifications", patterns: [/^\s*certifications?\s*:?\s*$/im, /\bcertifications?\b/i] },
];

type SectionPresence = {
  summary: boolean;
  skills: boolean;
  projects: boolean;
  experience: boolean;
  education: boolean;
  certifications: boolean;
};

function detectSections(text: string): SectionPresence {
  const t = normalizeResumeText(text);
  const presence: SectionPresence = {
    summary: false,
    skills: false,
    projects: false,
    experience: false,
    education: false,
    certifications: false,
  };
  for (const { key, patterns } of SECTION_PATTERNS) {
    for (const re of patterns) {
      if (re.test(t)) {
        presence[key] = true;
        break;
      }
    }
  }
  return presence;
}

function firstMatchIndex(text: string, regex: RegExp): number {
  const m = text.match(regex);
  return m?.index ?? -1;
}

function scoreStructure(text: string): { score: number; signals: string[] } {
  const t = normalizeResumeText(text);
  const sec = detectSections(t);
  const keys = Object.keys(sec) as (keyof SectionPresence)[];
  const present = keys.filter((k) => sec[k]).length;
  let score = (present / keys.length) * 70;

  const orderIdeal: (keyof SectionPresence)[] = [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
  ];
  const positions = orderIdeal.map((k) => {
    const pats = SECTION_PATTERNS.find((s) => s.key === k)?.patterns[0];
    return pats ? firstMatchIndex(t, pats) : -1;
  });
  const valid = positions.map((p) => (p >= 0 ? p : Infinity));
  let ordered = true;
  for (let i = 1; i < valid.length; i++) {
    if (valid[i - 1] !== Infinity && valid[i] !== Infinity && valid[i] < valid[i - 1]) {
      ordered = false;
      break;
    }
  }
  if (ordered && present >= 4) score += 20;
  else if (!ordered) score -= 10;

  const lines = t.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const avgLen =
    lines.length > 0 ? lines.reduce((a, l) => a + l.split(/\s+/).length, 0) / lines.length : 40;
  if (avgLen > 32) score -= 10;
  if (avgLen < 28 && avgLen > 8) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const signals: string[] = [];
  keys.forEach((k) => {
    if (!sec[k]) signals.push(`Missing or unclear "${k}" section heading.`);
  });
  if (!ordered) signals.push("Section ordering may confuse ATS parsers.");
  return { score, signals };
}

function scoreKeywords(
  resume: string,
  jobDescription: string,
  role: TargetRole
): { score: number; signals: string[]; buckets: DeterministicEngineResult["keywordBuckets"] } {
  const profile = getRoleProfile(role);
  const r = lower(normalizeResumeText(resume));
  const jdTerms = unique(tokenizeMeaningful(jobDescription)).slice(0, 35);
  const roleTerms = unique([...profile.coreKeywords.map(lower), ...jdTerms]).slice(0, 55);

  let hits = 0;
  let total = jdTerms.length;
  const missing: string[] = [];
  for (const term of jdTerms) {
    const c = countOccurrences(r, term);
    if (c > 0) hits++;
    else if (term.length > 4) missing.push(term);
  }
  let jdRatio = total > 0 ? hits / total : 0.5;

  let roleHits = 0;
  for (const term of roleTerms) {
    if (term.includes(" ")) {
      if (r.includes(term)) roleHits++;
    } else if (countOccurrences(r, term) > 0) roleHits++;
  }
  const roleRatio = roleTerms.length ? roleHits / roleTerms.length : 0.5;

  let score = Math.round(48 + 42 * (0.55 * jdRatio + 0.45 * Math.min(roleRatio * 1.2, 1)));
  score = Math.max(0, Math.min(100, score));

  const buckets = jdTerms.slice(0, 12).map((phrase) => ({
    phrase,
    count: countOccurrences(r, phrase),
    weight: phrase.length > 5 ? 1.2 : 1,
  }));

  const signals: string[] = [];
  if (jdRatio < 0.35) signals.push("Job description terminology is lightly represented in your resume.");
  if (missing.length) signals.push(`Consider mirroring ATS/JD phrases such as: ${missing.slice(0, 8).join(", ")}.`);

  return { score, signals, buckets };
}

function scoreTechnical(text: string, role: TargetRole): { score: number; matched: DeterministicEngineResult["skillDistribution"] } {
  const profile = getRoleProfile(role);
  const t = lower(normalizeResumeText(text));

  type BucketKey = keyof typeof profile.technicalFocus;
  const buckets: BucketKey[] = ["languages", "frameworks", "databases", "cloudDevops", "aiMl"];
  const dist: DeterministicEngineResult["skillDistribution"] = [];
  let totalWeight = 0;
  let totalHit = 0;

  const weights: Record<BucketKey, number> = {
    languages: 1.05,
    frameworks: 1,
    databases: 0.95,
    cloudDevops: 0.95,
    aiMl:
      role === "ML Engineer" || role === "Data Scientist"
        ? 1.35
        : role === "Frontend Developer"
          ? 0.75
          : 1,
  };

  for (const b of buckets) {
    const list = profile.technicalFocus[b];
    const matched: string[] = [];
    for (const term of list) {
      const needle = lower(term.replace(/\s+/g, " "));
      if (needle.includes(" ")) {
        if (t.includes(needle)) matched.push(term);
      } else if (countOccurrences(t, needle) > 0) {
        matched.push(term);
      }
    }
    const coverage = list.length ? Math.min(matched.length / Math.min(list.length, 14), 1) : 0;
    totalWeight += weights[b];
    totalHit += coverage * weights[b];

    dist.push({
      label: b.replace(/([A-Z])/g, " $1").trim(),
      matched,
      weight: weights[b],
    });
  }

  const score = Math.round(100 * (totalHit / Math.max(totalWeight, 1)));
  return { score: Math.min(100, Math.max(0, score)), matched: dist };
}

const ACTION_VERBS = [
  "led", "owned", "built", "implemented", "designed", "optimized", "reduced", "increased", "launched", "automated",
  "scaled", "migrated", "architected", "shipped",
];

const DEPTH_TERMS = [
  "distributed", "microservices", "kubernetes", "kafka", "postgresql", "sharding", "load balancing", "observability",
  "sla", "slo", "incident",
];

function scoreProjects(text: string): { score: number; signals: string[] } {
  const t = lower(normalizeResumeText(text));
  let points = 0;
  const signals: string[] = [];

  if (/\d+\s*%/.test(t)) points += 18;
  else signals.push("Add explicit percentage deltas to quantify impact.");
  if (/\$\d|[\d,]+\s*(usd|million|thousand|k|m)\b|\d+k\b|\d+m\b|\d+\+?\s*users/.test(t)) points += 16;
  else signals.push("Add revenue, cost savings, adoption, or user-scale metrics.");

  let verbs = 0;
  for (const v of ACTION_VERBS) {
    const boundary = new RegExp(`(^|[^a-z])${v}([^a-z]|$)`, "i");
    if (boundary.test(t)) verbs++;
  }
  points += Math.min(22, verbs * 4);

  let depth = 0;
  for (const d of DEPTH_TERMS) {
    if (t.includes(d)) depth++;
  }
  points += Math.min(22, depth * 5);

  if (!/\bprojects?\b/.test(t)) signals.push("Label a dedicated Projects section for clarity.");

  return { score: Math.min(100, Math.round(points)), signals };
}

function scoreAtsCompatibility(text: string): { score: number; signals: string[] } {
  const raw = normalizeResumeText(text);
  const t = lower(raw);

  let score = 55;
  const signals: string[] = [];

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(raw)) score += 15;
  else signals.push("Add a recognizable email contact line.");
  if (/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+\d[\d\s-]{10,}\b/.test(raw)) score += 8;

  const unusual = raw.match(/\u2588|\ufffd|\\u[a-fA-F0-9]{4}/g);
  if (unusual && unusual.length) {
    score -= 10;
    signals.push("Detected replacement characters — may hinder ATS plaintext extraction.");
  }

  if ((countOccurrences(t, "\u2022") + countOccurrences(t, "*")) > 0) score += 5;

  if (raw.includes("\t")) {
    signals.push("Tabs detected — consider simple bullet lists for parsers.");
    score -= 8;
  }

  // Multi-column heuristic: many very short newline-separated fragments
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const shortie = lines.filter((l) => l.length < 3).length;
  if (shortie > lines.length * 0.2 && lines.length > 18) {
    score -= 6;
    signals.push("Highly fragmented layout may indicate multi-column layout risk for parsers.");
  }

  return { score: Math.min(100, Math.max(0, Math.round(score))), signals };
}

function scoreProfessional(text: string): { score: number; signals: string[] } {
  const t = lower(normalizeResumeText(text));
  let hits = 0;
  const found: string[] = [];
  const checks: [string, RegExp][] = [
    ["GitHub profile", /\bgithub\.com\/[^\s]+\b/i],
    ["LinkedIn profile", /\blinkedin\.com\/[^\s]+\b/i],
    ["Deployments", /\bdeploy(ed|ment)?\b|\b(cd|ci)\b|vercel|netlify|railway|render\.com\b/i],
    ["Open-source", /\bopen\s*source\b|\bos\s+project\b|\bcontributions?\b/i],
    ["Leadership", /\b(lead|led|managed|mentored|owned)\s+/i],
  ];
  for (const [label, rx] of checks) {
    if (rx.test(t)) {
      hits++;
      found.push(label);
    }
  }
  const score = Math.min(100, hits * 22 + (found.includes("GitHub profile") ? 8 : 0));
  const signals = hits < 3 ? [`Surface professional proofs: portfolio, GitHub, LinkedIn — detected: ${found.join(", ") || "none"}.`] : [];

  return { score, signals };
}

function scoreExperienceRelevance(resume: string, jobDescription: string): { score: number; signals: string[] } {
  const r = lower(normalizeResumeText(resume));
  const jd = tokenizeMeaningful(jobDescription);
  const uniq = unique(jd).filter((w) => w.length > 3).slice(0, 45);
  if (!uniq.length) {
    return { score: 55, signals: ["Provide job description keywords to score role alignment objectively."] };
  }

  let hit = 0;
  for (const w of uniq) {
    if (countOccurrences(r, w) > 0) hit++;
  }
  const overlap = hit / uniq.length;

  let score = Math.round(30 + overlap * 60);
  if (/\bexperience\b|\bemployment\b|\bwork\s+history\b/i.test(resume)) score += 5;
  if (/\d+\+?\s*years\b|\d+yrs\b|\d+(?:\.\d)?\s+years\b/i.test(lower(resume))) score += 5;

  score = Math.min(100, Math.round(score));

  const signals: string[] = [];
  if (overlap < 0.25) signals.push("Low lexical overlap between resume and JD — recruiter match may skew weak.");
  return { score, signals };
}

/** Mild tilt toward role-critical dimensions without blowing past 0–100. */
function applyRoleEmphasis(
  scores: CategoryDeterministicScores,
  emphasis: Record<ScoreBreakdownKey, number>
): CategoryDeterministicScores {
  const out = {} as CategoryDeterministicScores;
  (Object.keys(scores) as ScoreBreakdownKey[]).forEach((k) => {
    const tilt = emphasis[k] ?? 1;
    out[k] = Math.max(0, Math.min(100, Math.round(scores[k] * tilt)));
  });
  return out;
}

export function runDeterministicEngine(
  resumeText: string,
  jobDescription: string,
  targetRole: TargetRole
): DeterministicEngineResult {
  const struct = scoreStructure(resumeText);
  const kw = scoreKeywords(resumeText, jobDescription, targetRole);
  const tech = scoreTechnical(resumeText, targetRole);
  const proj = scoreProjects(resumeText);
  const ats = scoreAtsCompatibility(resumeText);
  const prof = scoreProfessional(resumeText);
  const exp = scoreExperienceRelevance(resumeText, jobDescription);

  const raw: CategoryDeterministicScores = {
    resumeFormatting: struct.score,
    keywordOptimization: kw.score,
    technicalSkills: tech.score,
    projectQuality: proj.score,
    atsCompatibility: ats.score,
    leadershipImpact: prof.score,
    experienceRelevance: exp.score,
  };

  const emphasis = emphasizedCategoryWeights(targetRole);
  const scores = applyRoleEmphasis(raw, emphasis);

  const signals: Partial<Record<ScoreBreakdownKey, string[]>> = {
    resumeFormatting: struct.signals,
    keywordOptimization: kw.signals,
    technicalSkills:
      tech.score < 60
        ? ["Increase explicit mentions of toolchain items aligned with the target role."]
        : [],
    projectQuality: proj.signals,
    atsCompatibility: ats.signals,
    leadershipImpact: prof.signals,
    experienceRelevance: exp.signals,
  };

  return {
    scores,
    signals,
    skillDistribution: tech.matched,
    keywordBuckets: kw.buckets,
  };
}
