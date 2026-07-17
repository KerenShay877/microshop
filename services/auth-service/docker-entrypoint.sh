#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z auth-db 5432 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Running database push..."
bunx prisma db push --skip-generate
echo "Running generate..."
bunx prisma generate

echo "Running seed..."
bun run src/seed.ts

echo "Starting service..."
exec "$@"
