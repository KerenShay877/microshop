"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = trpc.product.byId.useQuery(id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!product) return;
    const stored = localStorage.getItem("microshop-cart");
    const items: { productId: string; name: string; price: number; quantity: number }[] = stored ? JSON.parse(stored) : [];
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId: product.id, name: product.name, price: product.price, quantity });
    }
    localStorage.setItem("microshop-cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
    setAdded(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto pt-8">
      <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2">
        &larr; Back
      </button>

      <div className="glass-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-48 h-48 rounded-2xl gradient-btn opacity-80 flex items-center justify-center text-6xl font-bold text-white">
            {(product as any).name.charAt(0)}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{(product as any).name}</h1>
                <p className="text-sm text-slate-500 uppercase tracking-wider">{(product as any).category?.name}</p>
              </div>
              <span className="text-3xl font-bold gradient-text">${(product as any).price.toFixed(2)}</span>
            </div>

            <p className="text-slate-300 mt-4 leading-relaxed">{(product as any).description}</p>

            <div className="h-[1px] bg-white/5 my-6" />

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-400">Quantity:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    -
                  </button>
                  <span className="text-white w-8 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min((product as any).stock, quantity + 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className={`text-sm ${(product as any).stock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {(product as any).stock > 0 ? `${(product as any).stock} available` : "Out of stock"}
              </span>
            </div>

            {(product as any).stock > 0 && (
              <button
                onClick={handleAdd}
                className={`mt-6 w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                  added
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "gradient-btn text-white"
                }`}
              >
                {added ? "✓ Added to Cart!" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
