"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/cartContext";
import { api } from "@/lib/api";

export default function Navbar() {
  const { user, logout }            = useAuth();
  const { itemCount }               = useCart();
  const [categories,  setCategories]  = useState([]);
  const [userMenu,    setUserMenu]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    api.get("/api/categories")
      .then((data) => setCategories(data.slice(0, 5)))
      .catch(() => {});
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-warm-white/95 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ──────────────────────────────────── */}
          <Link href="/" className="font-serif text-2xl font-light tracking-[0.3em] text-ink shrink-0">
            MS Furniture & Interiors
          </Link>

          {/* ── Desktop links ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="nav-link text-[0.78rem] font-medium tracking-[0.08em] uppercase text-muted hover:text-ink transition-colors">
              Shop
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="text-[0.78rem] font-medium tracking-[0.08em] uppercase text-muted hover:text-ink transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* ── Right actions ─────────────────────────── */}
          <div className="flex items-center gap-4">

            {/* Cart */}
            <Link href="/cart" className="relative text-ink hover:text-muted transition-colors">
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-ink text-cream text-[0.58rem] font-medium w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* ── User menu (desktop) ─────────────────── */}
            {user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                {/* Avatar button */}
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 group"
                >
                  {/* Avatar */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-accent transition-colors"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-ink text-cream font-serif flex items-center justify-center text-sm border-2 border-transparent group-hover:border-accent transition-colors">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  {/* Chevron */}
                  <ChevronIcon open={userMenu} />
                </button>

                {/* Dropdown */}
                {userMenu && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-border rounded-sm shadow-lg overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border bg-cream">
                      <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {[
                        { label: "My Orders", href: "/orders",  icon: "📦" },
                        { label: "Profile",   href: "/profile", icon: "👤" },
                        ...(user.role === "ADMIN"
                          ? [{ label: "Admin Panel", href: "/admin", icon: "⚙️" }]
                          : []),
                      ].map(({ label, href, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream transition-colors"
                        >
                          <span className="text-base">{icon}</span>
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-border py-1">
                      <button
                        onClick={() => { logout(); setUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-base">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign in button — desktop */
              <Link
                href="/auth"
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-border rounded-sm
                  text-[0.78rem] font-medium tracking-[0.08em] uppercase text-ink
                  hover:bg-ink hover:text-cream hover:border-ink transition-all"
              >
                <UserIcon />
                Sign In
              </Link>
            )}

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ───────────────────────────────── */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 z-50 h-full w-72 bg-white flex flex-col shadow-2xl">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-serif text-xl tracking-[0.3em] text-ink">MS Furniture & Interiors</span>
              <button onClick={() => setMobileOpen(false)} className="text-2xl text-muted leading-none">×</button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <p className="text-[0.62rem] uppercase tracking-widest text-muted mb-3">Shop</p>
                <MobileLink href="/shop" onClick={() => setMobileOpen(false)}>All Products</MobileLink>
                {categories.map((cat) => (
                  <MobileLink key={cat.id} href={`/shop?category=${cat.slug}`} onClick={() => setMobileOpen(false)}>
                    {cat.name}
                  </MobileLink>
                ))}
              </div>

              {user && (
                <div className="px-5 py-4 border-t border-border">
                  <p className="text-[0.62rem] uppercase tracking-widest text-muted mb-3">Account</p>
                  <MobileLink href="/orders"  onClick={() => setMobileOpen(false)}>My Orders</MobileLink>
                  <MobileLink href="/profile" onClick={() => setMobileOpen(false)}>Profile</MobileLink>
                  {user.role === "ADMIN" && (
                    <MobileLink href="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</MobileLink>
                  )}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-border">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-ink text-cream font-serif flex items-center justify-center">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="text-xs text-red-400 hover:text-red-600 shrink-0 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2.5 bg-ink text-cream text-xs uppercase tracking-widest rounded-sm hover:bg-[#2d2926] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MobileLink({ href, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center py-2.5 text-sm text-ink hover:text-muted border-b border-border/50 transition-colors"
    >
      {children}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}