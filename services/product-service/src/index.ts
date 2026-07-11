import Fastify from "fastify";
import cors from "@fastify/cors";
import { productRoutes } from "./routes/products";

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PRODUCT_SERVICE_PORT || "3001");

app.register(cors, { origin: true });

app.get("/health", async () => {
  return { status: "ok", service: "product-service", timestamp: new Date().toISOString() };
});

app.register(productRoutes);

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
