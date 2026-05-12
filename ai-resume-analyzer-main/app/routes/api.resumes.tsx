import type { Route } from "./+types/api.resumes";
import { requireUid } from "~/modules/auth/auth.server";
import { getSupabaseService, RESUMES_BUCKET } from "~/modules/db/supabase.server";
import { runResumeAnalysisPipeline } from "~/modules/resume/resume.server";
import { logger } from "~/utils/logger.server";

const SIGNED_TTL = 3600;

async function signPath(supabase: ReturnType<typeof getSupabaseService>, path: string) {
  const { data, error } = await supabase.storage.from(RESUMES_BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not sign storage URL");
  }
  return data.signedUrl;
}

export async function loader({ request }: Route.LoaderArgs) {
  const uid = await requireUid(request);
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, company_name, job_title, target_role, feedback, image_path, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const resumes: Resume[] = await Promise.all(
    rows.map(async (r) => {
      const fb = r.feedback as Feedback | null;
      const imageUrl = await signPath(supabase, r.image_path as string);
      return {
        id: r.id,
        companyName: r.company_name ?? "",
        jobTitle: r.job_title ?? "",
        targetRole: r.target_role as TargetRole,
        imagePath: r.image_path as string,
        resumePath: "",
        feedback: fb ?? ("" as const),
        imageUrl,
      };
    })
  );

  return Response.json({ resumes });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    const uid = await requireUid(request);
    const form = await request.formData();

    const companyName = String(form.get("company-name") ?? "");
    const jobTitle = String(form.get("job-title") ?? "");
    const jobDescription = String(form.get("job-description") ?? "");
    const targetRole = String(form.get("target-role") ?? "Software Engineer");
    const resumeText = String(form.get("resumeText") ?? "");

    const pdf = form.get("resume");
    const previewImage = form.get("image");
    if (!(pdf instanceof File) || pdf.size === 0) {
      return Response.json({ error: "Missing resume PDF" }, { status: 400 });
    }
    if (!(previewImage instanceof File) || previewImage.size === 0) {
      return Response.json({ error: "Missing preview image" }, { status: 400 });
    }

    logger.info(`[api.resumes] Starting pipeline for uid=${uid} role=${targetRole}`);

    // Hard server-side deadline — prevents the connection hanging forever if Gemini stalls
    const SERVER_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Server analysis timeout — please retry")), SERVER_TIMEOUT_MS)
    );

    const { id } = await Promise.race([
      runResumeAnalysisPipeline({
        uid,
        companyName,
        jobTitle,
        jobDescription,
        targetRole,
        resumeText,
        pdf,
        previewImage,
      }),
      timeoutPromise,
    ]);

    logger.info(`[api.resumes] Pipeline complete id=${id}`);
    return Response.json({ id });
  } catch (e) {
    // Serialize error properly — e may be a thrown Response or plain Error
    let message = "Analysis failed";
    if (e instanceof Response) {
      try {
        const body = await e.clone().json() as { error?: string };
        message = body?.error ?? `HTTP ${e.status}`;
      } catch {
        message = `HTTP ${e.status}`;
      }
      logger.error(`[api.resumes] Auth/pipeline error: ${message}`);
      return e; // return the Response directly
    }
    message = e instanceof Error ? e.message : String(e);
    logger.error(`[api.resumes] Pipeline error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}


