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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then((cats) => setCategories(cats.map((c: any) => c.name)));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category.name === category;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="text-center py-8 text-gray-500">Loading products...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{product.category.name}</p>
            <p className="text-gray-600 mt-2 text-sm">{product.description}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-400">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
