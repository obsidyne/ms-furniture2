"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest"            },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc",   label: "Name: A → Z"       },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [meta,        setMeta]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [filterOpen,  setFilterOpen]  = useState(false); // mobile filter drawer

  const currentCategory = searchParams.get("category") || "";
  const currentSort     = searchParams.get("sort")     || "newest";
  const currentSearch   = searchParams.get("search")   || "";
  const currentPage     = Number(searchParams.get("page") || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCategory) params.set("category", currentCategory);
      if (currentSort)     params.set("sort",     currentSort);
      if (currentSearch)   params.set("search",   currentSearch);
      params.set("page",  String(currentPage));
      params.set("limit", "12");
      const data = await api.get(`/api/products?${params}`);
      setProducts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, currentSort, currentSearch, currentPage]);

  useEffect(() => {
    api.get("/api/categories").then((data) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/shop?${p.toString()}`);
    setFilterOpen(false); // close mobile filter on selection
  };

  const setPage = (pg) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(pg));
    router.push(`/shop?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Page title + mobile filter toggle ───────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink">
              {currentCategory
                ? categories.find((c) => c.slug === currentCategory)?.name ?? "Products"
                : "All Products"}
            </h1>
            <p className="text-sm text-muted mt-0.5">{meta.total ?? 0} products</p>
          </div>

          {/* Mobile: filter + sort button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-sm text-ink hover:border-ink transition-colors"
          >
            <FilterIcon />
            Filter & Sort
          </button>
        </div>

        <div className="flex gap-10">

          {/* ── Sidebar — desktop ──────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-8 w-48 shrink-0">
            <FilterPanel
              categories={categories}
              currentCategory={currentCategory}
              currentSort={currentSort}
              currentSearch={currentSearch}
              setParam={setParam}
            />
          </aside>

          {/* ── Mobile filter drawer ──────────────────────── */}
          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-50 bg-black/40 lg:hidden"
                onClick={() => setFilterOpen(false)}
              />
              <div className="fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col shadow-2xl lg:hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <span className="font-medium text-ink">Filter & Sort</span>
                  <button onClick={() => setFilterOpen(false)} className="text-2xl text-muted leading-none">×</button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FilterPanel
                    categories={categories}
                    currentCategory={currentCategory}
                    currentSort={currentSort}
                    currentSearch={currentSearch}
                    setParam={setParam}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Product grid ──────────────────────────────── */}
          <section className="flex-1 min-w-0">

            {/* Desktop search bar */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <SearchBar value={currentSearch} onSearch={(v) => setParam("search", v)} />
              <SortSelect value={currentSort} onChange={(v) => setParam("sort", v)} />
            </div>

            {/* Mobile search */}
            <div className="lg:hidden mb-4">
              <SearchBar value={currentSearch} onSearch={(v) => setParam("search", v)} full />
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded shimmer" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <p className="font-serif text-2xl font-light text-muted">No products found</p>
                <button
                  onClick={() => router.push("/shop")}
                  className="text-sm text-ink underline underline-offset-2 hover:text-muted"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 border border-border rounded-sm text-sm text-muted
                    hover:border-ink hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 border rounded-sm text-sm transition-colors ${
                      currentPage === pg
                        ? "bg-ink text-cream border-ink"
                        : "bg-white text-muted border-border hover:border-ink hover:text-ink"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= meta.totalPages}
                  className="px-3 py-2 border border-border rounded-sm text-sm text-muted
                    hover:border-ink hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

// ── Filter panel — shared between sidebar and mobile drawer ───
function FilterPanel({ categories, currentCategory, currentSort, currentSearch, setParam }) {
  const filterBtn = (active) =>
    `w-full flex items-center justify-between py-2 text-sm border-b border-border/60 transition-colors text-left
    ${active ? "text-ink font-medium" : "text-muted hover:text-ink"}`;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted mb-3">Categories</p>
        <button className={filterBtn(!currentCategory)} onClick={() => setParam("category", "")}>
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={filterBtn(currentCategory === cat.slug)}
            onClick={() => setParam("category", cat.slug)}
          >
            <span>{cat.name}</span>
            <span className="text-xs text-muted">{cat._count?.products ?? ""}</span>
          </button>
        ))}
      </div>

      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted mb-3">Sort By</p>
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.value}
            className={filterBtn(currentSort === s.value)}
            onClick={() => setParam("sort", s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────
function SearchBar({ value, onSearch, full = false }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className={`relative ${full ? "w-full" : "w-64"}`}>
      <input
        type="text"
        placeholder="Search furniture…"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(local)}
        className="w-full pl-4 pr-10 py-2.5 border border-border rounded-sm text-sm text-ink bg-white
          placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
      />
      <button
        onClick={() => onSearch(local)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
      >
        <SearchIcon />
      </button>
    </div>
  );
}

// ── Sort select ───────────────────────────────────────────────
function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white
        outline-none focus:border-accent transition-colors cursor-pointer"
    >
      {SORT_OPTIONS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

// ── Product card ──────────────────────────────────────────────
function ProductCard({ product }) {
  const discount = Number(product.mrp) > Number(product.price)
    ? Math.round((1 - Number(product.price) / Number(product.mrp)) * 100)
    : null;

  const imgSrc = product.images?.[0]
    ? product.images[0].startsWith("/") ? `${API}${product.images[0]}` : product.images[0]
    : null;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col bg-white border border-border rounded-sm overflow-hidden
        hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream to-border flex items-center justify-center">
            <span className="font-serif text-4xl text-muted/20">
              {product.name[0]}
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-2 left-2 bg-ink text-cream text-[0.62rem] font-medium tracking-wider px-2 py-0.5 rounded-sm">
            -{discount}%
          </span>
        )}

        {/* Out of stock overlay */}
        {product.inventory?.quantity === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[0.65rem] uppercase tracking-widest text-ink font-medium bg-white px-3 py-1 rounded-sm border border-border">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <p className="text-[0.62rem] font-medium tracking-[0.08em] uppercase text-muted">
          {product.category?.name}
        </p>
        <h3 className="font-serif text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-ink">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
            {discount && (
              <span className="text-xs text-muted line-through">
                ₹{Number(product.mrp).toLocaleString("en-IN")}
              </span>
            )}
          </div>
          {product.avgRating && (
            <span className="text-xs text-accent font-medium">★ {product.avgRating}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Icons ─────────────────────────────────────────────────────
function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="11" y1="18" x2="13" y2="18"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}