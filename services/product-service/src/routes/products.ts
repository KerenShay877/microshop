import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const CACHE_TTL = 60;

async function invalidateProductCache() {
  const keys = await redis.keys("products:*");
  if (keys.length) await redis.del(...keys);
  await redis.del("categories");
}

export async function productRoutes(app: FastifyInstance) {
  app.get("/products", async (req) => {
    const { search, category } = req.query as { search?: string; category?: string };
    const cacheKey = `products:${search || ""}:${category || ""}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

    await redis.set(cacheKey, JSON.stringify(products), "EX", CACHE_TTL);
    return products;
  });

  app.get("/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const cached = await redis.get(`product:${id}`);
    if (cached) return JSON.parse(cached);

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      reply.status(404).send({ message: "Product not found" });
      return;
    }

    await redis.set(`product:${id}`, JSON.stringify(product), "EX", CACHE_TTL);
    return product;
  });

  app.post("/products", async (req, reply) => {
    const { name, description, price, categoryName, stock, imageUrl } = req.body as {
      name: string;
      description: string;
      price: number;
      categoryName: string;
      stock?: number;
      imageUrl?: string;
    };

    if (!name || !description || !price || !categoryName) {
      reply.status(400).send({ message: "name, description, price, and categoryName are required" });
      return;
    }

    let category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      category = await prisma.category.create({ data: { name: categoryName } });
    }

    const product = await prisma.product.create({
      data: { name, description, price, categoryId: category.id, stock: stock ?? 0, imageUrl },
      include: { category: true },
    });

    await invalidateProductCache();
    reply.status(201).send(product);
  });

  app.put("/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const updates = req.body as Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      imageUrl: string;
      categoryName: string;
    }>;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      reply.status(404).send({ message: "Product not found" });
      return;
    }

    const data: any = { ...updates };
    if (updates.categoryName) {
      let category = await prisma.category.findUnique({ where: { name: updates.categoryName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: updates.categoryName } });
      }
      data.categoryId = category.id;
      delete data.categoryName;
    } else {
      delete data.categoryName;
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    await invalidateProductCache();
    return product;
  });

  app.delete("/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      reply.status(404).send({ message: "Product not found" });
      return;
    }
    await prisma.product.delete({ where: { id } });
    await invalidateProductCache();
    reply.status(204).send();
  });

  app.get("/categories", async () => {
    const cached = await redis.get("categories");
    if (cached) return JSON.parse(cached);

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });

    await redis.set("categories", JSON.stringify(categories), "EX", CACHE_TTL);
    return categories;
  });
}
