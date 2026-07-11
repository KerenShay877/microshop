import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3002";

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ORDER_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Order service error");
  }
  return res.json();
}

export const orderRouter = router({
  myOrders: protectedProcedure.query(async ({ ctx }): Promise<Order[]> => {
    return apiFetch<Order[]>(`/orders?customerId=${ctx.user.userId}`);
  }),

  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number(),
      })),
    }))
    .mutation(async ({ input }): Promise<Order> => {
      return apiFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }),
});
