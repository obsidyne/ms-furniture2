"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Use this ONLY on pages that require login:
 *   - /cart
 *   - /checkout
 *   - /orders
 *   - /profile
 *
 * DO NOT use on:
 *   - / (home)
 *   - /shop
 *   - /shop/:slug (product detail)
 *   - /auth
 *
 * When not logged in → redirects to /auth
 * When loading → shows a minimal loading screen (not a full page block)
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;              // wait for Firebase to resolve
    if (!user) router.replace("/auth"); // not logged in → go to login
  }, [user, loading, router]);

  // Show loading only while Firebase is still checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-warm-white">
        <p className="font-serif italic text-muted text-lg tracking-wide">Loading…</p>
      </div>
    );
  }

  // Not logged in — null while redirect happens
  if (!user) return null;

  // Logged in — render the page
  return children;
}