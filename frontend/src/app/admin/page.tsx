"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") router.push("/auth/login");
  }, [user, loading, router]);

  if (loading || statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: "Products", value: stats.products, href: "/admin/products", color: "from-blue-500 to-cyan-500" },
    { label: "Orders", value: stats.orders, href: "/admin/orders", color: "from-purple-500 to-pink-500" },
    { label: "Users", value: stats.users, color: "from-emerald-500 to-teal-500" },
    { label: "Revenue", value: `$${stats.revenue.toFixed(2)}`, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold gradient-text mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => (
          <a key={card.label} href={card.href || "#"} className={`glass-card rounded-2xl p-6 ${card.href ? "hover:opacity-80" : ""}`}>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} mb-3 flex items-center justify-center text-white text-sm font-bold`}>
              {card.label.charAt(0)}
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-slate-400 mt-1">{card.label}</p>
          </a>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <a href="/admin/products" className="glass-card rounded-2xl p-6 hover:opacity-80">
          <h2 className="text-lg font-semibold text-white mb-2">Manage Products</h2>
          <p className="text-sm text-slate-400">Create, edit, and remove products from the catalog</p>
        </a>
        <a href="/admin/orders" className="glass-card rounded-2xl p-6 hover:opacity-80">
          <h2 className="text-lg font-semibold text-white mb-2">Manage Orders</h2>
          <p className="text-sm text-slate-400">View all orders and update their status</p>
        </a>
      </div>
    </div>
  );
}
