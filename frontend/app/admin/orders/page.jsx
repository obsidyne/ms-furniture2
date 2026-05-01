"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import AdminShell from "@/components/AdminShell";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;
const imgSrc = (url) => url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

const ALL_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

const STATUS_STYLE = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-500 border-red-200",
  REFUNDED: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter) params.set("status", filter);
      const res = await fetch(`${API}/api/admin/orders?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });


      const data = await res.json();
      console.log(data)
      if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
      setOrders(Array.isArray(data) ? data : []);
      setTotal(data?.meta?.total ?? 0);
      setPages(data?.meta?.totalPages ?? 0);
    } catch (err) {
      setError(err.message ?? "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, page, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const visible = search.trim()
    ? orders.filter((o) =>
      o?.id?.toLowerCase().includes(search.toLowerCase()) ||
      o?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o?.user?.email?.toLowerCase().includes(search.toLowerCase())
    )
    : orders;

  return (
    <AdminShell>
      <div className="p-6 sm:p-8">

        <div className="mb-6">
          <h1 className="font-serif text-2xl font-light text-ink">Orders</h1>
          <p className="text-sm text-muted mt-0.5">{total} total orders</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
              <button
                key={s || "all"}
                onClick={() => { setFilter(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm border transition-colors
                  ${filter === s ? "bg-ink text-cream border-ink" : "bg-white text-muted border-border hover:border-ink"}`}
              >
                {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by name, email or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto w-full sm:w-72 px-4 py-2 border border-border rounded-sm text-sm
              text-ink bg-white outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
        </div>

        <div className="bg-white border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-cream">
                {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[0.68rem] uppercase tracking-wider text-muted font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded shimmer w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : (
                visible.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink text-sm truncate max-w-[140px]">{order.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted truncate max-w-[140px]">{order.user?.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{order._count?.items ?? 0}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      ₹{Number(order.total ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-sm border
                        ${order.payment?.status === "PAID"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                        {order.payment?.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${STATUS_STYLE[order.status] ?? ""}`}>
                        {order.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(order.id)}
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
        <OrderDetailModal
          orderId={selected}
          onClose={() => setSelected(null)}
          onStatusChange={fetchOrders}
        />
      )}
    </AdminShell>
  );
}

function OrderDetailModal({ orderId, onClose, onStatusChange }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API}/api/admin/orders/${orderId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
        setOrder(data);
        setStatus(data.status ?? "PENDING");
      } catch (err) {
        setError(err.message ?? "Failed to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const updateStatus = async () => {
    if (!order || status === order.status) return;
    setSaving(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
      setOrder((o) => ({ ...o, status }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onStatusChange();
    } catch (err) {
      setError(err.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  };


const confirmCODPayment = async () => {
  setSaving(true);
  setError("");
  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API}/api/admin/orders/${orderId}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "PAID" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
    setOrder((o) => ({
      ...o,
      status: "DELIVERED",
      payment: { ...o.payment, status: "PAID" },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onStatusChange();
  } catch (err) {
    setError(err.message ?? "Failed to confirm payment");
  } finally {
    setSaving(false);
  }
};
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-serif text-lg font-light text-ink">
            {order ? `Order #${order.id.slice(-8).toUpperCase()}` : "Order Detail"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded shimmer" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : !order ? (
            <p className="text-sm text-muted">Order not found.</p>
          ) : (
            <div className="flex flex-col gap-6">

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cream rounded-sm p-4">
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-1">Customer</p>
                  <p className="text-sm font-medium text-ink">{order.user?.name ?? "—"}</p>
                  <p className="text-xs text-muted">{order.user?.email ?? "—"}</p>
                  {order.user?.phone && <p className="text-xs text-muted">{order.user.phone}</p>}
                </div>
                <div className="bg-cream rounded-sm p-4">
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-1">Order Date</p>
                  <p className="text-sm text-ink">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Payment:{" "}
                    <span className={order.payment?.status === "PAID" ? "text-green-700" : "text-yellow-600"}>
                      {order.payment?.status ?? "—"}
                    </span>
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Payment Method: {" "}
                    {/* <span className={order.payment?.status === "PAID" ? "text-green-700" : "text-yellow-600"}>
                      {order.payment?.status ?? "—"}
                    </span> */}
                    {order.payment?.method && (
                      <span className="ml-2 text-yellow-600">· {order.payment.method}</span>
                    )}
                  </p>
                </div>
              </div>



              <div>
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-3">Items</p>
                <div className="flex flex-col gap-2">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-sm">
                      <div className="w-12 h-12 bg-cream rounded overflow-hidden shrink-0">
                        {item.product?.images?.[0]
                          ? <img src={imgSrc(item.product.images[0])} alt="" className="w-full h-full object-contain p-1" />
                          : <div className="w-full h-full bg-border" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.product?.name ?? "—"}</p>
                        <p className="text-xs text-muted">
                          Qty: {item.quantity} × ₹{Number(item.price ?? 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-ink shrink-0">
                        ₹{(Number(item.price ?? 0) * (item.quantity ?? 1)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {order.payment?.method === "COD" && order.payment?.status !== "PAID" && (
                <button
                  onClick={confirmCODPayment}
                  className="px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-sm bg-green-700 text-white hover:bg-green-800 transition-colors"
                >
                  Mark Cash Collected
                </button>
              )}

              <div className="border border-border rounded-sm p-4">
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-3">Price Breakdown</p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span>₹{Number(order.subtotal ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Shipping</span>
                    <span>{Number(order.shippingCharge ?? 0) === 0 ? "Free" : `₹${Number(order.shippingCharge).toLocaleString("en-IN")}`}</span>
                  </div>
                  {Number(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>−₹{Number(order.discount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-1" />
                  <div className="flex justify-between font-medium text-ink">
                    <span>Total</span>
                    <span>₹{Number(order.total ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {order.address && (
                <div>
                  <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-2">Delivery Address</p>
                  <div className="text-sm leading-relaxed p-3 border border-border rounded-sm">
                    <p className="font-medium text-ink">{order.address.name} · {order.address.phone}</p>
                    <p className="text-muted">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                    <p className="text-muted">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-2">Update Status</p>
                <div className="flex items-center gap-3">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <button
                    onClick={updateStatus}
                    disabled={saving || status === order.status}
                    className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${saved ? "bg-green-700 text-white" : "bg-ink text-cream hover:bg-[#2d2926]"}`}
                  >
                    {saved ? "✓ Updated" : saving ? "Saving…" : "Update"}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}