"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;
const imgSrc = (url) => url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

const STATUS_STYLE = {
  PENDING:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED:  "bg-green-50 text-green-700 border-green-200",
  CANCELLED:  "bg-red-50 text-red-500 border-red-200",
  REFUNDED:   "bg-gray-50 text-gray-500 border-gray-200",
};

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <OrdersContent />
    </ProtectedRoute>
  );
}

function OrdersContent() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/orders")
      .then((data) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink mb-8">My Orders</h1>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-28 rounded-sm shimmer" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="font-serif text-2xl font-light text-muted">No orders yet</p>
          <p className="text-sm text-muted">Start shopping and your orders will appear here.</p>
          <Link href="/shop" className="mt-2 px-8 py-3 bg-ink text-cream text-xs uppercase tracking-widest rounded-sm hover:bg-[#2d2926] transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="bg-white border border-border rounded-sm p-5 hover:border-muted transition-colors block"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted mb-0.5">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className={`text-[0.65rem] font-medium uppercase tracking-wider px-2.5 py-1 rounded-sm border ${STATUS_STYLE[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-ink">₹{Number(order.total).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {order.items.slice(0, 5).map((item, i) => (
                  <div key={i} className="w-12 h-12 rounded-sm bg-cream overflow-hidden shrink-0">
                    {item.product?.images?.[0]
                      ? <img src={imgSrc(item.product.images[0])} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-cream to-border" />}
                  </div>
                ))}
                {order.items.length > 5 && <span className="text-xs text-muted">+{order.items.length - 5} more</span>}
                <span className="ml-auto text-xs text-muted">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}