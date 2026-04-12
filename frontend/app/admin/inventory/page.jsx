"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AdminShell from "@/components/AdminShell";

const API = process.env.NEXT_PUBLIC_API_URL;

const FILTERS = [
  { value: "all", label: "All Products" },
  { value: "low", label: "Low Stock"    },
  { value: "out", label: "Out of Stock" },
];

export default function AdminInventoryPage() {
  const [inventory,  setInventory]  = useState([]);
  const [stats,      setStats]      = useState(null);
  const [meta,       setMeta]       = useState({});
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null); // productId being saved
  const [saved,      setSaved]      = useState(null); // productId just saved
  // Local edits: { [productId]: { quantity, lowStock } }
  const [edits,      setEdits]      = useState({});

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page, limit: 20 });
      if (search) params.set("search", search);
      const data = await api.get(`/api/admin/inventory?${params}`);
      setInventory(data.data);
      setStats(data.stats);
      setMeta(data.meta);
      setEdits({}); // clear edits on fetch
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Update a single field in local edits
  const setEdit = (productId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  // Save a single row
  const saveRow = async (inv) => {
    const edit = edits[inv.productId];
    if (!edit) return;
    setSaving(inv.productId);
    try {
      await api.patch(`/api/admin/inventory/${inv.productId}`, {
        quantity:  edit.quantity  !== undefined ? Number(edit.quantity)  : undefined,
        lowStock:  edit.lowStock  !== undefined ? Number(edit.lowStock)  : undefined,
      });
      setSaved(inv.productId);
      setTimeout(() => setSaved(null), 1500);
      await fetchInventory();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  // Discard local edits for a row
  const discardEdit = (productId) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const hasEdit = (productId) => !!edits[productId];

  const stockStatus = (inv) => {
    const qty = edits[inv.productId]?.quantity ?? inv.quantity;
    const low = edits[inv.productId]?.lowStock ?? inv.lowStock;
    if (Number(qty) === 0)            return "out";
    if (Number(qty) <= Number(low))   return "low";
    return "ok";
  };

  const statusBadge = (status) => {
    if (status === "out") return "bg-red-50 text-red-500 border-red-200";
    if (status === "low") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const statusLabel = (status) => {
    if (status === "out") return "Out of Stock";
    if (status === "low") return "Low Stock";
    return "In Stock";
  };

  return (
    <AdminShell>
      <div className="p-6 sm:p-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-light text-ink">Inventory</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage stock levels and low-stock thresholds
          </p>
        </div>

        {/* ── Stat cards ─────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Products", value: stats.total,    color: "text-ink"         },
              { label: "In Stock",       value: stats.okCount,  color: "text-green-700"   },
              { label: "Low Stock",      value: stats.lowCount, color: "text-yellow-600"  },
              { label: "Out of Stock",   value: stats.outCount, color: "text-red-500"     },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-border rounded-sm p-4">
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-1">{label}</p>
                <p className={`font-serif text-3xl font-light ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters + Search ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setFilter(value); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-sm border transition-colors
                  ${filter === value
                    ? "bg-ink text-cream border-ink"
                    : "bg-white text-muted border-border hover:border-ink hover:text-ink"}`}
              >
                {label}
                {stats && value === "low" && stats.lowCount > 0 && (
                  <span className="ml-1.5 bg-yellow-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full">
                    {stats.lowCount}
                  </span>
                )}
                {stats && value === "out" && stats.outCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded-full">
                    {stats.outCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search product name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="sm:ml-auto w-full sm:w-60 px-4 py-2 border border-border rounded-sm text-sm text-ink
              bg-white outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
        </div>

        {/* ── Table ──────────────────────────────────────── */}
        <div className="bg-white border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-cream">
                {["Product", "Category", "In Stock", "Low Stock Alert", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] uppercase tracking-wider text-muted font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                inventory.map((inv) => {
                  const status   = stockStatus(inv);
                  const isEdited = hasEdit(inv.productId);
                  const isSaving = saving === inv.productId;
                  const isSaved  = saved  === inv.productId;

                  const qtyVal  = edits[inv.productId]?.quantity  ?? inv.quantity;
                  const lowVal  = edits[inv.productId]?.lowStock  ?? inv.lowStock;

                  const imgSrc = inv.product.images?.[0]
                    ? inv.product.images[0].startsWith("/")
                      ? `${API}${inv.product.images[0]}`
                      : inv.product.images[0]
                    : null;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${isEdited ? "bg-amber-50/50" : "hover:bg-cream/40"}`}
                    >
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cream rounded overflow-hidden shrink-0">
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-border" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${inv.product.id}`}
                              className="font-medium text-ink hover:underline truncate block max-w-[180px]"
                            >
                              {inv.product.name}
                            </Link>
                            {!inv.product.isActive && (
                              <span className="text-[0.62rem] text-red-400">Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-muted text-xs">
                        {inv.product.category?.name ?? "—"}
                      </td>

                      {/* Quantity — inline editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={qtyVal}
                          onChange={(e) => setEdit(inv.productId, "quantity", e.target.value)}
                          className={`w-20 px-2 py-1.5 border rounded-sm text-sm text-ink outline-none transition-colors
                            ${isEdited ? "border-accent bg-white" : "border-border bg-cream"}`}
                        />
                      </td>

                      {/* Low stock threshold — inline editable */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={lowVal}
                          onChange={(e) => setEdit(inv.productId, "lowStock", e.target.value)}
                          className={`w-20 px-2 py-1.5 border rounded-sm text-sm text-ink outline-none transition-colors
                            ${isEdited ? "border-accent bg-white" : "border-border bg-cream"}`}
                        />
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`text-[0.65rem] uppercase tracking-wider px-2.5 py-1 rounded-sm border ${statusBadge(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isSaved ? (
                          <span className="text-xs text-green-700 font-medium">✓ Saved</span>
                        ) : isEdited ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveRow(inv)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-ink text-cream text-xs uppercase tracking-wider rounded-sm
                                hover:bg-[#2d2926] disabled:opacity-50 transition-colors"
                            >
                              {isSaving ? "…" : "Save"}
                            </button>
                            <button
                              onClick={() => discardEdit(inv.productId)}
                              className="px-3 py-1.5 border border-border text-xs text-muted rounded-sm hover:border-ink hover:text-ink transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────── */}
        {meta.totalPages > 1 && (
          <div className="flex gap-2 mt-5 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 border border-border rounded-sm text-sm text-muted hover:border-ink disabled:opacity-40 transition-colors"
            >
              ←
            </button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-9 h-9 border rounded-sm text-xs transition-colors ${
                  page === pg
                    ? "bg-ink text-cream border-ink"
                    : "bg-white text-muted border-border hover:border-ink"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-2 border border-border rounded-sm text-sm text-muted hover:border-ink disabled:opacity-40 transition-colors"
            >
              →
            </button>
          </div>
        )}

        {/* ── Help text ──────────────────────────────────── */}
        <p className="mt-4 text-xs text-muted">
          Edit the quantity or low stock alert threshold directly in the table. Click <strong>Save</strong> to apply changes. The row highlights amber while unsaved.
        </p>
      </div>
    </AdminShell>
  );
}