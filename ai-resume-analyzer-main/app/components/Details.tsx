import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";

const ScoreBadge = ({ score }: { score: number }) => {
  return (
      <div
          className={cn(
              "flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px]",
              score > 69
                  ? "bg-badge-green"
                  : score > 39
                      ? "bg-badge-yellow"
                      : "bg-badge-red"
          )}
      >
        <img
            src={score > 69 ? "/icons/check.svg" : "/icons/warning.svg"}
            alt="score"
            className="size-4"
        />
        <p
            className={cn(
                "text-sm font-medium",
                score > 69
                    ? "text-badge-green-text"
                    : score > 39
                        ? "text-badge-yellow-text"
                        : "text-badge-red-text"
            )}
        >
          {score}/100
        </p>
      </div>
  );
};

const CategoryHeader = ({
                          title,
                          categoryScore,
                        }: {
  title: string;
  categoryScore: number;
}) => {
  return (
      <div className="flex flex-row gap-4 items-center py-2">
        <p className="text-2xl font-semibold">{title}</p>
        <ScoreBadge score={categoryScore} />
      </div>
  );
};

const CategoryContent = ({
                           tips,
                         }: {
  tips: InsightItem[];
}) => {
  return (
      <div className="flex flex-col gap-4 items-center w-full">
        <div className="bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4">
          {tips.map((tip, index) => (
              <div className="flex flex-row gap-2 items-center" key={index}>
                <img
                    src={
                      tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"
                    }
                    alt="score"
                    className="size-5"
                />
                  <p className="text-xl text-gray-500 ">{tip.title}</p>
              </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 w-full">
          {tips.map((tip, index) => (
              <div
                  key={index + tip.title}
                  className={cn(
                      "flex flex-col gap-2 rounded-2xl p-4",
                      tip.type === "good"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                  )}
              >
                <div className="flex flex-row gap-2 items-center">
                  <img
                      src={
                        tip.type === "good"
                            ? "/icons/check.svg"
                            : "/icons/warning.svg"
                      }
                      alt="score"
                      className="size-5"
                  />
                  <p className="text-xl font-semibold">{tip.title}</p>
                </div>
                <p>{tip.explanation}</p>
              </div>
          ))}
        </div>
      </div>
  );
};

const Details = ({ feedback }: { feedback: Feedback }) => {
  const breakdown = feedback.scoreBreakdown;
  return (
      <div className="flex flex-col gap-4 w-full">
        <Accordion>
          <AccordionItem id="ats-compatibility">
            <AccordionHeader itemId="ats-compatibility">
              <CategoryHeader
                  title="ATS Compatibility"
                  categoryScore={breakdown.atsCompatibility.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="ats-compatibility">
              <CategoryContent tips={breakdown.atsCompatibility.insights} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="technical-skills">
            <AccordionHeader itemId="technical-skills">
              <CategoryHeader
                  title="Technical Skills"
                  categoryScore={breakdown.technicalSkills.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="technical-skills">
              <CategoryContent tips={breakdown.technicalSkills.insights} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="project-quality">
            <AccordionHeader itemId="project-quality">
              <CategoryHeader
                  title="Project Quality"
                  categoryScore={breakdown.projectQuality.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="project-quality">
              <CategoryContent tips={breakdown.projectQuality.insights} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="experience-relevance">
            <AccordionHeader itemId="experience-relevance">
              <CategoryHeader
                  title="Experience Relevance"
                  categoryScore={breakdown.experienceRelevance.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="experience-relevance">
              <CategoryContent tips={breakdown.experienceRelevance.insights} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
  );
};

export default Details;
