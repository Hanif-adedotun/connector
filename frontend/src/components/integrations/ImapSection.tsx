"use client";

import { useState } from "react";
import { Mail, Unlink } from "lucide-react";
import { toast } from "sonner";
import { connectImapMailbox, type ImapConnectPayload } from "@/lib/api-client";
import type { Integration } from "@/types";

const PRESETS = {
  fastmail: { host: "imap.fastmail.com", port: 993, secure: true },
  outlook: { host: "outlook.office365.com", port: 993, secure: true },
  icloud: { host: "imap.mail.me.com", port: 993, secure: true },
  custom: { host: "", port: 993, secure: true },
} as const;

type PresetKey = keyof typeof PRESETS;

interface ImapSectionProps {
  items: Integration[];
  onConnected: () => void;
  onDisconnect: (id: string) => void;
  disabled?: boolean;
}

export function ImapSection({
  items,
  onConnected,
  onDisconnect,
  disabled = false,
}: ImapSectionProps) {
  const [preset, setPreset] = useState<PresetKey>("fastmail");
  const [host, setHost] = useState<string>(PRESETS.fastmail.host);
  const [port, setPort] = useState<number>(PRESETS.fastmail.port);
  const [secure, setSecure] = useState<boolean>(PRESETS.fastmail.secure);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const imapIntegrations = items.filter(
    (i) => i.provider === "imap" && i.status === "active",
  );

  function applyPreset(next: PresetKey) {
    setPreset(next);
    const values = PRESETS[next];
    setHost(values.host);
    setPort(values.port);
    setSecure(values.secure);
  }

  async function handleConnect() {
    if (!host.trim() || !username.trim() || !password) {
      toast.error("Host, username, and password are required");
      return;
    }

    const payload: ImapConnectPayload = {
      host: host.trim(),
      port,
      secure,
      username: username.trim(),
      password,
      ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
    };

    setConnecting(true);
    try {
      await connectImapMailbox(payload);
      toast.success("Email mailbox connected");
      setPassword("");
      setShowForm(false);
      onConnected();
    } catch (err) {
      const message =
        (err as { message?: string }).message ?? "Failed to connect mailbox";
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <p className="font-medium">Email (IMAP)</p>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Connect any IMAP inbox to surface follow-ups from unread email.
        </p>

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={disabled}
            className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Add mailbox
          </button>
        )}

        {showForm && (
          <div className="space-y-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`rounded-full px-3 py-1 text-xs capitalize ${
                    preset === key
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="text-neutral-500">Host</span>
                <input
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  placeholder="imap.example.com"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-neutral-500">Port</span>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
              <label className="space-y-1 text-xs sm:col-span-2">
                <span className="text-neutral-500">Username</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  placeholder="you@example.com"
                />
              </label>
              <label className="space-y-1 text-xs sm:col-span-2">
                <span className="text-neutral-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
              <label className="space-y-1 text-xs sm:col-span-2">
                <span className="text-neutral-500">Display name (optional)</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  placeholder="Work inbox"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
              />
              Use TLS/SSL
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleConnect()}
                disabled={connecting || disabled}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={connecting}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {imapIntegrations.map((integration) => {
        const label =
          integration.imapConfig?.displayName ??
          integration.imapConfig?.username ??
          integration.imapMailboxId ??
          "Mailbox";

        return (
          <div
            key={integration.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-xs text-neutral-500">
                {integration.imapConfig?.host}:{integration.imapConfig?.port}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDisconnect(integration.id)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <Unlink className="h-3 w-3" />
              Disconnect
            </button>
          </div>
        );
      })}
    </div>
  );
}
