import { readFileSync } from "fs";
const envPath = ".env";
const envContent = readFileSync(envPath, "utf8");
let saJson = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON=")) {
    let val = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    saJson = val;
  }
}
console.log("Raw JSON string length:", saJson.length);
const parsed = JSON.parse(saJson);
console.log("Parsed private_key length:", parsed.private_key.length);
console.log("Contains real newlines?", parsed.private_key.includes("\n"));
console.log("Contains escaped newlines?", parsed.private_key.includes("\\n"));
