import Fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.ORDER_SERVICE_PORT || "3002");

app.get("/health", async () => {
  return { status: "ok", service: "order-service", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
