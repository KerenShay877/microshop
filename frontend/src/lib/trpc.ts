import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@gateway/trpc/index";

export const trpc = createTRPCReact<AppRouter>();
