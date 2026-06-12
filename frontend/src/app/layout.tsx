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
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white shadow-sm border-b">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold">MicroShop</a>
            <div className="flex gap-4">
              <a href="/products" className="hover:text-blue-600">Products</a>
              <a href="/orders" className="hover:text-blue-600">Orders</a>
              <a href="/cart" className="hover:text-blue-600">Cart</a>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
