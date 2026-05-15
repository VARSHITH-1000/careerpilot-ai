import { runDeterministicEngine } from "~/engine/scoring/deterministic-engine";
import { getCachedDeterministic, setCachedDeterministic } from "~/engine/cache/resume-cache.server";
import { buildHybridFeedbackFromInsights } from "~/engine/services/hybrid-feedback";
import { prepareInsightsPrompt } from "../../../constants";
import { generateContextualInsights } from "~/modules/ai/llm.server";
import { getSupabaseService, RESUMES_BUCKET } from "~/modules/db/supabase.server";
import { logger } from "~/utils/logger.server";

const VALID_ROLES: TargetRole[] = [
  "Software Engineer",
  "ML Engineer",
  "Data Scientist",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
];

function asTargetRole(v: string): TargetRole {
  return VALID_ROLES.includes(v as TargetRole) ? (v as TargetRole) : "Software Engineer";
}

export async function runResumeAnalysisPipeline(params: {
  uid: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  targetRole: string;
  resumeText: string;
  pdf: File;
  previewImage: File;
}): Promise<{ id: string }> {
  logger.info(`Starting parallel resume analysis pipeline for user ${params.uid}`);

  const supabase = getSupabaseService();
  const targetRole = asTargetRole(params.targetRole);
  const id = crypto.randomUUID();
  const base = `${params.uid}/${id}`;
  const pdfPath = `${base}/resume.pdf`;
  const imagePath = `${base}/preview.png`;

let pdfBuf: Uint8Array;
  let imgBuf: Uint8Array;
  try {
    const [pBuf, iBuf] = await Promise.all([
      params.pdf.arrayBuffer().then((b) => new Uint8Array(b)),
      params.previewImage.arrayBuffer().then((b) => new Uint8Array(b)),
    ]);
    pdfBuf = pBuf;
    imgBuf = iBuf;
  } catch (error) {
    logger.error("Failed to read array buffers for upload", error);
    throw new Error("Failed to read file buffers. Please ensure the files are valid.");
  }

// ── Stage 1: Run deterministic engine (cached) ──────────────────────────────
  logger.info("Running deterministic engine (cached)");
  let detResult;
  try {
    detResult = getCachedDeterministic(params.resumeText, targetRole);
    if (!detResult) {
      detResult = runDeterministicEngine(params.resumeText, params.jobDescription, targetRole);
      setCachedDeterministic(params.resumeText, targetRole, detResult);
      logger.info("Deterministic result computed and cached");
    } else {
      logger.info("Deterministic result served from cache");
    }
  } catch (error) {
    logger.error("Deterministic engine failed", error);
    throw new Error("Failed to process resume text deterministically. Please ensure valid text is extracted.");
  }

  // Build slim AI prompt using pre-computed scores
  const insightsPrompt = prepareInsightsPrompt({
    resumeText: params.resumeText,
    jobTitle: params.jobTitle,
    jobDescription: params.jobDescription,
    targetRole,
    deterministicScores: detResult.scores as unknown as Record<string, number>,
  });

  // ── Stage 2: Parallelize storage upload + AI call ───────────────────────────
  logger.info("Starting parallel: storage upload + AI contextual insights");
  const [uploadResult, insights] = await Promise.allSettled([
    // Upload PDF + image in parallel
    Promise.all([
      supabase.storage.from(RESUMES_BUCKET).upload(pdfPath, pdfBuf, {
        contentType: "application/pdf",
        upsert: true,
      }),
      supabase.storage.from(RESUMES_BUCKET).upload(imagePath, imgBuf, {
        contentType: params.previewImage.type || "image/png",
        upsert: true,
      }),
    ]),
    generateContextualInsights(insightsPrompt),
  ]);

  // Handle storage errors
  if (uploadResult.status === "rejected") {
    throw new Error(`Storage upload failed: ${uploadResult.reason}`);
  }
  const [[pdfUp, imgUp]] = [uploadResult.value];
  if (pdfUp.error) throw new Error(`PDF upload failed: ${pdfUp.error.message}`);
  if (imgUp.error) throw new Error(`Image upload failed: ${imgUp.error.message}`);

  // Handle AI errors (graceful fallback — use deterministic-only)
  let contextualInsights = null;
  if (insights.status === "fulfilled") {
    contextualInsights = insights.value;
    logger.info("AI contextual insights received");
  } else {
    logger.warn(`AI insights failed (using deterministic-only fallback): ${insights.reason}`);
  }

  // ── Stage 3: Blend and save ─────────────────────────────────────────────────
  logger.info("Blending deterministic + contextual insights");
  const feedback = buildHybridFeedbackFromInsights(
    params.resumeText,
    params.jobDescription,
    targetRole,
    detResult,
    contextualInsights
  );

  logger.info("Saving to database");
  const { error: insertError } = await supabase.from("resumes").insert({
    id,
    user_id: params.uid,
    company_name: params.companyName || null,
    job_title: params.jobTitle || null,
    job_description: params.jobDescription || null,
    target_role: targetRole,
    pdf_path: pdfPath,
    image_path: imagePath,
    feedback: feedback as unknown as Record<string, unknown>,
  });

  if (insertError) {
    logger.error("Database insert failed, rolling back storage", insertError);
    await supabase.storage.from(RESUMES_BUCKET).remove([pdfPath, imagePath]);
    throw new Error(`Database insert failed: ${insertError.message}`);
  }

  logger.success(`Pipeline complete for resume ${id}`);
  return { id };
}
