const STOP = new Set([
  "and", "the", "for", "with", "from", "this", "that", "have", "has", "are", "was", "were",
  "will", "your", "you", "our", "all", "any", "but", "not", "can", "may", "role", "team",
  "work", "experience", "skills", "including", "such", "into", "also", "years", "must",
  "able", "well", "strong", "ideal", "candidate", "looking", "seeking", "join", "company",
]);

export function normalizeResumeText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function lower(text: string): string {
  return text.toLowerCase();
}

export function tokenizeMeaningful(text: string): string[] {
  return lower(text)
    .split(/[^a-z0-9+#]+/g)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function countOccurrences(haystack: string, needle: string): number {
  const h = lower(haystack);
  const n = lower(needle);
  if (!n) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const i = h.indexOf(n, pos);
    if (i === -1) break;
    count++;
    pos = i + n.length;
  }
  return count;
}
