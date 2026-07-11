import { publicProcedure, router } from "../trpc";

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";

interface Category {
  id: string;
  name: string;
}

export const categoryRouter = router({
  list: publicProcedure.query(async (): Promise<Category[]> => {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/categories`);
    return res.json();
  }),
});
