export interface SkipContext {
  from: string;
  subject: string;
  body: string;
  hasListUnsubscribe: boolean;
}

const NOREPLY_PATTERN =
  /(?:^|[\s<])no[-_.]?reply|do[-_.]?not[-_.]?reply|donotreply|mailer-daemon|notifications?@/i;

const AUTOMATED_SUBJECT_PATTERN =
  /out of office|automatic reply|auto.?reply|delivery status|undeliverable|delivery failure|returned mail/i;

export function shouldSkipEmail(
  ctx: SkipContext,
): { skip: true; reason: string } | { skip: false } {
  if (NOREPLY_PATTERN.test(ctx.from)) {
    return { skip: true, reason: "noreply sender" };
  }

  if (AUTOMATED_SUBJECT_PATTERN.test(ctx.subject)) {
    return { skip: true, reason: "automated subject" };
  }

  if (ctx.hasListUnsubscribe) {
    return { skip: true, reason: "list-unsubscribe header" };
  }

  if (!ctx.body.trim()) {
    return { skip: true, reason: "empty body" };
  }

  return { skip: false };
}
