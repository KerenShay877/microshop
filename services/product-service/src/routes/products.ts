import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function productRoutes(app: FastifyInstance) {
  app.get("/products", async (req, reply) => {
    const { search, category } = req.query as { search?: string; category?: string };
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = { name: { equals: category, mode: "insensitive" } };
    }
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return products;
  });

  app.get("/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      reply.status(404).send({ message: "Product not found" });
      return;
    }
    return product;
  });

  app.get("/categories", async () => {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
  });
}
