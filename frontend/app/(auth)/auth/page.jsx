"use client";

import { useState } from "react";
import { useAuthActions } from "@/hooks/useAuthActions";

export default function AuthPage() {
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const { loginWithGoogle, loginWithEmail, registerWithEmail, loading, error } =
    useAuthActions();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") loginWithEmail(email, password);
    else registerWithEmail(name, email, password);
  };

  const inputClass =
    "px-4 py-3 border border-border rounded-sm bg-cream text-ink text-sm placeholder:text-muted/50 outline-none focus:border-accent transition-colors w-full";

  return (
    <div className="flex min-h-screen">

      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="hidden md:flex flex-1 bg-ink items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-accent opacity-10 blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-accent opacity-5  blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <span className="block font-serif text-7xl font-light tracking-[0.35em] text-cream mb-6">
            MS Furniture
          </span>
          <p className="font-serif italic font-light text-xl text-accent tracking-wide leading-relaxed max-w-xs mx-auto mb-10">
            Furniture crafted for the way you live.
          </p>
          <div className="w-10 h-px bg-accent opacity-60 mx-auto" />
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-warm-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <span className="font-serif text-4xl font-light tracking-[0.3em] text-ink">MS</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-8">
            {[
              { key: "login",    label: "Sign In"        },
              { key: "register", label: "Create Account" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 pb-3 text-xs font-medium tracking-[0.08em] uppercase transition-colors relative
                  ${mode === key ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                {label}
                {mode === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-ink" />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.7rem] font-medium tracking-[0.1em] uppercase text-muted">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.7rem] font-medium tracking-[0.1em] uppercase text-muted">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.7rem] font-medium tracking-[0.1em] uppercase text-muted">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 bg-ink text-cream text-xs font-medium tracking-[0.12em] uppercase rounded-sm
                hover:bg-[#2d2926] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs tracking-wider text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-border rounded-sm
              text-sm text-ink hover:border-accent hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>

        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}