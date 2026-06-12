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
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Welcome to MicroShop</h1>
      <p className="text-lg text-gray-600 mb-8">
        An event-driven microservices e-commerce platform
      </p>
      <div className="flex justify-center gap-4 mb-12">
        <a
          href="/products"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Browse Products
        </a>
      </div>

      {featured.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {featured.map((p) => (
              <div key={p.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-gray-500 text-sm">{p.category.name}</p>
                <p className="text-xl font-bold mt-2">${p.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
