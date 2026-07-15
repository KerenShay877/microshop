import amqp from "amqplib";
import { trace, propagation, diag } from "@opentelemetry/api";
import { EventType } from "./events";
import { tracer } from "../tracing";

const EXCHANGE = "microshop.events";
let channel: amqp.Channel | null = null;

export async function connectPublisher(): Promise<void> {
  const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
  const conn = await amqp.connect(url);
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("Connected to RabbitMQ as publisher");
}

export async function publishEvent(type: EventType, data: Record<string, unknown>): Promise<void> {
  if (!channel) throw new Error("Publisher not connected");
  const span = tracer.startSpan(`publish ${type}`);
  const payload = Buffer.from(JSON.stringify({ type, data }));
  const headers: Record<string, string> = {};
  propagation.inject(trace.setSpan(trace.getActiveContext(), span), headers);
  channel.publish(EXCHANGE, type, payload, {
    persistent: true,
    headers,
  });
  span.end();
  diag.info(`Published event: ${type}`);
}
