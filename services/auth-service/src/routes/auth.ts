import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };

    if (!email || !password || !name) {
      reply.status(400).send({ message: "email, password, and name are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      reply.status(409).send({ message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hashed },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    reply.status(201).send({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.post("/auth/login", async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      reply.status(400).send({ message: "email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      reply.status(401).send({ message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      reply.status(401).send({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  app.get("/auth/me", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      reply.status(401).send({ message: "Missing authorization header" });
      return;
    }

    try {
      const decoded = jwt.verify(auth.split(" ")[1], JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        reply.status(404).send({ message: "User not found" });
        return;
      }
      reply.send({ id: user.id, email: user.email, name: user.name });
    } catch {
      reply.status(403).send({ message: "Invalid or expired token" });
    }
  });
}
