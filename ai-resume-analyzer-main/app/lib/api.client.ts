import { getClientAuth } from "~/lib/firebase.client";

/** Default client timeouts so requests cannot hang indefinitely in the UI. */
function defaultTimeoutMs(method: string): number {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return 120_000;
  // POST /api/resumes analysis can run several minutes server-side
  return 300_000;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  // forceRefresh=true ensures we never send an expired token
  const token = await user.getIdToken(true);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const method = init.method ?? "GET";
  const signal =
    init.signal ??
    (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(defaultTimeoutMs(method))
      : undefined);

  return fetch(path, { ...init, headers, ...(signal ? { signal } : {}) });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  
  // Guard: if the response is HTML (e.g. dev fallback / proxy error), JSON parsing would mislead the user
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "Expected JSON from the app server but received a different response. Check that `npm run dev` is running and any proxy targets (e.g. `/api/rag` → RAG on :8000) are up."
    );
  }
  
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) detail = body.error;
    } catch {
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
