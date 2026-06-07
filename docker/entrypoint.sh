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

# Wait until either process exits (POSIX-compatible)
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

wait "$BACKEND_PID" 2>/dev/null || true
BACKEND_EXIT=$?
wait "$FRONTEND_PID" 2>/dev/null || true
FRONTEND_EXIT=$?

term_handler
exit $(( BACKEND_EXIT != 0 ? BACKEND_EXIT : FRONTEND_EXIT ))