import Groq from "groq-sdk";
import { serverEnv } from "~/config/env.server";
import { logger } from "~/utils/logger.server";

const MAX_RETRIES = 3;
const ATTEMPT_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`AI request timed out after ${ms / 1000}s (${label})`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

import { safeParseJson } from "./llm.server";

export async function generateContextualInsights(prompt: string): Promise<any> {
  if (!serverEnv.GROQ_API_KEY) {
      logger.warn("GROQ_API_KEY not found, falling back to original gemini generateContextualInsights");
      // Could export from gemini.server.ts and call it, but let's just make it throw for now
      // or we can implement the logic here
  }
  const groq = new Groq({ apiKey: serverEnv.GROQ_API_KEY });
  const model = serverEnv.GROQ_MODEL || "llama-3.1-8b-instant";

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    logger.info(`Groq AI insights attempt ${attempt}/${MAX_RETRIES} using ${model}`);
    try {
      const result = await withTimeout(
        groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: model,
            response_format: { type: "json_object" },
        }),
        ATTEMPT_TIMEOUT_MS,
        `attempt ${attempt}`
      );

      const text = result.choices[0]?.message?.content;
      if (!text?.trim()) throw new Error("AI returned an empty response");

      const parsed = safeParseJson(text);
      logger.info(`AI insights succeeded on attempt ${attempt}`);
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        const backoff = attempt * 2000;
        logger.info(`Retrying in ${backoff / 1000}s...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  logger.error(`All ${MAX_RETRIES} AI attempts failed`, lastError);
  throw lastError;
}
