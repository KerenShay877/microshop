import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3006";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Auth service error");
  }
  return res.json();
}

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }): Promise<User> => {
    return apiFetch<User>("/auth/me", {
      headers: { Authorization: `Bearer ${ctx.user.email}` },
    });
  }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input }): Promise<AuthResponse> => {
      return apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }),

  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) }))
    .mutation(async ({ input }): Promise<AuthResponse> => {
      return apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }),
});
