#!/bin/sh
set -e

cd /app/backend
echo "Running database migrations..."
bunx prisma migrate deploy

echo "Starting backend (port 4000)..."
bun src/index.ts &
BACKEND_PID=$!

echo "Starting frontend (port 4001)..."
cd /app/frontend
bun run start &
FRONTEND_PID=$!

term_handler() {
  kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap term_handler TERM INT

# Exit when either process exits, then stop the other.
wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?
term_handler
exit "$EXIT_CODE"
