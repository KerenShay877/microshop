import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "MicroShop",
  description: "Event-driven e-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-200">
        <TRPCProvider>
          <AuthProvider>
            <Nav />
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
              {children}
            </main>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
