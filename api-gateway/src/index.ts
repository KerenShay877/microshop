import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  createProxyMiddleware,
  type RequestHandler,
} from "http-proxy-middleware";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authMiddleware, optionalAuth, requireAdmin } from "./middleware/auth";
import { appRouter } from "./trpc";
import { createContext } from "./trpc/context";

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:3002";
const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3003";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3004";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3006";

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext }),
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
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
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    req.url = req.originalUrl.replace(prefix, "");
    proxy(req, res, next);
  };
}

// Public routes
app.use("/api/products", proxyWithRewrite(productProxy, "/api"));
app.use("/api/categories", proxyWithRewrite(productProxy, "/api"));

// Auth routes (public)
app.use("/api/auth", proxyWithRewrite(authProxy, "/api"));

// Protected routes
app.use("/api/orders", optionalAuth, proxyWithRewrite(orderProxy, "/api"));
app.use(
  "/api/inventory",
  authMiddleware,
  proxyWithRewrite(inventoryProxy, "/api"),
);
app.use(
  "/api/payments",
  authMiddleware,
  proxyWithRewrite(paymentProxy, "/api"),
);

// Admin routes (auth + admin role check)
app.use("/api/admin", authMiddleware, requireAdmin);
app.all("/api/admin/products*", proxyWithRewrite(productProxy, "/api/admin"));
app.all("/api/admin/orders", (req, res, next) => {
  req.url =
    "/orders?all=true" +
    (req.url.includes("?") ? "&" + req.url.split("?")[1] : "");
  orderProxy(req, res, next);
});
app.all("/api/admin/stats", async (_req, res) => {
  try {
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      fetch(`${PRODUCT_SERVICE_URL}/products`),
      fetch(`${ORDER_SERVICE_URL}/orders`),
      fetch(`${AUTH_SERVICE_URL}/auth/users/count`, {
        headers: { Authorization: _req.headers.authorization || "" },
      }),
    ]);
    const products: unknown = await productsRes.json();
    const orders: unknown = await ordersRes.json();
    const users: { count?: number } = (await usersRes.json()) as {
      count?: number;
    };
    res.json({
      products: Array.isArray(products) ? (products as any[]).length : 0,
      orders: Array.isArray(orders) ? (orders as any[]).length : 0,
      revenue: Array.isArray(orders)
        ? (orders as any[]).reduce(
            (sum: number, o: any) => sum + (o.totalAmount || 0),
            0,
          )
        : 0,
      users: users.count || 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying /api/products -> ${PRODUCT_SERVICE_URL}/products`);
  console.log(`Proxying /api/orders -> ${ORDER_SERVICE_URL}/orders`);
  console.log(`Proxying /api/inventory -> ${INVENTORY_SERVICE_URL}`);
  console.log(`Proxying /api/payments -> ${PAYMENT_SERVICE_URL}`);
  console.log(`Proxying /api/auth -> ${AUTH_SERVICE_URL}/auth`);
  console.log(`Proxying /api/admin -> admin-protected routes`);
});
