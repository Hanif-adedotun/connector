"use client";

import { useEffect, useRef, useState } from "react";

/** Parsed duration of /tasks.gif (sum of frame delays). */
const GIF_DURATION_MS = 2910;
/** Pause on the final frame before restarting. */
const RESTART_PAUSE_MS = 3000;

type TasksDemoGifProps = {
  className?: string;
};

export function TasksDemoGif({ className }: TasksDemoGifProps) {
  const blobRef = useRef<Blob | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playId, setPlayId] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetch("/tasks.gif")
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        setSrc(URL.createObjectURL(blob));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (playId === 0) return;
    const blob = blobRef.current;
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }, [playId]);

  useEffect(() => {
    if (!src) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setTimeout(
      () => setPlayId((n) => n + 1),
      GIF_DURATION_MS + RESTART_PAUSE_MS,
    );
    return () => window.clearTimeout(id);
  }, [src]);

  if (!src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static fallback while blob loads
      <img
        src="/tasks.gif"
        alt="Brief scrolling through follow-ups on one screen"
        width={824}
        height={1678}
        className={className}
        decoding="async"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- GIF must stay unoptimized to animate
    <img
      key={src}
      src={src}
      alt="Brief scrolling through follow-ups on one screen"
      width={824}
      height={1678}
      className={className}
      decoding="async"
    />
  );
}
