"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-12">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-full gradient-btn mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
        <p className="text-slate-400 mb-6">{user.email}</p>
        <div className="h-[1px] bg-white/5 mb-6" />
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="gradient-btn text-white w-full py-3 rounded-xl font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
