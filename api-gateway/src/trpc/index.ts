import { router } from "./trpc";
import { productRouter } from "./routers/products";
import { categoryRouter } from "./routers/categories";
import { orderRouter } from "./routers/orders";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  product: productRouter,
  category: categoryRouter,
  order: orderRouter,
  auth: authRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
