import { z } from "zod";
import chalk from "chalk";

const serverEnvSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1, "FIREBASE_SERVICE_ACCOUNT_JSON is missing. Get the JSON object from Firebase Console -> Project Settings -> Service Accounts."),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL. Get it from Supabase Dashboard -> Project Settings -> API."),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is missing. Get it from Supabase Dashboard -> Project Settings -> API."),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is missing. Get your API key from Groq Console."),
  GROQ_MODEL: z.string().default("llama-3.1-70b-versatile"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let env: ServerEnv;

try {
  env = serverEnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(chalk.red.bold("\n❌ Invalid Server Environment Variables:\n"));
    (error as any).issues.forEach((err: any) => {
      console.error(chalk.yellow(`  - ${err.message}`));
    });
    console.error(chalk.cyan("\nℹ️  Please update your .env file with the required values.\n"));
    process.exit(1);
  }
  throw error;
}

export { env as serverEnv };
