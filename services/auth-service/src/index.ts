import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { authRoutes } from "./routes/auth";

dotenv.config();

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.AUTH_SERVICE_PORT || "3006");

app.register(cors, { origin: true });

app.get("/health", async () => {
  return { status: "ok", service: "auth-service", timestamp: new Date().toISOString() };
});

app.register(authRoutes);

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
