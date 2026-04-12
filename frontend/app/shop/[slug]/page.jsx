"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

// Prepend backend URL for /uploads/ images
const imgSrc = (url) =>
  url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

export default function ProductDetailPage() {
  const { slug }      = useParams();
  const router        = useRouter();
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [qty,      setQty]      = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [adding,   setAdding]   = useState(false);
  const [added,    setAdded]    = useState(false);
  const [cartErr,  setCartErr]  = useState("");

  useEffect(() => {
    api.get(`/api/products/${slug}`)
      .then((data) => setProduct(data))
      .catch(() => router.replace("/shop"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleAddToCart = async () => {
    setAdding(true);
    setCartErr("");
    try {
      await addToCart(product.id, qty, {
        id:        product.id,
        name:      product.name,
        price:     product.price,
        images:    product.images,
        slug:      product.slug,
        inventory: product.inventory,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setCartErr(err.message ?? "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            <div className="aspect-square rounded-sm shimmer" />
            <div className="flex flex-col gap-5 pt-4">
              {[40, 80, 30, 60, 50, 40].map((w, i) => (
                <div key={i} className="h-5 rounded shimmer" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) return null;

  const inStock  = (product.inventory?.quantity ?? 0) > 0;
  const maxQty   = Math.min(product.inventory?.quantity ?? 0, 10);
  const discount = Number(product.mrp) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.mrp)) * 100)
    : null;

  const savings = discount
    ? Number(product.mrp) - Number(product.price)
    : null;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">

        {/* ── Breadcrumb ───────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-muted mb-6 sm:mb-10 flex-wrap">
          <Link href="/"    className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-ink transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Main layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* ── Image gallery ────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative aspect-square bg-cream rounded-sm overflow-hidden">
              {product.images?.[imgIndex] ? (
                <img
                  src={imgSrc(product.images[imgIndex])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cream to-border flex items-center justify-center">
                  <span className="font-serif text-6xl text-muted/20">{product.name[0]}</span>
                </div>
              )}

              {/* Discount badge */}
              {discount && (
                <span className="absolute top-3 left-3 bg-ink text-cream text-xs font-medium px-2.5 py-1 rounded-sm">
                  -{discount}%
                </span>
              )}

              {/* Out of stock overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="bg-white border border-border text-ink text-xs uppercase tracking-widest font-medium px-4 py-2 rounded-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden border-2 transition-colors shrink-0
                      ${imgIndex === i ? "border-ink" : "border-border hover:border-muted"}`}
                  >
                    <img src={imgSrc(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ─────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Category */}
            {product.category && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-[0.7rem] font-medium tracking-[0.12em] uppercase text-muted hover:text-ink transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-ink leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.avgRating && (
              <div className="flex items-center gap-2">
                <Stars rating={product.avgRating} />
                <span className="text-sm text-muted">
                  {product.avgRating} · {product.reviews?.length} review{product.reviews?.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-medium text-ink">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
              {discount && (
                <>
                  <span className="text-lg text-muted line-through">
                    ₹{Number(product.mrp).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-medium tracking-wider bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-sm">
                    -{discount}% off
                  </span>
                </>
              )}
            </div>

            {/* Savings callout */}
            {savings && (
              <p className="text-sm text-green-700">
                You save ₹{savings.toLocaleString("en-IN")}
              </p>
            )}

            {/* Description */}
            <p className="text-sm text-muted leading-relaxed">{product.description}</p>

            <div className="h-px bg-border" />

            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-400"}`} />
              <span className="text-sm text-muted">
                {inStock
                  ? product.inventory.quantity <= 5
                    ? `Only ${product.inventory.quantity} left in stock — order soon`
                    : "In stock"
                  : "Out of stock"}
              </span>
            </div>

            {/* Qty + Add to cart */}
            {inStock && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* Qty selector */}
                  <div className="flex items-center border border-border rounded-sm overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="w-10 h-12 bg-white text-ink text-xl hover:bg-cream
                        disabled:text-border disabled:cursor-not-allowed transition-colors"
                    >
                      −
                    </button>
                    <span className="w-12 h-12 flex items-center justify-center text-sm font-medium border-x border-border">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      disabled={qty >= maxQty}
                      className="w-10 h-12 bg-white text-ink text-xl hover:bg-cream
                        disabled:text-border disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`flex-1 h-12 text-xs font-medium tracking-[0.12em] uppercase rounded-sm transition-colors
                      disabled:cursor-not-allowed
                      ${added
                        ? "bg-green-700 text-white"
                        : "bg-ink text-cream hover:bg-[#2d2926] disabled:opacity-60"}`}
                  >
                    {added ? "✓ Added to Cart" : adding ? "Adding…" : "Add to Cart"}
                  </button>
                </div>

                {/* Cart error */}
                {cartErr && (
                  <p className="text-sm text-red-500">{cartErr}</p>
                )}
              </div>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[0.7rem] tracking-wider px-3 py-1 bg-cream border border-border rounded-sm text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ──────────────────────────────────────── */}
        <section className="mt-16 sm:mt-24">
          <div className="flex items-center justify-between pb-5 border-b border-border mb-8">
            <h2 className="font-serif text-2xl font-light text-ink">
              Customer Reviews
              {product.reviews?.length > 0 && (
                <span className="text-base text-muted font-sans ml-2">
                  ({product.reviews.length})
                </span>
              )}
            </h2>

            {/* Average rating summary */}
            {product.avgRating && (
              <div className="text-right hidden sm:block">
                <p className="font-serif text-3xl font-light text-ink">{product.avgRating}</p>
                <Stars rating={product.avgRating} />
              </div>
            )}
          </div>

          {product.reviews?.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-xl font-light text-muted mb-2">No reviews yet</p>
              <p className="text-sm text-muted">Be the first to review this product.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {product.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* ── Back to shop ─────────────────────────────────── */}
        <div className="mt-12">
          <Link
            href="/shop"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            ← Back to Shop
          </Link>
        </div>
      </main>
    </>
  );
}

// ── Review card ───────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-border rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {review.user.avatarUrl ? (
          <img
            src={review.user.avatarUrl}
            alt={review.user.name}
            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-ink text-cream font-serif flex items-center justify-center text-sm shrink-0">
            {review.user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-ink">{review.user.name}</p>
          <Stars rating={review.rating} />
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-muted leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${s <= Math.round(rating) ? "text-accent" : "text-border"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}