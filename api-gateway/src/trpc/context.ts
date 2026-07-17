import { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export interface User {
  userId: string;
  email: string;
  role: string;
}

export async function createContext({ req }: CreateExpressContextOptions) {
  let user: User | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as User;
    } catch {}
  }
  return { user };
}

export type Context = inferAsyncReturnType<typeof createContext>;
