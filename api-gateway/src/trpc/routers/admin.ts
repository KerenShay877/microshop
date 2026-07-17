import { z } from "zod";
import { router, adminProcedure } from "../trpc";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3002";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3006";

interface AdminStats {
  products: number;
  orders: number;
  revenue: number;
  users: number;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerId: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

export const adminRouter = router({
  stats: adminProcedure.query(async (): Promise<AdminStats> => {
    const [productsRes, ordersRes, usersRes] = await Promise.all([
      fetch(`${PRODUCT_SERVICE_URL}/products`),
      fetch(`${ORDER_SERVICE_URL}/orders`),
      fetch(`${AUTH_SERVICE_URL}/auth/users/count`),
    ]);
    const products: unknown = await productsRes.json();
    const orders: unknown = await ordersRes.json();
    const users: { count?: number } = await usersRes.json() as { count?: number };
    return {
      products: Array.isArray(products) ? (products as any[]).length : 0,
      orders: Array.isArray(orders) ? (orders as any[]).length : 0,
      revenue: Array.isArray(orders) ? (orders as any[]).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) : 0,
      users: users.count || 0,
    };
  }),

  ordersList: adminProcedure.query(async (): Promise<Order[]> => {
    const res = await fetch(`${ORDER_SERVICE_URL}/orders?all=true`);
    return res.json();
  }),

  updateOrderStatus: adminProcedure
    .input(z.object({ orderId: z.string(), status: z.string() }))
    .mutation(async ({ input }): Promise<Order> => {
      const res = await fetch(`${ORDER_SERVICE_URL}/orders/${input.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: input.status }),
      });
      return res.json();
    }),
});
