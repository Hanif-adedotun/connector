# syntax=docker/dockerfile:1

FROM oven/bun:1.2.21 AS base

# --- Backend dependencies ---
FROM base AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile

# --- Frontend dependencies ---
FROM base AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

# --- Backend: Prisma client ---
FROM backend-deps AS backend-build
COPY backend/ .
RUN bun run prisma:generate

# --- Frontend: Next.js production build ---
FROM frontend-deps AS frontend-build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NODE_ENV=production
COPY frontend/ .
RUN bun run build

# --- Production image ---
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=backend-build /app/backend ./backend
COPY --from=frontend-build /app/frontend ./frontend
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:4000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
