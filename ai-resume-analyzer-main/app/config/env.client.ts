import { z } from "zod";

// Zod schema for client environment variables (Vite exposed via import.meta.env)
const clientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, "VITE_FIREBASE_API_KEY is missing."),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, "VITE_FIREBASE_AUTH_DOMAIN is missing."),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, "VITE_FIREBASE_PROJECT_ID is missing."),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, "VITE_FIREBASE_STORAGE_BUCKET is missing."),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "VITE_FIREBASE_MESSAGING_SENDER_ID is missing."),
  VITE_FIREBASE_APP_ID: z.string().min(1, "VITE_FIREBASE_APP_ID is missing."),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;

// Parse using import.meta.env
// Note: In Vite, we cannot blindly spread import.meta.env into z.parse if there are boolean/number values, 
// but since all of ours are strings, we can construct the object manually to ensure Vite replaces them at build time.
let clientEnv: ClientEnv;

try {
  clientEnv = clientEnvSchema.parse({
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid Client Environment Variables:");
    (error as any).issues.forEach((err: any) => {
      console.error(`  - ${err.message}`);
    });
    console.error("ℹ️  Please update your .env file with the required VITE_* values.");
    // In the browser, we can't process.exit(1), so we just throw to halt execution
    throw new Error("Invalid client environment variables. Check console for details.");
  }
  throw error;
}

export { clientEnv };
