import type { Provider } from "@prisma/client";
import webpush from "web-push";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { PushSubscriptionModel } from "../../models/push-subscription.model";
import { TaskModel } from "../../models/task.model";
import { UserModel } from "../../models/user.model";
import { schedulePushBatchFlush } from "../../queues/push-notify.queue";
import { logger } from "../../utils/logger";
import {
  buildMorningDigestMessage,
  digestLocalTime,
  resolveDigestTimeZone,
} from "./morning-digest.message";

const BATCH_KEY_PREFIX = "push-batch:";

export interface PendingPushTask {
  title: string;
  provider: Provider;
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  overdueCount?: number;
};

/** Count open tasks whose due calendar day (in `timeZone`) is before today. */
export function countOverdueFromDueDates(
  tasks: { dueDate: Date | null }[],
  now: Date,
  timeZone: string,
): number {
  const todayKey = digestLocalTime(now, timeZone).dateKey;
  let overdueCount = 0;
  for (const task of tasks) {
    if (!task.dueDate) continue;
    if (digestLocalTime(task.dueDate, timeZone).dateKey < todayKey) {
      overdueCount += 1;
    }
  }
  return overdueCount;
}

async function resolveOverdueCount(
  userId: string,
  timezone: string | null | undefined,
): Promise<number> {
  const timeZone = resolveDigestTimeZone(
    timezone,
    env.MORNING_DIGEST_TIMEZONE,
  );
  const dueDates = await TaskModel.listOpenDueDates(userId);
  return countOverdueFromDueDates(dueDates, new Date(), timeZone);
}

function batchKey(userId: string) {
  return `${BATCH_KEY_PREFIX}${userId}`;
}

function providerLabel(provider: Provider): string {
  const labels: Record<Provider, string> = {
    gmail: "Gmail",
    imap: "Email",
    google_calendar: "Google Calendar",
    slack: "Slack",
    jira: "Jira",
    discord: "Discord",
  };
  return labels[provider] ?? provider;
}

function configureWebPush() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  return true;
}

function buildSummaryMessage(tasks: PendingPushTask[]): {
  title: string;
  body: string;
} {
  if (tasks.length === 1) {
    const t = tasks[0];
    return {
      title: "New task",
      body: `From ${providerLabel(t.provider)}: ${t.title}`,
    };
  }

  const providers = [...new Set(tasks.map((t) => t.provider))];
  const source =
    providers.length === 1
      ? providerLabel(providers[0])
      : "your integrations";

  return {
    title: `${tasks.length} new tasks`,
    body: `New items from ${source}`,
  };
}

async function sendPushPayload(userId: string, payload: PushPayload) {
  if (!configureWebPush()) {
    logger.warn("push skipped: VAPID keys not configured");
    return;
  }

  const subscriptions = await PushSubscriptionModel.listForUser(userId);
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await PushSubscriptionModel.deleteById(sub.id);
        } else {
          logger.error(
            { userId, subscriptionId: sub.id, err },
            "push send failed",
          );
        }
      }
    }),
  );
}

export const PushNotificationService = {
  async recordNewTask(
    userId: string,
    task: { title: string; provider: Provider },
  ) {
    const key = batchKey(userId);
    const existing = await redis.get(key);
    const batch: PendingPushTask[] = existing
      ? (JSON.parse(existing) as PendingPushTask[])
      : [];
    batch.push({ title: task.title, provider: task.provider });
    await redis.set(key, JSON.stringify(batch), "EX", 3600);
    await schedulePushBatchFlush(userId);
  },

  async flushBatch(userId: string) {
    const key = batchKey(userId);
    const raw = await redis.get(key);
    if (!raw) return;

    await redis.del(key);
    const tasks = JSON.parse(raw) as PendingPushTask[];
    if (tasks.length === 0) return;

    const user = await UserModel.findById(userId);
    if (!user?.notificationsEnabled) return;

    const { title, body } = buildSummaryMessage(tasks);
    const overdueCount = await resolveOverdueCount(userId, user.timezone);
    await sendPushPayload(userId, {
      title,
      body,
      url: "/dashboard",
      tag: "new-tasks",
      overdueCount,
    });
  },

  async sendMorningDigest(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user?.notificationsEnabled) return;

    const openTaskCount = await TaskModel.countOpen(userId);
    const overdueCount = await resolveOverdueCount(userId, user.timezone);
    const { title, body } = buildMorningDigestMessage({
      firstName: user.firstName,
      openTaskCount,
    });

    await sendPushPayload(userId, {
      title,
      body,
      url: "/dashboard",
      tag: "morning-digest",
      overdueCount,
    });
  },
};
