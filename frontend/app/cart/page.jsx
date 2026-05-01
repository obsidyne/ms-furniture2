"use client";

import Link from "next/link";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

const imgSrc = (url) =>
  url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_CHARGE         = 299;

export default function CartPage() {
  return (
    <>
      <Navbar />
      <CartContent />
    </>
  );
}

function CartContent() {
  const { user }    = useAuth();
  const {
    items, subtotal, loading,
    updateQuantity, removeFromCart,
  } = useCart();

  const shippingCharge = subtotal > 0
    ? subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
    : 0;
  const total = subtotal + shippingCharge;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <p className="font-serif italic text-muted text-lg">Loading cart…</p>
      </div>
    );
  }

  // ── Empty cart ───────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center gap-5 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center">
          <CartEmptyIcon />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-light text-ink mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted">Looks like you haven't added anything yet.</p>
        </div>
        <Link
          href="/shop"
          className="mt-2 px-8 py-3 bg-ink text-cream text-xs font-medium tracking-[0.1em] uppercase
            rounded-sm hover:bg-[#2d2926] transition-colors"
        >
          Browse Products
        </Link>

        {/* Guest prompt */}
        {!user && (
          <p className="text-xs text-muted mt-4">
            <Link href="/auth" className="underline underline-offset-2 hover:text-ink">Sign in</Link>
            {" "}to access your saved cart across devices
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink">
          Shopping Cart
          <span className="text-base text-muted font-sans ml-2">({items.length} item{items.length !== 1 ? "s" : ""})</span>
        </h1>
        <Link href="/shop" className="text-xs text-muted hover:text-ink transition-colors hidden sm:block">
          ← Continue Shopping
        </Link>
      </div>

      {/* Guest banner */}
      {!user && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-cream border border-border rounded-sm">
          <InfoIcon />
          <p className="text-sm text-ink">
            <Link href="/auth" className="font-medium underline underline-offset-2 hover:text-muted">
              Sign in
            </Link>
            {" "}to save your cart and sync it across devices. Your items are stored locally for now.
          </p>
        </div>
      )}

      {/* Free shipping progress */}
      {subtotal > 0 && shippingCharge > 0 && (
        <div className="mb-6 p-4 bg-white border border-border rounded-sm">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Add ₹{amountToFreeShipping.toLocaleString("en-IN")} more for free shipping</span>
            <span>₹{FREE_SHIPPING_THRESHOLD.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-1.5 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full transition-all duration-300"
              style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {subtotal >= FREE_SHIPPING_THRESHOLD && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-sm">
          <span className="text-green-600">✓</span>
          <p className="text-sm text-green-700">You qualify for free shipping!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Cart items ────────────────────────────────── */}
        <div className="flex flex-col divide-y divide-border bg-white border border-border rounded-sm">
          {items.map((item) => (
            <CartItem
              key={item.productId ?? item.id}
              item={item}
              onUpdateQty={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>

        {/* ── Order summary ─────────────────────────────── */}
        <div className="flex flex-col gap-4 sticky top-20">
          <div className="bg-white border border-border rounded-sm p-5 sm:p-6">
            <h2 className="font-serif text-lg font-light text-ink mb-5">Order Summary</h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal ({itemCount(items)} items)</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span className={shippingCharge === 0 ? "text-green-700" : ""}>
                  {shippingCharge === 0 ? "Free" : `₹${SHIPPING_CHARGE}`}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-medium text-ink text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Link
              href={user ? "/checkout" : "/auth"}
              className="mt-5 block text-center py-3.5 bg-ink text-cream text-xs font-medium
                tracking-[0.12em] uppercase rounded-sm hover:bg-[#2d2926] transition-colors"
            >
              {user ? "Proceed to Checkout" : "Sign in to Checkout"}
            </Link>

            {!user && (
              <p className="text-xs text-center text-muted mt-3">
                Your cart items will be saved after signing in
              </p>
            )}
          </div>

          <Link
            href="/shop"
            className="text-center text-xs text-muted hover:text-ink transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Cart item row ─────────────────────────────────────────────
function CartItem({ item, onUpdateQty, onRemove }) {
  const product  = item.product;
  const productId = item.productId ?? item.product?.id;
  const stock     = product?.inventory?.quantity ?? 99;
  const maxQty    = Math.min(stock, 10);
  const price     = Number(product?.price ?? item.price ?? 0);
  const image     = product?.images?.[0];

  return (
    <div className="flex gap-4 p-4 sm:p-5">
      {/* Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-cream rounded-sm overflow-hidden shrink-0">
        {image ? (
          <img
            src={imgSrc(image)}
            alt={product?.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream to-border" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <Link
          href={`/shop/${product?.slug ?? ""}`}
          className="font-serif text-sm sm:text-base font-semibold text-ink hover:underline leading-snug line-clamp-2"
        >
          {product?.name ?? "Product"}
        </Link>
        <p className="text-sm text-muted">₹{price.toLocaleString("en-IN")}</p>

        {/* Low stock warning */}
        {stock > 0 && stock <= 5 && (
          <p className="text-xs text-red-500">Only {stock} left in stock</p>
        )}

        {/* Qty + Remove */}
        <div className="flex items-center gap-3 mt-2">
          {/* Qty control */}
          <div className="flex items-center border border-border rounded-sm overflow-hidden">
            <button
              onClick={() => onUpdateQty(productId, item.quantity - 1)}
              className="w-7 h-7 bg-white text-ink hover:bg-cream transition-colors text-sm"
            >
              −
            </button>
            <span className="w-8 h-7 flex items-center justify-center text-xs font-medium border-x border-border">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(productId, item.quantity + 1)}
              disabled={item.quantity >= maxQty}
              className="w-7 h-7 bg-white text-ink hover:bg-cream disabled:text-border disabled:cursor-not-allowed transition-colors text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onRemove(productId)}
            className="text-xs text-muted hover:text-red-500 transition-colors underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-ink">
          ₹{(price * item.quantity).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

function itemCount(items) {
  return items.reduce((s, i) => s + i.quantity, 0);
}

function CartEmptyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted shrink-0">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}