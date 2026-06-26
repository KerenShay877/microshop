#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z order-db 5432 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Running database push..."
npx prisma db push --accept-data-loss

echo "Starting service..."
exec node dist/index.js
