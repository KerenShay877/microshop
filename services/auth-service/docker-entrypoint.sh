#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z auth-db 5432 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Running database push..."
npx prisma db push --skip-generate
echo "Running generate..."
npx prisma generate

echo "Starting service..."
exec "$@"
