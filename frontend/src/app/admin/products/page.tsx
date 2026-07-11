"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: products, refetch } = trpc.product.adminList.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  const createMutation = trpc.product.create.useMutation();
  const updateMutation = trpc.product.update.useMutation();
  const deleteMutation = trpc.product.delete.useMutation();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "0", categoryName: "" });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") { router.push("/auth/login"); return; }
  }, [user, loading, router]);

  const saveProduct = async () => {
    const body = { name: form.name, description: form.description, price: parseFloat(form.price), stock: parseInt(form.stock), categoryName: form.categoryName };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...body });
      } else {
        await createMutation.mutateAsync(body);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", description: "", price: "", stock: "0", categoryName: "" });
      refetch();
    } catch { /* ignore */ }
  };

  const deleteProduct = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); refetch(); } catch { /* ignore */ }
  };

  const editProduct = (product: any) => {
    setEditing(product);
    setForm({ name: product.name, description: product.description, price: String(product.price), stock: String(product.stock), categoryName: product.category?.name || "" });
    setShowForm(true);
  };

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
        <div>
          <a href="/admin" className="text-sm text-purple-400 hover:text-purple-300">&larr; Dashboard</a>
          <h1 className="text-3xl font-bold gradient-text mt-1">Products</h1>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: "", description: "", price: "", stock: "0", categoryName: "" }); setShowForm(true); }} className="gradient-btn text-white px-6 py-3 rounded-xl font-medium">
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? "Edit Product" : "New Product"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-dark rounded-xl px-4 py-3" />
            <input placeholder="Category" value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className="input-dark rounded-xl px-4 py-3" />
            <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-dark rounded-xl px-4 py-3" />
            <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-dark rounded-xl px-4 py-3" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-dark rounded-xl px-4 py-3 w-full mt-4" rows={3} />
          <div className="flex gap-3 mt-4">
            <button onClick={saveProduct} className="gradient-btn text-white px-6 py-3 rounded-xl font-medium">Save</button>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white px-6 py-3">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-slate-400 text-left">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-white">{p.name}</td>
                <td className="p-4 text-slate-400">{p.category?.name}</td>
                <td className="p-4 text-white">${p.price.toFixed(2)}</td>
                <td className="p-4"><span className={p.stock > 0 ? "text-emerald-400" : "text-red-400"}>{p.stock}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => editProduct(p)} className="text-purple-400 hover:text-purple-300 mr-4">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || (products as any[]).length === 0) && <p className="text-center text-slate-500 py-10">No products</p>}
      </div>
    </div>
  );
}
