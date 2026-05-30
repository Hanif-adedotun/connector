import { z } from "zod";
import {
  GROQ_FALLBACK_MODEL,
  GROQ_PRIMARY_MODEL,
  groq,
} from "./groq.client";
import { isCandidate, truncate } from "./candidate-filter";
import { redact } from "./redactor";
import { buildExtractionUserPrompt, EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import { EventModel } from "../../models/event.model";
import { TaskModel } from "../../models/task.model";
import { normalize } from "../normalization/normalize";
import { logger } from "../../utils/logger";
import type { ConnectorEvent } from "../../types";

const extractedSchema = z.object({
  task: z.string(),
  summary: z.string().default(""),
  due_date: z.string().nullable().optional(),
  confidence: z.coerce.number().min(0).max(1),
});

export type ExtractedSchema = z.infer<typeof extractedSchema>;

export interface ExtractionResult {
  taskId: string | null;
  confidence: number;
  skipped?: string;
}

const MIN_CONFIDENCE = 0.6;

/**
 * Pipeline:
 *   candidate-filter -> redactor -> groq.chat.completions -> zod-parse -> persist task
 *
 * Tries the primary model first and falls back to the smaller model on error
 * or when the primary returns malformed JSON.
 */
export async function extractTaskFromEvent(
  eventId: string,
): Promise<ExtractionResult> {
  const event = await EventModel.findById(eventId);
  if (!event) return { taskId: null, confidence: 0, skipped: "event not found" };

  const normalized: ConnectorEvent = normalize({
    id: event.id,
    userId: event.userId,
    provider: event.provider,
    raw: {
      externalId: event.externalId,
      title: event.title ?? undefined,
      content: event.content,
      occurredAt: event.occurredAt,
      metadata: (event.metadataJson as Record<string, unknown>) ?? undefined,
    },
  });

  const decision = isCandidate(normalized);
  if (!decision.isCandidate) {
    await EventModel.markProcessed(event.id);
    return { taskId: null, confidence: 0, skipped: decision.reason };
  }

  normalized.content = truncate(redact(normalized.content));

  const extracted = await runExtractionWithFallback(normalized);
  await EventModel.markProcessed(event.id);

  if (!extracted) {
    return { taskId: null, confidence: 0, skipped: "no model response" };
  }
  if (!extracted.task || extracted.confidence < MIN_CONFIDENCE) {
    return {
      taskId: null,
      confidence: extracted.confidence,
      skipped: "low confidence",
    };
  }

  const task = await TaskModel.create({
    userId: event.userId,
    provider: event.provider,
    sourceEventId: event.id,
    title: extracted.task,
    summary: extracted.summary || undefined,
    dueDate: parseDueDate(extracted.due_date ?? null),
    confidence: extracted.confidence,
  });

  return { taskId: task.id, confidence: extracted.confidence };
}

async function runExtractionWithFallback(
  event: ConnectorEvent,
): Promise<ExtractedSchema | null> {
  for (const model of [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL]) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: buildExtractionUserPrompt(event) },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const parsed = extractedSchema.safeParse(JSON.parse(content));
      if (parsed.success) return parsed.data;

      logger.warn({ model, errors: parsed.error.flatten() }, "groq: schema mismatch");
    } catch (err) {
      logger.warn({ model, err }, "groq: extraction failed, trying fallback");
    }
  }
  return null;
}

function parseDueDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
