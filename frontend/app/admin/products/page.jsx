"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AdminShell from "@/components/AdminShell";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [meta,     setMeta]     = useState({});
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      const data = await api.get(`/api/admin/products?${params}`);
      setProducts(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (product) => {
    if (!confirm(`Deactivate "${product.name}"? It will be hidden from the store.`)) return;
    setDeleting(product.id);
    try {
      await api.delete(`/api/admin/products/${product.id}`);
      await fetchProducts();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminShell>
      <div className="p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-ink">Products</h1>
            <p className="text-sm text-muted mt-0.5">{meta.total ?? 0} total products</p>
          </div>
          <Link
            href="/admin/products/add"
            className="px-5 py-2.5 bg-ink text-cream text-xs font-medium tracking-widest
              uppercase rounded-sm hover:bg-[#2d2926] transition-colors"
          >
            + Add Product
          </Link>
        </div>

        {/* Search */}
        <input
          className="mb-5 w-64 px-4 py-2 border border-border rounded-sm text-sm text-ink
            bg-white outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          placeholder="Search products…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        {/* Table */}
        <div className="bg-white border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream">
                {["Product", "Category", "Price", "MRP", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] uppercase tracking-wider text-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream/40 transition-colors">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cream rounded overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0].startsWith("/") ? `${API}${p.images[0]}` : p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <div className="w-full h-full bg-border" />
                          )}
                        </div>
                        <span className="font-medium text-ink truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>

                    {/* Price */}
                    <td className="px-4 py-3 text-ink font-medium">
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </td>

                    {/* MRP */}
                    <td className="px-4 py-3 text-muted line-through">
                      ₹{Number(p.mrp).toLocaleString("en-IN")}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        p.inventory?.quantity === 0   ? "text-red-500"
                        : p.inventory?.quantity <= 5  ? "text-yellow-600"
                        : "text-green-700"
                      }`}>
                        {p.inventory?.quantity ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                        p.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-500 border-red-200"
                      }`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-xs text-ink underline underline-offset-2 hover:text-muted transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p.id}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                        >
                          {deleting === p.id ? "…" : "Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex gap-2 mt-5">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-8 h-8 border rounded-sm text-xs transition-colors ${
                  page === pg
                    ? "bg-ink text-cream border-ink"
                    : "bg-white text-muted border-border hover:border-ink"
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}