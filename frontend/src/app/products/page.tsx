"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
}

function addToCart(product: Product) {
  const stored = localStorage.getItem("microshop-cart");
  const items: { productId: string; name: string; price: number; quantity: number }[] = stored ? JSON.parse(stored) : [];
  const existing = items.find((i) => i.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ productId: product.id, name: product.name, price: product.price, quantity: 1 });
  }
  localStorage.setItem("microshop-cart", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((cats) => setCategories(cats.map((c: any) => c.name)));
  }, []);

  const handleAdd = (product: Product) => {
    addToCart(product);
    setAdded((prev) => new Set(prev).add(product.id));
    setTimeout(() => setAdded((prev) => { const next = new Set(prev); next.delete(product.id); return next; }), 1500);
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category.name === category;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 gradient-text">Products</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark rounded-xl px-4 py-3 flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-dark rounded-xl px-4 py-3 min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="glass-card rounded-2xl p-6">
            <a href={`/products/${product.id}`}>
              <div className="w-10 h-10 rounded-lg gradient-btn opacity-80 mb-3 flex items-center justify-center text-white text-sm font-bold">
                {product.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">{product.name}</h2>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                {product.category.name}
              </p>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{product.description}</p>
            </a>
            <div className="h-[1px] bg-white/5 mb-4" />
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold gradient-text">
                ${product.price.toFixed(2)}
              </span>
              <span className={`text-sm ${product.stock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
            {product.stock > 0 && (
              <button
                onClick={() => handleAdd(product)}
                className={`mt-4 w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  added.has(product.id)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "gradient-btn text-white"
                }`}
              >
                {added.has(product.id) ? "✓ Added to Cart" : "Add to Cart"}
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
}
