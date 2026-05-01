"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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

const STATUS_STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <OrderDetail />
    </ProtectedRoute>
  );
}

function OrderDetail() {
  const { id }       = useParams();
  const searchParams = useSearchParams();
  const success      = searchParams.get("success") === "true";

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-5">
        {[1,2,3].map((i) => <div key={i} className="h-32 rounded-sm shimmer" />)}
      </div>
    </>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
      <p className="font-serif text-xl text-muted">{error}</p>
      <Link href="/orders" className="mt-4 inline-block text-sm text-ink underline">← Back to Orders</Link>
    </div>
  );

  if (!order) return null;

  const stepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">

      {/* Success banner */}
      {success && (
        <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-green-50 border border-green-200 rounded-sm">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <p className="font-medium text-green-800">Order placed successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Thank you for your order. We'll notify you when it's on its way.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={`text-[0.65rem] font-medium uppercase tracking-wider px-3 py-1.5 rounded-sm border self-start ${STATUS_STYLE[order.status] ?? ""}`}>
          {order.status}
        </span>
      </div>

      {/* Progress tracker */}
      {stepIndex >= 0 && (
        <div className="bg-white border border-border rounded-sm p-5 mb-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                    ${i <= stepIndex ? "bg-ink text-cream" : "bg-cream text-muted border border-border"}`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className={`text-[0.62rem] uppercase tracking-wider text-center hidden sm:block
                    ${i <= stepIndex ? "text-ink font-medium" : "text-muted"}`}>
                    {step.charAt(0) + step.slice(1).toLowerCase()}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < stepIndex ? "bg-ink" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">

        {/* Items */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="text-xs font-medium tracking-[0.1em] uppercase text-muted mb-4">Items Ordered</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="w-14 h-14 bg-cream rounded-sm overflow-hidden shrink-0">
                    {item.product?.images?.[0]
                      ? <img src={imgSrc(item.product.images[0])} alt="" className="w-full h-full object-contain p-1" />
                      : <div className="w-full h-full bg-border" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/${item.product?.slug ?? ""}`} className="text-sm font-medium text-ink hover:underline truncate block">
                      {item.product?.name}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">
                      ₹{Number(item.price).toLocaleString("en-IN")} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ink shrink-0">
                    ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Price breakdown */}
          <div className="bg-white border border-border rounded-sm p-5">
            <h2 className="text-xs font-medium tracking-[0.1em] uppercase text-muted mb-4">Payment</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping</span>
                <span>{Number(order.shippingCharge) === 0 ? "Free" : `₹${Number(order.shippingCharge).toLocaleString("en-IN")}`}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>−₹{Number(order.discount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between font-medium text-ink">
                <span>Total</span>
                <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>Method</span>
                <span>{order.payment?.method === "COD" ? "Cash on Delivery" : order.payment?.method}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Payment</span>
                <span className={order.payment?.status === "PAID" ? "text-green-700" : "text-yellow-600"}>
                  {order.payment?.status}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          {order.address && (
            <div className="bg-white border border-border rounded-sm p-5">
              <h2 className="text-xs font-medium tracking-[0.1em] uppercase text-muted mb-3">Delivery Address</h2>
              <div className="text-sm text-ink leading-relaxed">
                <p className="font-medium">{order.address.name} · {order.address.phone}</p>
                <p className="text-muted">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                <p className="text-muted">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Link href="/orders" className="mt-8 inline-block text-sm text-muted hover:text-ink transition-colors">
        ← Back to Orders
      </Link>
    </div>
  );
}