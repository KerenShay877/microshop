"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/use-notifications";

const eventLabels: Record<string, string> = {
  "order.created": "Order Placed",
  "order.confirmed": "Order Confirmed",
  "order.cancelled": "Order Cancelled",
  "payment.completed": "Payment Received",
  "payment.failed": "Payment Failed",
};

export function Nav() {
  const { user, loading, logout } = useAuth();
  const { events, clearEvents } = useNotifications({ maxEvents: 10 });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unread = events.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold gradient-text tracking-tight">
          MicroShop
        </a>
        <div className="flex items-center gap-6">
          <a href="/products" className="text-slate-400 hover:text-white transition-colors duration-200">Products</a>
          <a href="/orders" className="text-slate-400 hover:text-white transition-colors duration-200">Orders</a>
          <a href="/cart" className="text-slate-400 hover:text-white transition-colors duration-200">Cart</a>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative text-slate-400 hover:text-white transition-colors duration-200 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-sm font-medium text-white">Notifications</span>
                  {unread > 0 && (
                    <button onClick={clearEvents} className="text-xs text-slate-500 hover:text-slate-300">
                      Clear all
                    </button>
                  )}
                </div>
                {events.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">No notifications yet</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {events.map((ev, i) => (
                      <div key={i} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {eventLabels[ev.type] || ev.type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {ev.data?.orderId && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Order #{String(ev.data.orderId).slice(0, 8)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <a href="/admin" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Admin</a>
              )}
              <a href="/auth/profile" className="text-sm text-purple-400 hover:text-purple-300">
                {user.name}
              </a>
              <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href="/auth/login" className="text-sm text-slate-400 hover:text-white">Sign In</a>
              <a href="/auth/register" className="gradient-btn text-white px-4 py-2 rounded-xl text-sm font-medium">
                Sign Up
              </a>
            </div>
          )}
        </div>
      </nav>
      <div className="h-[1px] gradient-border opacity-50" />
    </header>
  );
}
