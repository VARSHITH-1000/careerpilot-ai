import { unique } from "../utils/text";

export interface RoleProfile {
  role: TargetRole;
  /** Keywords that increase keyword & experience relevance weighting */
  coreKeywords: string[];
  /** Boosts for technical buckets (multipliers applied to detection coverage) */
  technicalFocus: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    cloudDevops: string[];
    aiMl: string[];
  };
  /** Relative importance of deterministic dimensions for this role (0–1, renormalized) */
  categoryEmphasis: Partial<Record<ScoreBreakdownKey, number>>;
}

const BASE_TECH = {
  languages: [
    "python", "javascript", "typescript", "java", "go", "golang", "c++", "csharp", "ruby", "swift", "kotlin", "rust",
  ],
  frameworks: [
    "react", "vue", "angular", "nextjs", "next.js", "nodejs", "node.js", "express", "django", "flask", "fastapi",
    "spring", "springboot", "rails", ".net", "nestjs",
  ],
  databases: [
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "dynamodb", "cassandra", "elasticsearch", "snowflake",
  ],
  cloudDevops: [
    "aws", "azure", "gcp", "kubernetes", "docker", "terraform", "ci", "cd", "github actions", "jenkins", "prometheus",
    "grafana", "lambda", "ec2", "s3", "cloudflare",
  ],
  aiMl: [
    "tensorflow", "pytorch", "keras", "scikit", "sklearn", "langchain", "huggingface", "llm", "gpt", "opencv", "mlflow",
    "spark", "pandas", "numpy",
  ],
};

export const ROLE_PROFILES: Record<TargetRole, RoleProfile> = {
  "Software Engineer": {
    role: "Software Engineer",
    coreKeywords: unique([
      "software", "engineering", "systems", "scalable", "api", "microservices", "testing", "code review", ...BASE_TECH.languages,
      ...BASE_TECH.frameworks,
    ]),
    technicalFocus: BASE_TECH,
    categoryEmphasis: {
      technicalSkills: 1.1,
      projectQuality: 1.05,
      atsCompatibility: 1,
      resumeFormatting: 1,
      keywordOptimization: 1,
      leadershipImpact: 0.95,
      experienceRelevance: 1,
    },
  },
  "ML Engineer": {
    role: "ML Engineer",
    coreKeywords: unique([
      "machine learning", "deep learning", "model", "training", "inference", "embedding", "evaluation", "experiment",
      "python", "pytorch", "tensorflow", "mlops", "deployment", "kubernetes", "gpu", "feature", "pipeline",
    ]),
    technicalFocus: {
      ...BASE_TECH,
      aiMl: unique([...BASE_TECH.aiMl, "jax", "wandb", "kubeflow", "sagemaker", "onnx"]),
    },
    categoryEmphasis: {
      technicalSkills: 1.15,
      projectQuality: 1.1,
      keywordOptimization: 1.05,
      experienceRelevance: 1,
      leadershipImpact: 0.9,
      atsCompatibility: 1,
      resumeFormatting: 1,
    },
  },
  "Data Scientist": {
    role: "Data Scientist",
    coreKeywords: unique([
      "statistics", "experiment", "a/b", "causal", "regression", "classification", "forecasting", "dashboard", "visualization",
      "sql", "python", "pandas", "jupyter", "insights", "hypothesis", "metric",
    ]),
    technicalFocus: {
      ...BASE_TECH,
      aiMl: unique([...BASE_TECH.aiMl, "tableau", "looker", "powerbi", "databricks", "etl", "airflow"]),
    },
    categoryEmphasis: {
      technicalSkills: 1.05,
      projectQuality: 1,
      keywordOptimization: 1.1,
      experienceRelevance: 1.05,
      leadershipImpact: 0.95,
      atsCompatibility: 1,
      resumeFormatting: 1,
    },
  },
  "Frontend Developer": {
    role: "Frontend Developer",
    coreKeywords: unique([
      "react", "typescript", "javascript", "css", "html", "accessibility", "a11y", "responsive", "webpack", "vite",
      "ui", "ux", "design system", "next", "graphql", "rest",
    ]),
    technicalFocus: {
      ...BASE_TECH,
      frameworks: unique([...BASE_TECH.frameworks, "tailwind", "storybook", "redux", "zustand", "svelte"]),
    },
    categoryEmphasis: {
      technicalSkills: 1.15,
      projectQuality: 1,
      keywordOptimization: 1.05,
      resumeFormatting: 1,
      experienceRelevance: 1,
      leadershipImpact: 0.95,
      atsCompatibility: 1,
    },
  },
  "Backend Developer": {
    role: "Backend Developer",
    coreKeywords: unique([
      "api", "rest", "graphql", "microservices", "sql", "nosql", "caching", "queue", "kafka", "redis", "latency",
      "throughput", "database", "transactions", "security", "oauth",
    ]),
    technicalFocus: {
      ...BASE_TECH,
      frameworks: unique([...BASE_TECH.frameworks, "grpc", "protobuf", "rabbitmq"]),
    },
    categoryEmphasis: {
      technicalSkills: 1.15,
      projectQuality: 1.05,
      keywordOptimization: 1,
      experienceRelevance: 1,
      leadershipImpact: 0.95,
      atsCompatibility: 1,
      resumeFormatting: 1,
    },
  },
  "Full Stack Developer": {
    role: "Full Stack Developer",
    coreKeywords: unique([
      ...BASE_TECH.languages,
      ...BASE_TECH.frameworks,
      "full stack", "fullstack", "api", "sql", "react", "node", "typescript", "cloud", "ci", "cd",
    ]),
    technicalFocus: BASE_TECH,
    categoryEmphasis: {
      technicalSkills: 1.08,
      projectQuality: 1,
      keywordOptimization: 1.05,
      experienceRelevance: 1,
      resumeFormatting: 1,
      leadershipImpact: 0.97,
      atsCompatibility: 1,
    },
  },
};

export function getRoleProfile(role: TargetRole): RoleProfile {
  return ROLE_PROFILES[role] ?? ROLE_PROFILES["Software Engineer"];
}

function renormalizeEmphasis(
  emphasis: Partial<Record<ScoreBreakdownKey, number>>
): Record<ScoreBreakdownKey, number> {
  const keys: ScoreBreakdownKey[] = [
    "atsCompatibility",
    "technicalSkills",
    "projectQuality",
    "resumeFormatting",
    "keywordOptimization",
    "leadershipImpact",
    "experienceRelevance",
  ];
  const base: Record<ScoreBreakdownKey, number> = {
    atsCompatibility: 1,
    technicalSkills: 1,
    projectQuality: 1,
    resumeFormatting: 1,
    keywordOptimization: 1,
    leadershipImpact: 1,
    experienceRelevance: 1,
  };
  for (const k of keys) {
    if (emphasis[k]) base[k] = emphasis[k]!;
  }
  const sum = keys.reduce((a, k) => a + base[k], 0) / keys.length;
  const out = { ...base };
  if (sum > 0) {
    for (const k of keys) {
      out[k] = Math.min(1.25, Math.max(0.85, base[k] / sum));
    }
  }
  return out;
}

export function emphasizedCategoryWeights(role: TargetRole): Record<ScoreBreakdownKey, number> {
  return renormalizeEmphasis(getRoleProfile(role).categoryEmphasis);
}
