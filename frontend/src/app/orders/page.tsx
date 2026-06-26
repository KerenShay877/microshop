"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3005";

interface Order {
  id: string;
  customerId: string;
  status: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-blue-400",
  shipped: "text-purple-400",
  delivered: "text-emerald-400",
  cancelled: "text-red-400",
};

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API_URL}/api/orders`, { headers })
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const eventType = msg.type || "";
          const eventData = msg.data || {};

          setNotifications((prev) => [
            `Event: ${eventType} — ${JSON.stringify(eventData)}`,
            ...prev.slice(0, 9),
          ]);

          if (
            eventData.orderId &&
            ["order.confirmed", "order.cancelled", "order.created"].includes(eventType)
          ) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === eventData.orderId
                  ? { ...o, status: eventType.replace("order.", "") }
                  : o
              )
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const placeTestOrder = useCallback(async () => {
    const body = {
      customerId: "test-user",
      items: [
        { productId: "test-product", name: "Wireless Headphones", quantity: 1, price: 79.99 },
      ],
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const order = await res.json();
      setOrders((prev) => [order, ...prev]);
    } catch (err) {
      console.error("Failed to place order:", err);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text">Orders</h1>
        <button
          onClick={placeTestOrder}
          className="gradient-btn text-white px-6 py-3 rounded-xl font-medium"
        >
          Place Test Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {orders.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">No orders yet. Place one to get started!</p>
            </div>
          )}

          {orders.map((order) => (
            <div key={order.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 font-mono">
                  {order.id.slice(0, 8)}...
                </span>
                <span className={`text-sm font-semibold ${statusColors[order.status] || "text-slate-400"}`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {(order.items as any[]).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {item.name || item.productId} x{item.quantity}
                    </span>
                    <span className="text-slate-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-[1px] bg-white/5 mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xl font-bold gradient-text">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-white mb-4">Live Events</h2>
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500">Waiting for events...</p>
          )}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {notifications.map((n, i) => (
              <div key={i} className="text-xs text-slate-400 font-mono bg-white/5 rounded-lg p-2">
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
