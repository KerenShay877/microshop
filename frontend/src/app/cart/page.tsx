"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderResult, setOrderResult] = useState<string | null>(null);
  const placeOrder = trpc.order.create.useMutation();

  useEffect(() => {
    const stored = localStorage.getItem("microshop-cart");
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const handler = () => {
      const updated = localStorage.getItem("microshop-cart");
      if (updated) {
        try { setItems(JSON.parse(updated)); } catch { /* ignore */ }
      }
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("microshop-cart", JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const getCustomerId = () => {
    const stored = localStorage.getItem("microshop-token");
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        return payload.userId || payload.email || "guest";
      } catch { return "guest"; }
    }
    return "guest";
  };

  const handlePlaceOrder = async () => {
    try {
      await placeOrder.mutateAsync({
        customerId: getCustomerId(),
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });
      setItems([]);
      setOrderResult("Order placed successfully! Check the Orders page.");
    } catch (err: any) {
      setOrderResult(`Order failed: ${err.message}`);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 gradient-text">Cart</h1>

      {orderResult && (
        <div className="glass-card rounded-2xl p-4 mb-6 text-sm text-slate-300">
          {orderResult}
          <button onClick={() => setOrderResult(null)} className="ml-4 text-purple-400 hover:text-purple-300">
            Dismiss
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">Your cart is empty</p>
          <a href="/products" className="gradient-btn text-white px-8 py-3 rounded-xl font-medium inline-block mt-6">
            Browse Products
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="glass-card rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{item.name}</h3>
                  <p className="text-sm text-slate-400">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20">-</button>
                    <span className="text-white w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20">+</button>
                  </div>
                  <span className="text-lg font-bold gradient-text w-24 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items ({items.length})</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400">Free</span>
              </div>
              <div className="h-[1px] bg-white/5 my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="gradient-text">${total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} className="gradient-btn text-white w-full py-3 rounded-xl font-medium mt-6">
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
