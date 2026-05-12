import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";
import { cn } from "~/lib/utils";
import ScoreRadarChart from "~/components/analytics/ScoreRadarChart";
import SkillBucketChart from "~/components/analytics/SkillBucketChart";

/** Short radar labels — full names still appear in breakdown cards below. */
const radarShortLabels = [
  "ATS",
  "Technical",
  "Projects",
  "Structure",
  "Keywords",
  "Leadership",
  "Experience",
];

const breakdownConfig: { key: keyof Feedback["scoreBreakdown"]; label: string }[] = [
  { key: "atsCompatibility", label: "ATS Compatibility" },
  { key: "technicalSkills", label: "Technical Skills" },
  { key: "projectQuality", label: "Project Quality" },
  { key: "resumeFormatting", label: "Resume Formatting" },
  { key: "keywordOptimization", label: "Keyword Optimization" },
  { key: "leadershipImpact", label: "Leadership & Impact" },
  { key: "experienceRelevance", label: "Experience Relevance" },
];

const readinessConfig: { key: keyof Feedback["interviewReadiness"]; label: string }[] = [
  { key: "technicalReadiness", label: "Technical Readiness" },
  { key: "dsaReadiness", label: "DSA Readiness" },
  { key: "communicationReadiness", label: "Communication Readiness" },
  { key: "aiMlReadiness", label: "AI/ML Readiness" },
];

const HeatBar = ({ label, score }: { label: string; score: number }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
      <span>{label}</span>
      <span>{score}%</span>
    </div>
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full ${
          score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
        }`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

const PillList = ({
  items,
  className,
}: {
  items: string[];
  className: string;
}) => (
    <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <span key={item} className={cn("text-sm px-3 py-1 rounded-full", className)}>
        {item}
      </span>
    ))}
  </div>
);

const IntelligenceDashboard = ({ feedback }: { feedback: Feedback }) => {
  const blendedValues = breakdownConfig.map((c) => feedback.scoreBreakdown[c.key].score);
  const det = feedback.hybrid?.deterministicScores;
  const llmOnly = feedback.hybrid?.llmScores;

  return (
    <div className="flex flex-col gap-6 w-full">
      <section id="next-section-overview" className="intelligence-card scroll-mt-28">
        <div className="flex items-center gap-6">
          <ScoreGauge score={feedback.overallScore} />
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-black">Hybrid resume intelligence score</h3>
            <p className="text-gray-600">
              Target role: <span className="font-semibold text-black">{feedback.targetRole}</span>
            </p>
            <p className="text-sm text-gray-500">
              Measurable parsers plus contextual AI: consistent baselines with recruiter-grade narrative insights.
            </p>
          </div>
        </div>
      </section>

      {feedback.hybrid && (
        <section id="next-section-hybrid" className="intelligence-card intelligence-card-accent scroll-mt-28">
          <h3 className="intelligence-title">Hybrid ATS engine</h3>
          <p className="text-sm text-gray-600 mb-4">
            Final category scores blend{" "}
            <span className="font-semibold text-indigo-700">
              {(feedback.hybrid.blendWeights.deterministic * 100).toFixed(0)}%
            </span>{" "}
            deterministic metrics with{" "}
            <span className="font-semibold text-indigo-700">
              {(feedback.hybrid.blendWeights.llm * 100).toFixed(0)}%
            </span>{" "}
            contextual LLM judgment.
          </p>
          <HeatBar label="Model confidence — overall hybrid agreement" score={feedback.hybrid.overallConfidence} />
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="intelligence-subcard">
              <p className="intelligence-kicker mb-2">Deterministic baseline (measurable)</p>
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {breakdownConfig.map((categoryConfig) => (
                  <div key={`d-${categoryConfig.key}`} className="flex justify-between text-sm">
                    <span className="text-gray-700">{categoryConfig.label}</span>
                    <span className="font-medium text-black">
                      {det?.[categoryConfig.key] ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="intelligence-subcard">
              <p className="intelligence-kicker mb-2">LLM contextual (pre-blend)</p>
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {breakdownConfig.map((categoryConfig) => (
                  <div key={`l-${categoryConfig.key}`} className="flex justify-between text-sm">
                    <span className="text-gray-700">{categoryConfig.label}</span>
                    <span className="font-medium text-black">
                      {llmOnly?.[categoryConfig.key] ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid lg:grid-cols-2 gap-6">
            <div>
              <p className="intelligence-kicker mb-2">Reasoning trace</p>
              <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1 max-h-[200px] overflow-y-auto">
                {feedback.hybrid.reasoningTrace.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
            <div id="next-section-roadmap" className="scroll-mt-28">
              <p className="intelligence-kicker mb-2">Improvement roadmap</p>
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {feedback.hybrid.improvementRoadmap.map((phase) => (
                  <div key={phase.title}>
                    <p className="text-sm font-semibold text-black">{phase.title}</p>
                    <ul className="intelligence-list !mt-1">
                      {phase.items.slice(0, 5).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <article id="next-section-radar" className="intelligence-card scroll-mt-28">
          <h3 className="intelligence-title">Category radar — blended scores</h3>
          <p className="text-sm text-gray-600 mb-2">
            Radar shows the hybrid category profile after deterministic + contextual fusion.
          </p>
          <ScoreRadarChart labels={radarShortLabels} values={blendedValues} />
        </article>
        <article className="intelligence-card">
          <h3 className="intelligence-title">Skill distribution (deterministic)</h3>
          <SkillBucketChart buckets={feedback.hybrid?.skillDistribution ?? []} />
        </article>
      </section>

      <section id="next-section-breakdown" className="intelligence-card scroll-mt-28">
        <h3 className="intelligence-title">Detailed Score Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {breakdownConfig.map((categoryConfig) => {
            const category = feedback.scoreBreakdown[categoryConfig.key];
            return (
              <article key={categoryConfig.key} className="intelligence-subcard">
                <div className="flex flex-wrap justify-between gap-3 items-center">
                  <p className="font-semibold text-black">{categoryConfig.label}</p>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <ScoreBadge score={category.score} />
                    {category.confidence !== undefined ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        Confidence {category.confidence}%
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{category.reasoning}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="intelligence-kicker">Weaknesses</p>
                    <ul className="intelligence-list">
                      {category.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="intelligence-kicker">Recruiter Concerns</p>
                    <ul className="intelligence-list">
                      {category.recruiterConcerns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="intelligence-kicker">Missing Keywords</p>
                    <PillList items={category.missingKeywords} className="bg-amber-50 text-amber-700" />
                  </div>
                  <div>
                    <p className="intelligence-kicker">Formatting Issues</p>
                    <ul className="intelligence-list">
                      {category.formattingIssues.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="intelligence-kicker">Actionable Improvements</p>
                  <ul className="intelligence-list">
                    {category.suggestions.betterBullets.slice(0, 2).map((item) => (
                      <li key={item}>Bullet: {item}</li>
                    ))}
                    {category.suggestions.quantifiedImpact.slice(0, 1).map((item) => (
                      <li key={item}>Metrics: {item}</li>
                    ))}
                    {category.suggestions.missingTechnologies.slice(0, 1).map((item) => (
                      <li key={item}>Technology: Add {item}</li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <PillList
                      items={category.suggestions.strongerActionVerbs}
                      className="bg-blue-50 text-blue-700"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <article id="next-section-heatmap" className="intelligence-card scroll-mt-28">
          <h3 className="intelligence-title">Resume Heatmap</h3>
          <p className="text-sm text-gray-600 mb-4">
            Keyword density and section-level strength reveal where ATS and recruiters may struggle.
          </p>
          <div className="space-y-3">
            {feedback.heatmap.keywordDensity.map((item) => (
              <HeatBar key={item.section} label={item.section} score={item.score} />
            ))}
          </div>
          <div className="mt-5">
            <p className="intelligence-kicker">Strong Sections</p>
            <PillList items={feedback.heatmap.strongSections} className="bg-green-50 text-green-700" />
          </div>
          <div className="mt-4">
            <p className="intelligence-kicker">Weak Sections</p>
            <PillList items={feedback.heatmap.weakSections} className="bg-red-50 text-red-700" />
          </div>
          {feedback.hybrid?.keywordHeatmapBuckets && feedback.hybrid.keywordHeatmapBuckets.length > 0 ? (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="intelligence-title !text-lg !mb-2">JD keyword density (measurable)</p>
              <div className="space-y-2">
                {feedback.hybrid.keywordHeatmapBuckets.slice(0, 8).map((b) => (
                  <HeatBar
                    key={b.phrase}
                    label={`“${b.phrase}”`}
                    score={Math.min(
                      100,
                      Math.round(b.count >= 6 ? 95 : b.count >= 4 ? 80 : b.count >= 2 ? 60 : 25 + b.count * 15)
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article id="next-section-role" className="intelligence-card scroll-mt-28">
          <h3 className="intelligence-title">Target Role Intelligence</h3>
          <div className="flex items-center justify-between">
            <p className="text-black font-semibold">{feedback.roleAnalysis.role}</p>
            <ScoreBadge score={feedback.roleAnalysis.matchScore} />
          </div>
          <p className="text-sm text-gray-600 mt-3">{feedback.roleAnalysis.fitSummary}</p>
          <div className="mt-4">
            <p className="intelligence-kicker">Gaps</p>
            <ul className="intelligence-list">
              {feedback.roleAnalysis.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <p className="intelligence-kicker">Role-Based Recommendations</p>
            <ul className="intelligence-list">
              {feedback.roleAnalysis.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <article id="next-section-interview" className="intelligence-card scroll-mt-28">
          <h3 className="intelligence-title">Interview Readiness</h3>
          <div className="space-y-3">
            {readinessConfig.map((item) => {
              const score = feedback.interviewReadiness[item.key] as number;
              return <HeatBar key={item.key} label={item.label} score={score} />;
            })}
          </div>
          <p className="text-sm text-gray-600 mt-4">{feedback.interviewReadiness.summary}</p>
        </article>

        <article id="next-section-recruiter" className="intelligence-card scroll-mt-28">
          <h3 className="intelligence-title">Recruiter Insights Dashboard</h3>
          <div className="space-y-4">
            <div>
              <p className="intelligence-kicker">Strengths</p>
              <ul className="intelligence-list">
                {feedback.recruiterInsights.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="intelligence-kicker">Hiring Concerns</p>
              <ul className="intelligence-list">
                {feedback.recruiterInsights.hiringConcerns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="intelligence-kicker">Recommended Improvements</p>
              <ul className="intelligence-list">
                {feedback.recruiterInsights.recommendedImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="intelligence-kicker">ATS Optimization Insights</p>
              <ul className="intelligence-list">
                {feedback.recruiterInsights.atsOptimizationInsights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default IntelligenceDashboard;
