/**
 * Strips secrets and credentials from event content before it is sent to the LLM.
 * Defense-in-depth: providers should already avoid leaking these, but we never
 * forward them just in case.
 */
const PATTERNS: Array<{ re: RegExp; label: string }> = [
  // AWS access / secret keys
  { re: /AKIA[0-9A-Z]{16}/g, label: "[REDACTED_AWS_KEY]" },
  { re: /aws_secret_access_key\s*[:=]\s*[A-Za-z0-9/+=]{30,}/gi, label: "[REDACTED_AWS_SECRET]" },

  // Bearer tokens
  { re: /Bearer\s+[A-Za-z0-9._\-]+/g, label: "Bearer [REDACTED]" },

  // JWT (three dot-separated base64url chunks)
  { re: /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/g, label: "[REDACTED_JWT]" },

  // Generic API keys / secrets
  { re: /api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9._\-]{16,}['"]?/gi, label: "api_key=[REDACTED]" },
  { re: /secret\s*[:=]\s*['"]?[A-Za-z0-9._\-]{16,}['"]?/gi, label: "secret=[REDACTED]" },
  { re: /password\s*[:=]\s*['"]?[^\s'"]{6,}['"]?/gi, label: "password=[REDACTED]" },

  // Private keys
  {
    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g,
    label: "[REDACTED_PRIVATE_KEY]",
  },

  // OpenAI / Groq style tokens
  { re: /\bsk-[A-Za-z0-9]{20,}\b/g, label: "[REDACTED_API_TOKEN]" },
  { re: /\bgsk_[A-Za-z0-9]{20,}\b/g, label: "[REDACTED_API_TOKEN]" },
];

export function redact(text: string): string {
  let out = text;
  for (const { re, label } of PATTERNS) {
    out = out.replace(re, label);
  }
  return out;
}
