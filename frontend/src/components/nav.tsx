"use client";

import { useAuth } from "@/lib/auth-context";

export function Nav() {
  const { user, loading, logout } = useAuth();

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
