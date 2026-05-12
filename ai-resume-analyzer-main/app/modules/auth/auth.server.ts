import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { serverEnv } from "~/config/env.server";

let initialized = false;
let initError: Error | null = null;

function ensureAdmin() {
  if (initialized) return;
  if (initError) throw initError; // don't retry a known-bad config

  try {
    const raw = serverEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
    const cred = JSON.parse(raw) as ServiceAccount;

    console.log(`[auth.server] Initializing Firebase Admin for project: ${cred.projectId ?? "(unknown)"}`);

    if (!getApps().length) {
      initializeApp({ credential: cert(cred) });
    }
    initialized = true;
    console.log("[auth.server] Firebase Admin initialized successfully");
  } catch (e) {
    initError = e instanceof Error ? e : new Error(String(e));
    console.error(`[auth.server] Firebase Admin init FAILED: ${initError.message}`);
    throw initError;
  }
}

export async function verifyIdToken(idToken: string) {
  try {
    ensureAdmin();
    return await getAuth().verifyIdToken(idToken);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[auth.server] verifyIdToken failed: ${msg}`);
    throw e;
  }
}

export async function requireUid(request: Request): Promise<string> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing Authorization bearer token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = auth.slice(7).trim();
  if (!token) {
    throw new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const decoded = await verifyIdToken(token);
    return decoded.uid;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Response(JSON.stringify({ error: `Auth failed: ${msg}` }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
