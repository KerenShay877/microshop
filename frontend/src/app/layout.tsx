import type { Metadata } from "next";
import "@/styles/globals.css";

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
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold gradient-text tracking-tight">
              MicroShop
            </a>
            <div className="flex gap-6">
              <a href="/products" className="text-slate-400 hover:text-white transition-colors duration-200">Products</a>
              <a href="/orders" className="text-slate-400 hover:text-white transition-colors duration-200">Orders</a>
              <a href="/cart" className="text-slate-400 hover:text-white transition-colors duration-200">Cart</a>
            </div>
          </nav>
          <div className="h-[1px] gradient-border opacity-50" />
        </header>
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
