#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z product-db 5432 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Running database push..."
bunx prisma db push --accept-data-loss

echo "Running seed..."
bun run prisma/seed.ts

echo "Starting service..."
exec bun run src/index.ts
