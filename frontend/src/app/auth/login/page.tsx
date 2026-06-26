"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12">
      <div className="glass-card rounded-2xl p-8">
        <h1 className="text-3xl font-bold gradient-text mb-6 text-center">Sign In</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark rounded-xl px-4 py-3 w-full"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark rounded-xl px-4 py-3 w-full"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="gradient-btn text-white w-full py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          Don&apos;t have an account?{" "}
          <a href="/auth/register" className="text-purple-400 hover:text-purple-300">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
