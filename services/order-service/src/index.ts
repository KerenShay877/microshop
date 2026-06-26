import Fastify from "fastify";
import dotenv from "dotenv";
import amqp from "amqplib";
import { orderRoutes } from "./routes/orders";
import { connectPublisher } from "./events/publisher";
import { startConsumer } from "./events/consumer";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 2000;

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.ORDER_SERVICE_PORT || "3002");

app.get("/health", async () => {
  return { status: "ok", service: "order-service", timestamp: new Date().toISOString() };
});

app.register(orderRoutes);

async function waitForRabbitMQ(): Promise<void> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      await conn.close();
      app.log.info("RabbitMQ ready");
      return;
    } catch {
      app.log.info(`Waiting for RabbitMQ (${i + 1}/${MAX_RETRIES})...`);
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    }
  }
  throw new Error("RabbitMQ not available after maximum retries");
}

const start = async () => {
  try {
    await waitForRabbitMQ();
    await connectPublisher();
    await startConsumer();
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
