import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.NOTIFICATION_SERVICE_PORT || "3005");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const EXCHANGE = "microshop.events";
const QUEUE = "notification-service-queue";
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 2000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service", timestamp: new Date().toISOString() });
});

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "connected", message: "Notification service connected" }));

  ws.on("close", () => {
    clients.delete(ws);
  });
});

function broadcast(event: object) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function waitForRabbitMQ(): Promise<void> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      await conn.close();
      console.log("RabbitMQ ready");
      return;
    } catch {
      console.log(`Waiting for RabbitMQ (${i + 1}/${MAX_RETRIES})...`);
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    }
  }
  throw new Error("RabbitMQ not available after maximum retries");
}

async function startConsumer() {
  await waitForRabbitMQ();
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  const q = await channel.assertQueue(QUEUE, { durable: true });

  const routingKeys = ["order.*", "inventory.*", "payment.*"];
  for (const key of routingKeys) {
    await channel.bindQueue(q.queue, EXCHANGE, key);
  }

  await channel.consume(q.queue, (msg) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      broadcast(content);
      channel.ack(msg);
    } catch (err) {
      console.error("Failed to process message:", err);
      channel.nack(msg, false, false);
    }
  });

  console.log("Notification service consumer started");
}

server.listen(PORT, async () => {
  await startConsumer();
  console.log(`Notification service running on port ${PORT}`);
});
