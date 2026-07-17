#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z payment-db 5432 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Waiting for RabbitMQ..."
until nc -z rabbitmq 5672 2>/dev/null; do
  sleep 1
done
echo "RabbitMQ ready!"

exec "$@"
