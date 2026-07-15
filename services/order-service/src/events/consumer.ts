import amqp from "amqplib";
import { trace, propagation, context } from "@opentelemetry/api";
import { PrismaClient } from "@prisma/client";
import { EventType } from "./events";
import { publishEvent } from "./publisher";
import { tracer } from "../tracing";

const EXCHANGE = "microshop.events";
const QUEUE = "order-service-queue";
const prisma = new PrismaClient();

export async function startConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  const conn = await amqp.connect(url);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  const q = await channel.assertQueue(QUEUE, { durable: true });

  const routingKeys = [
    EventType.INVENTORY_RESERVED,
    EventType.INVENTORY_RESERVATION_FAILED,
    EventType.PAYMENT_COMPLETED,
    EventType.PAYMENT_FAILED,
  ];

  for (const key of routingKeys) {
    await channel.bindQueue(q.queue, EXCHANGE, key);
  }

  await channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    const parentContext = propagation.extract(
      trace.getActiveContext() || context.active(),
      msg.properties.headers || {},
    );
    await context.with(parentContext, async () => {
      const span = tracer.startSpan(`consume ${msg.fields.routingKey}`);
      await context.with(trace.setSpan(context.active(), span), async () => {
        try {
          const { type, data } = JSON.parse(msg.content.toString());
          await handleEvent(type, data);
          channel.ack(msg);
        } catch (err) {
          console.error("Failed to handle event:", err);
          channel.nack(msg, false, false);
        }
        span.end();
      });
    });
  });

  console.log("Order service consumer started");
}

async function handleEvent(type: string, data: any): Promise<void> {
  switch (type) {
    case EventType.INVENTORY_RESERVED:
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: "confirmed" },
      });
      await publishEvent(EventType.ORDER_CONFIRMED, {
        orderId: data.orderId,
        transactionId: data.orderId,
        timestamp: new Date().toISOString(),
      });
      console.log(`Order ${data.orderId} confirmed`);
      break;

    case EventType.INVENTORY_RESERVATION_FAILED:
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: "cancelled" },
      });
      console.log(`Order ${data.orderId} cancelled due to inventory`);
      break;

    case EventType.PAYMENT_COMPLETED:
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: "shipped" },
      });
      console.log(`Order ${data.orderId} shipped`);
      break;

    case EventType.PAYMENT_FAILED:
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: "cancelled" },
      });
      await publishEvent(EventType.ORDER_CANCELLED, {
        orderId: data.orderId,
        reason: "Payment failed",
        timestamp: new Date().toISOString(),
      });
      console.log(`Order ${data.orderId} cancelled due to payment failure`);
      break;
  }
}
