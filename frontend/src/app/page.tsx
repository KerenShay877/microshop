"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";

interface Product {
  id: string;
  name: string;
  price: number;
  category: { name: string };
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then((all) => setFeatured(all.slice(0, 3)));
  }, []);

  return (
    <div className="bg-grid">
      <div className="text-center py-20">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="gradient-text">MicroShop</span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          An event-driven microservices e-commerce platform powered by Node.js, Go, Python, and Next.js
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/products"
            className="gradient-btn text-white px-8 py-3 rounded-xl font-medium"
          >
            Browse Products
          </a>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center text-slate-300">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((p, i) => (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-6 group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-btn opacity-80 mb-4 flex items-center justify-center text-white text-lg font-bold">
                  {p.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{p.category.name}</p>
                <div className="h-[1px] bg-white/5 mb-3" />
                <p className="text-2xl font-bold gradient-text">${p.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
