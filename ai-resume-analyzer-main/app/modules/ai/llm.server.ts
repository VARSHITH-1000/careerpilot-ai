import { generateContextualInsights as generateGroq } from "./groq.server";
import { generateContextualInsights as generateGemini } from "./gemini.server";
import { serverEnv } from "~/config/env.server";
import { logger } from "~/utils/logger.server";
import type { ContextualInsights } from "./gemini.server";

export function safeParseJson(raw: string): unknown {
  let s = raw.trim().replace(/^\uFEFF/, "");
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) s = fenced[1].trim();
  else if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  const start = s.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') { inString = false; continue; }
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return JSON.parse(s.slice(start, i + 1));
      }
    }
  }
  return JSON.parse(s);
}

export async function generateContextualInsights(prompt: string): Promise<ContextualInsights> {
    if (serverEnv.GROQ_API_KEY) {
        logger.info("Using Groq API for inference");
        return generateGroq(prompt);
    } else {
        logger.info("Using Gemini API for inference");
        return generateGemini(prompt);
    }
}
