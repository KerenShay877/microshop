import os
import json
import uuid
import random
import logging
from datetime import datetime, timezone

import aio_pika
from sqlalchemy import select
from app.database import async_session
from app.models import Payment

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672")
EXCHANGE = "microshop.events"
QUEUE = "payment-service-queue"
FAILURE_RATE = float(os.getenv("PAYMENT_FAILURE_RATE", "0.0"))

connection: aio_pika.RobustConnection | None = None


async def connect():
    global connection
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    return connection


async def publish_event(routing_key: str, data: dict):
    if not connection:
        await connect()
    async with connection.channel() as channel:
        exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
        message = aio_pika.Message(
            body=json.dumps({"type": routing_key, "data": data}).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await exchange.publish(message, routing_key)
        logger.info(f"Published event: {routing_key}")


async def start_consumer():
    global connection
    if not connection:
        await connect()

    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)

    exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue(QUEUE, durable=True)

    routing_keys = ["inventory.reserved", "order.cancelled"]
    for key in routing_keys:
        await queue.bind(exchange, key)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                try:
                    body = json.loads(message.body.decode())
                    await handle_event(body.get("type"), body.get("data", {}))
                except Exception as e:
                    logger.error(f"Failed to process message: {e}")


async def handle_event(event_type: str, data: dict):
    if event_type == "inventory.reserved":
        await process_payment(data)
    elif event_type == "order.cancelled":
        await refund_payment(data)


async def process_payment(data: dict):
    order_id = data.get("orderId")
    amount = data.get("totalAmount", 0)

    if not order_id or amount <= 0:
        logger.error(f"Invalid payment data for order {order_id}: amount={amount}")
        await publish_event("payment.failed", {
            "orderId": order_id,
            "reason": "Invalid order data",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return

    idempotency_key = f"payment:{order_id}"

    async with async_session() as session:
        existing = await session.execute(
            select(Payment).where(Payment.idempotency_key == idempotency_key)
        )
        if existing.scalar_one_or_none():
            logger.info(f"Payment already processed for order {order_id}, skipping")
            return

        should_fail = random.random() < FAILURE_RATE

        if should_fail:
            payment = Payment(
                order_id=order_id,
                amount=amount,
                status="failed",
                idempotency_key=idempotency_key,
            )
            session.add(payment)
            await session.commit()
            await publish_event("payment.failed", {
                "orderId": order_id,
                "reason": "Payment declined (simulated failure)",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Payment failed for order {order_id}")
        else:
            payment = Payment(
                order_id=order_id,
                amount=amount,
                status="completed",
                transaction_id=str(uuid.uuid4()),
                idempotency_key=idempotency_key,
            )
            session.add(payment)
            await session.commit()
            await publish_event("payment.completed", {
                "orderId": order_id,
                "transactionId": payment.transaction_id,
                "amount": amount,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Payment completed for order {order_id}")


async def refund_payment(data: dict):
    order_id = data.get("orderId")
    if not order_id:
        return

    async with async_session() as session:
        result = await session.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        payment = result.scalar_one_or_none()
        if payment and payment.status != "refunded":
            payment.status = "refunded"
            await session.commit()
            logger.info(f"Payment refunded for order {order_id}")
