import type { Route } from "./+types/api.resumes.$id";
import { requireUid } from "~/modules/auth/auth.server";
import { getSupabaseService, RESUMES_BUCKET } from "~/modules/db/supabase.server";

const SIGNED_TTL = 3600;

export async function loader({ request, params }: Route.LoaderArgs) {
  const uid = await requireUid(request);
  const id = params.id;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const pdfPath = data.pdf_path as string;
  const imagePath = data.image_path as string;

  const [pdfSigned, imageSigned] = await Promise.all([
    supabase.storage.from(RESUMES_BUCKET).createSignedUrl(pdfPath, SIGNED_TTL),
    supabase.storage.from(RESUMES_BUCKET).createSignedUrl(imagePath, SIGNED_TTL),
  ]);

  if (pdfSigned.error || !pdfSigned.data?.signedUrl) {
    return Response.json({ error: pdfSigned.error?.message ?? "PDF URL error" }, { status: 500 });
  }
  if (imageSigned.error || !imageSigned.data?.signedUrl) {
    return Response.json({ error: imageSigned.error?.message ?? "Image URL error" }, { status: 500 });
  }

  return Response.json({
    resume: {
      id: data.id,
      companyName: data.company_name ?? "",
      jobTitle: data.job_title ?? "",
      jobDescription: data.job_description ?? "",
      targetRole: data.target_role as TargetRole,
      pdfPath,
      imagePath,
      feedback: data.feedback as Feedback,
    },
    pdfUrl: pdfSigned.data.signedUrl,
    imageUrl: imageSigned.data.signedUrl,
  });
}


