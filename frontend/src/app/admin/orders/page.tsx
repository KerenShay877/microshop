"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

const statusColors: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-blue-400",
  shipped: "text-purple-400",
  delivered: "text-emerald-400",
  cancelled: "text-red-400",
};

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: orders, refetch } = trpc.admin.ordersList.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const updateStatus = trpc.admin.updateOrderStatus.useMutation();
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") { router.push("/auth/login"); return; }
  }, [user, loading, router]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      refetch();
    } catch { /* ignore */ }
  };

  const filtered = filter ? (orders ?? []).filter((o: any) => o.status === filter) : (orders ?? []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <a href="/admin" className="text-sm text-purple-400 hover:text-purple-300">&larr; Dashboard</a>
        <h1 className="text-3xl font-bold gradient-text mt-1">Orders</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setFilter("")} className={`px-4 py-2 rounded-xl text-sm ${!filter ? "gradient-btn text-white" : "text-slate-400 bg-white/5"}`}>All</button>
        {statuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm capitalize ${filter === s ? "gradient-btn text-white" : "text-slate-400 bg-white/5"}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((order: any) => (
          <div key={order.id} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500 font-mono">{order.id?.slice(0, 8)}...</span>
              <span className={`text-sm font-semibold capitalize ${statusColors[order.status] || "text-slate-400"}`}>{order.status}</span>
            </div>
            <div className="text-xs text-slate-500 mb-3">Customer: {order.customerId?.slice(0, 8)}...</div>
            <div className="space-y-1 mb-4">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.name} x{item.quantity}</span>
                  <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="h-[1px] bg-white/5 mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold gradient-text">${order.totalAmount?.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Status:</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="input-dark rounded-lg px-3 py-1.5 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-500 py-10">No orders found</p>}
      </div>
    </div>
  );
}
