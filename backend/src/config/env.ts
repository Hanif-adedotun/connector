import { z } from "zod";

/** Safe defaults when NODE_ENV=test so Jest workers don't exit on missing CI secrets. */
const TEST_ENV_DEFAULTS: Record<string, string> = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  ENCRYPTION_KEY: "a".repeat(64),
  GROQ_API_KEY: "test-groq-key",
  REDIS_URL: "redis://localhost:6379",
  APP_URL: "http://localhost:4001",
  API_URL: "http://localhost:4000",
  APP_MODE: "production",
};

const isTestEnv = process.env.NODE_ENV === "test";

if (!isTestEnv) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv/config");
}

const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  /** Controls runtime behavior (e.g. disable polling in local dev against shared prod DB). */
  APP_MODE: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default("http://localhost:4001"),
  API_URL: z.string().url().default("http://localhost:4000"),
  /** Comma-separated browser origins allowed for CORS (defaults to APP_URL + dev localhost ports). */
  CORS_ORIGINS: z.string().optional(),

  // Database (Supabase Postgres)
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url().min(1),
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
  /** Application bot token — required for reading channel messages. */
  DISCORD_BOT_TOKEN: z.string().optional(),

  // Polling
  POLLING_INTERVAL_MS: z.coerce.number().default(5 * 60 * 1000),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:brief@localhost"),
  PUSH_BATCH_DELAY_MS: z.coerce.number().default(30_000),

  // Morning digest push (daily summary of open tasks)
  MORNING_DIGEST_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  MORNING_DIGEST_HOUR: z.coerce.number().min(0).max(23).default(8),
  MORNING_DIGEST_MINUTE: z.coerce.number().min(0).max(59).default(0),
  MORNING_DIGEST_TIMEZONE: z.string().default("America/New_York"),
});

const envInput = isTestEnv
  ? { ...TEST_ENV_DEFAULTS, ...process.env }
  : process.env;

const parsed = envSchema.safeParse(envInput);

if (!parsed.success) {
  const message = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  if (isTestEnv) {
    throw new Error(`Invalid environment variables in test:\n${message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
