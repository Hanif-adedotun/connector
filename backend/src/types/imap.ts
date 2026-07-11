export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  displayName?: string;
}

export const NON_IMAP_MAILBOX_ID = "";

export function normalizeImapMailboxId(username: string): string {
  return username.trim().toLowerCase();
}

export function parseImapConfig(raw: unknown): ImapConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.host !== "string" || typeof obj.username !== "string") {
    return null;
  }
  const port = typeof obj.port === "number" ? obj.port : Number(obj.port);
  if (!Number.isFinite(port)) return null;

  return {
    host: obj.host,
    port,
    secure: obj.secure === true,
    username: obj.username,
    displayName:
      typeof obj.displayName === "string" ? obj.displayName : undefined,
  };
}

export const IMAP_PRESETS = {
  fastmail: {
    host: "imap.fastmail.com",
    port: 993,
    secure: true,
  },
  outlook: {
    host: "outlook.office365.com",
    port: 993,
    secure: true,
  },
  icloud: {
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
  },
} as const;
