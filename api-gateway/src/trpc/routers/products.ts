import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../trpc";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category: ProductCategory;
  createdAt: string;
  updatedAt?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PRODUCT_SERVICE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Product service error");
  }
  return res.json();
}

export const productRouter = router({
  list: publicProcedure.query(async (): Promise<Product[]> => {
    return apiFetch<Product[]>("/products");
  }),

  byId: publicProcedure.input(z.string()).query(async ({ input }): Promise<Product> => {
    return apiFetch<Product>(`/products/${input}`);
  }),

  adminList: adminProcedure.query(async (): Promise<Product[]> => {
    return apiFetch<Product[]>("/products");
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      categoryName: z.string().min(1),
    }))
    .mutation(async ({ input }): Promise<Product> => {
      return apiFetch<Product>("/products", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      categoryName: z.string().min(1),
    }))
    .mutation(async ({ input }): Promise<Product> => {
      const { id, ...body } = input;
      return apiFetch<Product>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async (): Promise<void> => {
    return;
  }),
});
