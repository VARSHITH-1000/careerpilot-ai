import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "~/config/env.server";

let client: SupabaseClient | null = null;

/** Service-role client (bypasses RLS). Use only on the server after Firebase auth. */
export function getSupabaseService(): SupabaseClient {
  if (!client) {
    client = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const RESUMES_BUCKET = "resumes";
