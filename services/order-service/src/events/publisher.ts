import amqp from "amqplib";
import { EventType } from "./events";

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
  const payload = Buffer.from(JSON.stringify({ type, data }));
  channel.publish(EXCHANGE, type, payload, { persistent: true });
  console.log(`Published event: ${type}`);
}
