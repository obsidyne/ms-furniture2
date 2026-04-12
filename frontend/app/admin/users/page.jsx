"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import AdminShell from "@/components/AdminShell";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminCustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API}/api/admin/users?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
      setCustomers(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total ?? 0);
      setPages(data.meta?.totalPages ?? 0);
    } catch (err) {
      setError(err.message ?? "Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user, page, search]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchCustomers(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [page]);

  return (
    <AdminShell>
      <div className="p-6 sm:p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-light text-ink">Customers</h1>
          <p className="text-sm text-muted mt-0.5">{total} total customers</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 border border-border rounded-sm text-sm
              text-ink bg-white outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-cream">
                {["Customer", "Phone", "Orders", "Total Spend", "Joined", "Action"].map((h) => (
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
                        <div className="h-4 rounded shimmer w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-muted text-sm">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-cream/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink text-sm">{c.name ?? "—"}</p>
                      <p className="text-xs text-muted">{c.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted">{c._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      ₹{Number(c.totalSpend ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(c.id)}
                        className="text-xs text-ink underline underline-offset-2 hover:text-muted transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex gap-2 mt-5 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 border border-border rounded-sm text-sm text-muted hover:border-ink disabled:opacity-40 transition-colors"
            >←</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-9 h-9 border rounded-sm text-xs transition-colors
                  ${page === pg ? "bg-ink text-cream border-ink" : "bg-white text-muted border-border hover:border-ink"}`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-3 py-2 border border-border rounded-sm text-sm text-muted hover:border-ink disabled:opacity-40 transition-colors"
            >→</button>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDetailModal
          customerId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </AdminShell>
  );
}

// ── Customer detail modal ─────────────────────────────────────
function CustomerDetailModal({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API}/api/admin/users/${customerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
        setCustomer(data);
      } catch (err) {
        setError(err.message ?? "Failed to load customer");
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId]);

  const totalSpend = customer?.orders?.reduce((s, o) => s + Number(o.total ?? 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-serif text-lg font-light text-ink">
            {customer?.name ?? "Customer Detail"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded shimmer" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : !customer ? (
            <p className="text-sm text-muted">Customer not found.</p>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cream rounded-sm p-4">
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-2">Profile</p>
                  <p className="text-sm font-medium text-ink">{customer.name ?? "—"}</p>
                  <p className="text-xs text-muted mt-0.5">{customer.email ?? "—"}</p>
                  <p className="text-xs text-muted mt-0.5">{customer.phone ?? "—"}</p>
                </div>
                <div className="bg-cream rounded-sm p-4">
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-2">Stats</p>
                  <p className="text-sm text-ink">
                    <span className="font-medium">{customer.orders?.length ?? 0}</span>
                    <span className="text-muted ml-1">orders</span>
                  </p>
                  <p className="text-sm text-ink mt-1">
                    <span className="font-medium">₹{totalSpend.toLocaleString("en-IN")}</span>
                    <span className="text-muted ml-1">lifetime spend</span>
                  </p>
                  <p className="text-xs text-muted mt-2">
                    Joined {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              {customer.addresses?.length > 0 && (
                <div>
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-3">Saved Addresses</p>
                  <div className="flex flex-col gap-2">
                    {customer.addresses.map((addr) => (
                      <div key={addr.id} className="text-sm p-3 border border-border rounded-sm leading-relaxed">
                        <p className="font-medium text-ink">{addr.name} · {addr.phone}</p>
                        <p className="text-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p className="text-muted">{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order history */}
              <div>
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-3">Order History</p>
                {customer.orders?.length === 0 ? (
                  <p className="text-sm text-muted">No orders yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {customer.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-border rounded-sm">
                        <div>
                          <p className="font-mono text-xs text-muted">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {order._count?.items ?? 0} items ·{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-ink">₹{Number(order.total ?? 0).toLocaleString("en-IN")}</p>
                          <p className={`text-[0.65rem] uppercase tracking-wider mt-0.5
                            ${order.payment?.status === "PAID" ? "text-green-700" : "text-yellow-600"}`}>
                            {order.payment?.method ?? "—"} · {order.payment?.status ?? "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}