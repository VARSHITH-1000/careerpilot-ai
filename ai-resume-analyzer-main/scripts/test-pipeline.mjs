/**
 * Standalone diagnostic script — run with:
 *   node scripts/test-pipeline.mjs
 *
 * Tests each service independently to pinpoint which credentials are missing.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, "../.env");
let envContent = "";
try {
  envContent = readFileSync(envPath, "utf8");
} catch {
  console.error("❌ Could not read .env file at", envPath);
  process.exit(1);
}

// Parse env
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

function check(name, validator) {
  const val = env[name];
  if (!val || val.startsWith("your-") || val.startsWith("https://your-") || val === "...") {
    console.error(`❌ ${name} — PLACEHOLDER / MISSING`);
    return false;
  }
  if (validator && !validator(val)) {
    console.error(`❌ ${name} — INVALID FORMAT`);
    return false;
  }
  const preview = val.length > 40 ? val.slice(0, 37) + "..." : val;
  console.log(`✅ ${name} = ${preview}`);
  return true;
}

console.log("\n════════════════════════════════════════");
console.log("  CareerPilot — Credential Diagnostics");
console.log("════════════════════════════════════════\n");

let allOk = true;

console.log("── Firebase Client (VITE_*) ───────────");
allOk &= check("VITE_FIREBASE_API_KEY");
allOk &= check("VITE_FIREBASE_AUTH_DOMAIN");
allOk &= check("VITE_FIREBASE_PROJECT_ID");
allOk &= check("VITE_FIREBASE_STORAGE_BUCKET");
allOk &= check("VITE_FIREBASE_MESSAGING_SENDER_ID");
allOk &= check("VITE_FIREBASE_APP_ID");

console.log("\n── Firebase Admin (Server) ────────────");
const saJson = env["FIREBASE_SERVICE_ACCOUNT_JSON"] || "";
let saOk = false;
try {
  const parsed = JSON.parse(saJson);
  if (parsed.type === "service_account" && parsed.project_id !== "...") {
    console.log(`✅ FIREBASE_SERVICE_ACCOUNT_JSON — project_id: ${parsed.project_id}`);
    saOk = true;
  } else {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON — still contains placeholder values");
  }
} catch {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON — not valid JSON or missing");
}
allOk &= saOk;

console.log("\n── Supabase (Server) ──────────────────");
allOk &= check("SUPABASE_URL", (v) => v.startsWith("https://") && v.includes(".supabase.co"));
allOk &= check("SUPABASE_SERVICE_ROLE_KEY", (v) => v.length > 20);

console.log("\n── Gemini AI (Server) ─────────────────");
allOk &= check("GEMINI_API_KEY", (v) => v.startsWith("AIza") && v.length > 20);
check("GEMINI_MODEL");

console.log("\n════════════════════════════════════════");
if (allOk) {
  console.log("✅ All credentials look valid! Testing live connections...\n");
  await testLiveConnections(env);
} else {
  console.log("❌ Fix the above credentials in your .env file before running the app.\n");
  console.log("📋 Credential sources:");
  console.log("   Firebase Admin JSON : Firebase Console → Project Settings → Service Accounts → Generate new private key");
  console.log("   Supabase URL+Key    : Supabase Dashboard → Project Settings → API");
  console.log("   Gemini API Key      : https://aistudio.google.com/app/apikey");
}

async function testLiveConnections(env) {
  // Test Firebase Admin init
  process.stdout.write("🔌 Testing Firebase Admin SDK... ");
  try {
    const admin = await import("firebase-admin");
    const raw = env["FIREBASE_SERVICE_ACCOUNT_JSON"] || "";
    const cred = JSON.parse(raw);
    // Check private key looks like a real PEM key
    if (!cred.private_key?.includes("BEGIN")) {
      throw new Error("private_key does not look like a valid PEM key — check for escaped \\\\n sequences");
    }
    if (!admin.default.apps.length) {
      admin.default.initializeApp({ credential: admin.default.credential.cert(cred) });
    }
    // Try a simple admin operation to confirm connectivity
    await admin.default.auth().listUsers(1);
    console.log(`✅ initialized and connected (project: ${cred.project_id})`);
  } catch (e) {
    console.log(`❌ FAILED: ${e.message}`);
  }

  // Test Gemini
  process.stdout.write("🔌 Testing Gemini API... ");
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const gen = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = gen.getGenerativeModel({ model: env.GEMINI_MODEL || "gemini-2.0-flash-lite" });
    const result = await model.generateContent("Reply with the single word: OK");
    const text = result.response.text().trim();
    console.log(`✅ responded: "${text}"`);
  } catch (e) {
    console.log(`❌ FAILED: ${e.message}`);
  }

  // Test Supabase
  process.stdout.write("🔌 Testing Supabase connection... ");
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await sb.from("resumes").select("id").limit(1);
    if (error) throw new Error(error.message);
    console.log("✅ connected successfully");
  } catch (e) {
    console.log(`❌ FAILED: ${e.message}`);
  }
}
