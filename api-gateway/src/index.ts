import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware, type RequestHandler } from "http-proxy-middleware";
import dotenv from "dotenv";
import { authMiddleware, optionalAuth } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3002";
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:3003";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3004";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3006";

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway", timestamp: new Date().toISOString() });
});

const productProxy = createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
});

const orderProxy = createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
});

const inventoryProxy = createProxyMiddleware({
  target: INVENTORY_SERVICE_URL,
  changeOrigin: true,
});

const paymentProxy = createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
});

const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
});

function proxyWithRewrite(proxy: RequestHandler, prefix: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.url = req.originalUrl.replace(prefix, "");
    proxy(req, res, next);
  };
}

// Public routes
app.use("/api/products", proxyWithRewrite(productProxy, "/api"));
app.use("/api/categories", proxyWithRewrite(productProxy, "/api"));

// Auth routes (public)
app.use("/api/auth", proxyWithRewrite(authProxy, "/api"));

// Protected routes (optional auth for orders — allow browsing without login)
app.use("/api/orders", optionalAuth, proxyWithRewrite(orderProxy, "/api"));
app.use("/api/inventory", authMiddleware, proxyWithRewrite(inventoryProxy, "/api"));
app.use("/api/payments", authMiddleware, proxyWithRewrite(paymentProxy, "/api"));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying /api/products -> ${PRODUCT_SERVICE_URL}/products`);
  console.log(`Proxying /api/orders -> ${ORDER_SERVICE_URL}/orders`);
  console.log(`Proxying /api/inventory -> ${INVENTORY_SERVICE_URL}`);
  console.log(`Proxying /api/payments -> ${PAYMENT_SERVICE_URL}`);
  console.log(`Proxying /api/auth -> ${AUTH_SERVICE_URL}/auth`);
});
