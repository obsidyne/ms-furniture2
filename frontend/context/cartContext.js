"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CartContext = createContext(null);
const LS_KEY      = "arvo_guest_cart";

const lsGet   = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } };
const lsSet   = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));
const lsClear = ()      => localStorage.removeItem(LS_KEY);
const calcSub = (list)  => +list.reduce((s, i) => s + Number(i.product?.price ?? 0) * i.quantity, 0).toFixed(2);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [items,    setItems]    = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading,  setLoading]  = useState(false);

  const prevUserIdRef = useRef(undefined);

  // ── Internal fetch — always called with explicit user ─────
  async function doFetchCart(u) {
    if (!u || u.role === "ADMIN") return;
    console.log("[Cart] fetching DB cart for:", u.email);
    try {
      setLoading(true);
      const data = await api.get("/api/cart");
      setItems(data.items);
      setSubtotal(data.subtotal);
    } catch (err) {
      console.error("[Cart] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Internal merge ────────────────────────────────────────
  async function doMerge(u) {
    const guest = lsGet();
    console.log("[Cart] merge — guest items:", guest.length, "user:", u.email);
    if (guest.length === 0) {
      await doFetchCart(u);
      return;
    }
    try {
      const data = await api.post("/api/cart/merge", {
        items: guest.map(({ productId, quantity }) => ({ productId, quantity })),
      });
      setItems(data.items);
      setSubtotal(data.subtotal);
      lsClear();
    } catch (err) {
      console.error("[Cart] merge error:", err.message);
      await doFetchCart(u);
    }
  }

  // ── Auth state changes ────────────────────────────────────
  useEffect(() => {
    // Wait for auth to finish loading before doing anything
    if (authLoading) return;

    const prevId = prevUserIdRef.current;
    const currId = user?.id ?? null;

    // Skip if nothing changed
    if (prevId === currId) return;
    prevUserIdRef.current = currId;

    console.log("[Cart] auth change:", prevId, "→", currId);

    if (user && user.role !== "ADMIN") {
      // Logged in
      if (!prevId) {
        doMerge(user); // first login or page load while logged in
      } else {
        doFetchCart(user); // user object updated
      }
    } else {
      // Logged out — load from localStorage
      const guest = lsGet();
      setItems(guest);
      setSubtotal(calcSub(guest));
    }
  }, [user, authLoading]);

  // ── addToCart — reads user at call time, no closure issue ─
  async function addToCart(productId, quantity = 1, productData = null) {
    console.log("[Cart] addToCart — user:", user?.email ?? "guest");
    if (user && user.role !== "ADMIN") {
      // Logged in → DB
      await api.post("/api/cart", { productId, quantity });
      await doFetchCart(user);
    } else {
      // Guest → localStorage
      const guest    = lsGet();
      const existing = guest.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        guest.push({ productId, quantity, product: productData });
      }
      lsSet(guest);
      setItems([...guest]);
      setSubtotal(calcSub(guest));
    }
  }

  async function updateQuantity(productId, quantity) {
    if (quantity < 1) { removeFromCart(productId); return; }
    if (user && user.role !== "ADMIN") {
      await api.patch(`/api/cart/${productId}`, { quantity });
      await doFetchCart(user);
    } else {
      const guest = lsGet().map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      lsSet(guest);
      setItems([...guest]);
      setSubtotal(calcSub(guest));
    }
  }

  async function removeFromCart(productId) {
    if (user && user.role !== "ADMIN") {
      await api.delete(`/api/cart/${productId}`);
      await doFetchCart(user);
    } else {
      const guest = lsGet().filter((i) => i.productId !== productId);
      lsSet(guest);
      setItems([...guest]);
      setSubtotal(calcSub(guest));
    }
  }

  async function clearCart() {
    if (user && user.role !== "ADMIN") await api.delete("/api/cart");
    lsClear();
    setItems([]);
    setSubtotal(0);
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, subtotal, loading, itemCount,
      addToCart, updateQuantity, removeFromCart, clearCart,
      fetchCart: () => doFetchCart(user),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}