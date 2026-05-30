import Groq from "groq-sdk";
import { env } from "./env";

export const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const GROQ_PRIMARY_MODEL = env.GROQ_PRIMARY_MODEL;
export const GROQ_FALLBACK_MODEL = env.GROQ_FALLBACK_MODEL;

export const GROQ_MODELS = [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL] as const;
