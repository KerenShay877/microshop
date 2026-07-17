"use client";

import { useEffect, useState } from "react";
import { useNotifications, type NotificationEvent } from "@/lib/use-notifications";

const eventStyles: Record<string, { bg: string; icon: string }> = {
  "order.created": { bg: "bg-blue-500/20 border-blue-500/40", icon: "🛒" },
  "order.confirmed": { bg: "bg-emerald-500/20 border-emerald-500/40", icon: "✅" },
  "order.cancelled": { bg: "bg-red-500/20 border-red-500/40", icon: "❌" },
  "payment.completed": { bg: "bg-green-500/20 border-green-500/40", icon: "💳" },
  "payment.failed": { bg: "bg-red-500/20 border-red-500/40", icon: "⚠️" },
};

const eventLabels: Record<string, string> = {
  "order.created": "Order Placed",
  "order.confirmed": "Order Confirmed",
  "order.cancelled": "Order Cancelled",
  "payment.completed": "Payment Received",
  "payment.failed": "Payment Failed",
};

function Toast({ event, onDismiss }: { event: NotificationEvent; onDismiss: () => void }) {
  const style = eventStyles[event.type] || { bg: "bg-slate-500/20 border-slate-500/40", icon: "🔔" };
  const label = eventLabels[event.type] || event.type;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`${style.bg} backdrop-blur-md border rounded-xl px-4 py-3 shadow-lg animate-slide-up flex items-center gap-3 min-w-[280px]`}>
      <span className="text-lg">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400 truncate">
          {event.data?.orderId ? `Order #${String(event.data.orderId).slice(0, 8)}` : ""}
        </p>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
    </div>
  );
}

export function NotificationToast() {
  const { lastEvent } = useNotifications({ filter: ["order.created", "order.confirmed", "order.cancelled", "payment.completed", "payment.failed"] });
  const [current, setCurrent] = useState<NotificationEvent | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (lastEvent) {
      setCurrent(lastEvent);
      setKey((k) => k + 1);
    }
  }, [lastEvent]);

  if (!current) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <Toast key={key} event={current} onDismiss={() => setCurrent(null)} />
    </div>
  );
}
