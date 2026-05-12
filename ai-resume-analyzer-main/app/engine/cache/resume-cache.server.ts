import { createHash } from "crypto";
import type { DeterministicEngineResult } from "~/engine/scoring/deterministic-engine";

interface CacheEntry {
  result: DeterministicEngineResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function makeKey(resumeText: string, role: string): string {
  return createHash("sha256").update(`${role}::${resumeText}`).digest("hex");
}

export function getCachedDeterministic(
  resumeText: string,
  role: string
): DeterministicEngineResult | null {
  const key = makeKey(resumeText, role);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedDeterministic(
  resumeText: string,
  role: string,
  result: DeterministicEngineResult
): void {
  const key = makeKey(resumeText, role);
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  // Evict expired entries periodically (keep map small)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}
