import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default("http://localhost:4001"),
  API_URL: z.string().url().default("http://localhost:4000"),
  /** Comma-separated browser origins allowed for CORS (defaults to APP_URL + dev localhost ports). */
  CORS_ORIGINS: z.string().optional(),

  // Database (Supabase Postgres)
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis / BullMQ
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  // Encryption (32-byte hex for AES-256-GCM = 64 hex chars)
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),

  // Groq
  GROQ_API_KEY: z.string().min(1),
  GROQ_PRIMARY_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GROQ_FALLBACK_MODEL: z.string().default("llama-3.1-8b-instant"),

  // Google (Calendar + Gmail share one OAuth app)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/oauth/google/callback"),

  // Slack
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/oauth/slack/callback"),

  // Jira
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/oauth/jira/callback"),
  JIRA_MAX_RESULTS: z.coerce.number().default(50),
  /** Comma-separated Jira statusCategory values (e.g. To Do,In Progress). */
  JIRA_STATUS_CATEGORIES: z
    .string()
    .default("To Do,In Progress"),
  /** Optional extra JQL AND fragment for site-specific workflows. */
  JIRA_EXTRA_JQL: z.string().optional(),

  // Discord
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z
    .string()
    .url()
    .default("http://localhost:4000/api/oauth/discord/callback"),

  // Polling
  POLLING_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:connector@localhost"),
  PUSH_BATCH_DELAY_MS: z.coerce.number().default(30_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
