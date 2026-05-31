import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { getGoogleCalendarClient } from "../google/client";
import { logger } from "../../../utils/logger";
import type { PollContext, PollResult } from "..";
import {
  mapGoogleEventToPersistParams,
  processCalendarEvent,
} from "./process-event";

const POLL_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Polls upcoming Google Calendar events for the next 24h.
 */
export async function pollGoogleCalendar(
  ctx: PollContext,
): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollGoogleCalendar: integration not active");
    return { eventsFetched: 0 };
  }

  const calendar = await getGoogleCalendarClient(integration);
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + POLL_WINDOW_MS);

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  const items = data.items ?? [];
  let eventsFetched = 0;

  for (const item of items) {
    const params = mapGoogleEventToPersistParams(ctx.userId, item);
    if (!params) continue;

    const event = await EventModel.upsertByExternalId(params);
    eventsFetched += 1;

    if (!event.processed) {
      await processCalendarEvent(event);
    }
  }

  logger.info(
    { integrationId: ctx.integrationId, eventsFetched },
    "pollGoogleCalendar: done",
  );

  return { eventsFetched };
}
