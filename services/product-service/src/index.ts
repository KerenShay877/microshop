import "./tracing";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { productRoutes } from "./routes/products";
import { tracer } from "./tracing";

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PRODUCT_SERVICE_PORT || "3001");

app.register(cors, { origin: true });

app.addHook("onRequest", (request, reply, done) => {
  const span = tracer.startSpan(`${request.method} ${request.url}`);
  reply.then(
    () => {
      span.setAttribute("http.status_code", reply.statusCode);
      span.setAttribute("http.method", request.method);
      span.setAttribute("http.url", request.url);
      span.end();
    },
    () => span.end(),
  );
  done();
});

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
