"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Wraps all /admin/* pages except /admin/login.
 * - Not logged in     → /admin/login
 * - role === USER     → / (wrong role)
 * - role === ADMIN    → render children ✅
 */
export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user)                 router.replace("/admin/login");
    else if (user.role !== "ADMIN") router.replace("/");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <p className="font-serif italic text-white/30 text-lg tracking-widest">
          Loading…
        </p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return children;
}