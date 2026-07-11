import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { publishEvent } from "../events/publisher";
import { EventType } from "../events/events";

const prisma = new PrismaClient();

export async function orderRoutes(app: FastifyInstance) {
  app.post("/orders", async (req, reply) => {
    const { customerId, items } = req.body as {
      customerId: string;
      items: { productId: string; name: string; quantity: number; price: number }[];
    };

    if (!customerId || !items || items.length === 0) {
      reply.status(400).send({ message: "customerId and items are required" });
      return;
    }

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await prisma.order.create({
      data: { customerId, status: "pending", items, totalAmount },
    });

    await publishEvent(EventType.ORDER_CREATED, {
      orderId: order.id,
      customerId: order.customerId,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      totalAmount,
      timestamp: new Date().toISOString(),
    });

    reply.status(201).send(order);
  });

  app.get("/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      reply.status(404).send({ message: "Order not found" });
      return;
    }
    return order;
  });

  app.get("/orders", async (req) => {
    const { customerId, all } = req.query as { customerId?: string; all?: string };
    if (all === "true") {
      return prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    }
    const where = customerId ? { customerId } : {};
    return prisma.order.findMany({ where, orderBy: { createdAt: "desc" } });
  });
}
