import { env } from "./env";

const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4001",
];

export function getAllowedOrigins(): string[] {
  const explicit = env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (explicit?.length) {
    return [...new Set(explicit)];
  }

  const origins = [env.APP_URL];
  if (env.NODE_ENV === "development") {
    origins.push(...DEV_ORIGINS);
  }

  return [...new Set(origins)];
}
