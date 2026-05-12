interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    targetRole?: TargetRole;
    /** Storage object path (server); optional when using signed URLs only */
    imagePath?: string;
    resumePath?: string;
    /** Signed URL for preview image (client) */
    imageUrl?: string;
    pdfUrl?: string;
    feedback: Feedback | "";
}

type TargetRole =
    | "Software Engineer"
    | "ML Engineer"
    | "Data Scientist"
    | "Frontend Developer"
    | "Backend Developer"
    | "Full Stack Developer";

type ScoreBreakdownKey =
    | "atsCompatibility"
    | "technicalSkills"
    | "projectQuality"
    | "resumeFormatting"
    | "keywordOptimization"
    | "leadershipImpact"
    | "experienceRelevance";

type CategoryDeterministicScores = Record<ScoreBreakdownKey, number>;

interface ImprovementRoadmapPhase {
    title: string;
    items: string[];
}

interface HybridScoringMeta {
    blendWeights: {
        deterministic: number;
        llm: number;
    };
    overallConfidence: number;
    categoryConfidence: Record<ScoreBreakdownKey, number>;
    deterministicScores: CategoryDeterministicScores;
    llmScores: CategoryDeterministicScores;
    reasoningTrace: string[];
    improvementRoadmap: ImprovementRoadmapPhase[];
    deterministicSignals: Partial<Record<ScoreBreakdownKey, string[]>>;
    skillDistribution: {
        label: string;
        matched: string[];
        weight: number;
    }[];
    keywordHeatmapBuckets: {
        phrase: string;
        count: number;
        weight: number;
    }[];
}

interface InsightItem {
    type: "good" | "improve";
    title: string;
    explanation: string;
}

interface ScoreCategory {
    score: number;
    confidence?: number;
    reasoning: string;
    weaknesses: string[];
    missingKeywords: string[];
    formattingIssues: string[];
    recruiterConcerns: string[];
    suggestions: {
        betterBullets: string[];
        strongerActionVerbs: string[];
        quantifiedImpact: string[];
        missingTechnologies: string[];
        missingATSKeywords: string[];
    };
    insights: InsightItem[];
}

interface Feedback {
    overallScore: number;
    targetRole: TargetRole;
    hybrid?: HybridScoringMeta;
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
        keywordDensity: {
            section: string;
            score: number;
        }[];
    };
    roleAnalysis: {
        role: TargetRole;
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
}
