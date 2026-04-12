"use client";

import { useState } from "react";
import { useAuthActions } from "@/hooks/useAuthActions";

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const { loginAsAdmin, loading, error } = useAuthActions();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAsAdmin(email, password);
  };

  return (
    <div className="flex min-h-screen bg-ink items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="block font-serif text-5xl font-light tracking-[0.35em] text-cream mb-2">
            MS Furniture
          </span>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/30">
            Admin Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-sm px-8 py-8">
          <h1 className="text-xs font-medium tracking-[0.12em] uppercase text-white/40 mb-6">
            Sign in to continue
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] uppercase tracking-[0.1em] font-medium text-white/40">
                Email
              </label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-sm
                  text-cream placeholder:text-white/20 outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.68rem] uppercase tracking-[0.1em] font-medium text-white/40">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-sm
                  text-cream placeholder:text-white/20 outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 bg-accent text-ink text-xs font-medium tracking-[0.15em]
                uppercase rounded-sm hover:bg-accent-dark disabled:opacity-50
                disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-white/20">
          Not an admin?{" "}
          <a href="/" className="text-white/40 hover:text-white/60 underline transition-colors">
            Back to store
          </a>
        </p>

      </div>
    </div>
  );
}