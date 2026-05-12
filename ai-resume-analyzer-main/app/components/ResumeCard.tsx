import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";

const ResumeCard = ({ resume }: { resume: Resume }) => {
  const preview = resume.imageUrl ?? "";

  return (
    <Link to={`/resume/${resume.id}`} className="resume-card animate-in fade-in duration-1000">
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {resume.companyName && (
            <h2 className="break-words font-bold text-slate-900 dark:text-white">{resume.companyName}</h2>
          )}
          {resume.jobTitle && (
            <h3 className="break-words text-lg text-slate-500 dark:text-slate-400">{resume.jobTitle}</h3>
          )}
          {!resume.companyName && !resume.jobTitle && (
            <h2 className="font-bold text-slate-900 dark:text-white">Resume</h2>
          )}
        </div>
        <div className="flex-shrink-0">
          {resume.feedback && typeof resume.feedback === "object" && "overallScore" in resume.feedback ? (
            <ScoreCircle score={resume.feedback.overallScore} />
          ) : (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
              Processing
            </span>
          )}
        </div>
      </div>
      {preview ? (
        <div className="gradient-border animate-in fade-in duration-1000">
          <div className="h-full w-full">
            <img
              src={preview}
              alt="resume"
              className="h-[350px] max-sm:h-[200px] w-full object-cover object-top"
            />
          </div>
        </div>
      ) : null}
    </Link>
  );
};

export default ResumeCard;
