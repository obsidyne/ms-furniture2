"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/context/cartContext";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

const API                     = process.env.NEXT_PUBLIC_API_URL;
const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_CHARGE         = 299;
const imgSrc = (url) => url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <CheckoutContent />
    </ProtectedRoute>
  );
}

function CheckoutContent() {
  const router              = useRouter();
  const { user }            = useAuth();
  const { items, subtotal, clearCart } = useCart();

  // ── State ─────────────────────────────────────────────────
  const [addresses,     setAddresses]     = useState([]);
  const [selectedAddr,  setSelectedAddr]  = useState(null);
  const [payMethod,     setPayMethod]     = useState("FAKE"); // "FAKE" | "COD"
  const [step,          setStep]          = useState(1);      // 1=address, 2=payment, 3=review
  const [placing,       setPlacing]       = useState(false);
  const [error,         setError]         = useState("");
  const [showAddrForm,  setShowAddrForm]  = useState(false);

  // New address form
  const [addrForm, setAddrForm] = useState({
    name: user?.name ?? "", phone: "", line1: "", line2: "",
    city: "", state: "", pincode: "", isDefault: false,
  });
  const [savingAddr, setSavingAddr] = useState(false);

  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const total          = subtotal + shippingCharge;

  // ── Load addresses ────────────────────────────────────────
  useEffect(() => {
    api.get("/api/users/addresses").then((data) => {
      setAddresses(data);
      const def = data.find((a) => a.isDefault) ?? data[0];
      if (def) setSelectedAddr(def.id);
    });
  }, []);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && !placing) router.replace("/cart");
  }, [items, placing, router]);

  // ── Save new address ──────────────────────────────────────
  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    try {
      const data = await api.post("/api/users/addresses", {
        ...addrForm,
        isDefault: addresses.length === 0 ? true : addrForm.isDefault,
      });
      setAddresses((prev) => [...prev, data]);
      setSelectedAddr(data.id);
      setShowAddrForm(false);
      setAddrForm({ name: user?.name ?? "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAddr(false);
    }
  };

  // ── Place order ───────────────────────────────────────────
  const placeOrder = async () => {
    if (!selectedAddr) { setError("Please select a delivery address"); return; }
    setPlacing(true);
    setError("");
    try {
      // For fake payment — just use COD flow (marks order CONFIRMED immediately)
      const data = await api.post("/api/orders", {
        addressId:     selectedAddr,
        paymentMethod: payMethod === "FAKE" ? "COD" : "COD",
      });

      // Clear cart after successful order
      await clearCart();
      router.push(`/orders/${data.orderId}?success=true`);
    } catch (err) {
      setError(err.message ?? "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-border rounded-sm bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
  const labelClass = "block text-[0.68rem] font-medium tracking-[0.08em] uppercase text-muted mb-1.5";

  const STEPS = ["Address", "Payment", "Review"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <h1 className="font-serif text-2xl sm:text-3xl font-light text-ink mb-2">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done   = step > n;
          const active = step === n;
          return (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => n < step && setStep(n)}
                className="flex items-center gap-2"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                  ${done   ? "bg-green-600 text-white"
                  : active ? "bg-ink text-cream"
                  :          "bg-cream text-muted border border-border"}`}>
                  {done ? "✓" : n}
                </span>
                <span className={`text-sm ${active ? "text-ink font-medium" : "text-muted"}`}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className="text-border mx-1">→</span>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Left: Steps ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* ── Step 1: Address ────────────────────────────── */}
          <section className={`bg-white border rounded-sm ${step === 1 ? "border-ink" : "border-border"}`}>
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer"
              onClick={() => step > 1 && setStep(1)}
            >
              <h2 className="font-medium text-ink flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center
                  ${step > 1 ? "bg-green-600 text-white" : "bg-ink text-cream"}`}>
                  {step > 1 ? "✓" : "1"}
                </span>
                Delivery Address
              </h2>
              {step > 1 && selectedAddr && (
                <span className="text-xs text-muted underline">Change</span>
              )}
            </div>

            {step === 1 && (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {addresses.length === 0 && !showAddrForm && (
                  <p className="text-sm text-muted">No saved addresses. Add one below.</p>
                )}

                {/* Saved addresses */}
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-colors
                      ${selectedAddr === addr.id ? "border-ink bg-cream" : "border-border hover:border-muted"}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddr === addr.id}
                      onChange={() => setSelectedAddr(addr.id)}
                      className="mt-0.5 accent-ink shrink-0"
                    />
                    <div className="text-sm leading-relaxed">
                      <p className="font-medium text-ink">{addr.name} · {addr.phone}</p>
                      <p className="text-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-muted">{addr.city}, {addr.state} — {addr.pincode}</p>
                      {addr.isDefault && <span className="text-[0.65rem] text-accent font-medium uppercase tracking-wider">Default</span>}
                    </div>
                  </label>
                ))}

                {/* Toggle add address form */}
                <button
                  onClick={() => setShowAddrForm((v) => !v)}
                  className="text-sm text-ink underline underline-offset-2 text-left hover:text-muted transition-colors"
                >
                  {showAddrForm ? "Cancel" : "+ Add new address"}
                </button>

                {/* New address form */}
                {showAddrForm && (
                  <form onSubmit={saveAddress} className="border border-border rounded-sm p-4 grid grid-cols-2 gap-4">
                    {[
                      { key: "name",    label: "Full Name",          span: 2 },
                      { key: "phone",   label: "Phone",              span: 1 },
                      { key: "line1",   label: "Address Line 1",     span: 2 },
                      { key: "line2",   label: "Line 2 (optional)",  span: 2 },
                      { key: "city",    label: "City",               span: 1 },
                      { key: "state",   label: "State",              span: 1 },
                      { key: "pincode", label: "Pincode",            span: 1 },
                    ].map(({ key, label, span }) => (
                      <div key={key} className={span === 2 ? "col-span-2" : ""}>
                        <label className={labelClass}>{label}</label>
                        <input
                          className={inputClass}
                          value={addrForm[key]}
                          onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                          required={key !== "line2"}
                        />
                      </div>
                    ))}
                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        className="accent-ink"
                      />
                      <label htmlFor="isDefault" className="text-sm text-muted">Set as default address</label>
                    </div>
                    <div className="col-span-2 flex gap-3">
                      <button
                        type="submit"
                        disabled={savingAddr}
                        className="px-6 py-2.5 bg-ink text-cream text-xs uppercase tracking-wider rounded-sm hover:bg-[#2d2926] disabled:opacity-50 transition-colors"
                      >
                        {savingAddr ? "Saving…" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddrForm(false)}
                        className="px-4 py-2.5 border border-border text-sm text-muted rounded-sm hover:border-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Continue */}
                {selectedAddr && (
                  <button
                    onClick={() => setStep(2)}
                    className="self-start mt-2 px-8 py-3 bg-ink text-cream text-xs uppercase tracking-wider rounded-sm hover:bg-[#2d2926] transition-colors"
                  >
                    Continue to Payment →
                  </button>
                )}
              </div>
            )}

            {/* Step 1 summary when collapsed */}
            {step > 1 && selectedAddr && (() => {
              const addr = addresses.find((a) => a.id === selectedAddr);
              return addr ? (
                <div className="px-5 pb-4 text-sm text-muted">
                  {addr.name} · {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                </div>
              ) : null;
            })()}
          </section>

          {/* ── Step 2: Payment ────────────────────────────── */}
          <section className={`bg-white border rounded-sm ${step === 2 ? "border-ink" : "border-border"} ${step < 2 ? "opacity-60 pointer-events-none" : ""}`}>
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer"
              onClick={() => step > 2 && setStep(2)}
            >
              <h2 className="font-medium text-ink flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center
                  ${step > 2 ? "bg-green-600 text-white" : step === 2 ? "bg-ink text-cream" : "bg-cream text-muted border border-border"}`}>
                  {step > 2 ? "✓" : "2"}
                </span>
                Payment Method
              </h2>
              {step > 2 && <span className="text-xs text-muted underline">Change</span>}
            </div>

            {step === 2 && (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {[
                  {
                    value: "FAKE",
                    label: "Pay Online",
                    desc:  "Credit / Debit Card, UPI, Netbanking",
                    badge: "Simulated — no real payment",
                  },
                  {
                    value: "COD",
                    label: "Cash on Delivery",
                    desc:  "Pay when your order arrives",
                    badge: null,
                  },
                ].map(({ value, label, desc, badge }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-colors
                      ${payMethod === value ? "border-ink bg-cream" : "border-border hover:border-muted"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payMethod === value}
                      onChange={() => setPayMethod(value)}
                      className="mt-0.5 accent-ink shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <p className="text-xs text-muted">{desc}</p>
                      {badge && (
                        <span className="inline-block mt-1 text-[0.62rem] uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-sm">
                          {badge}
                        </span>
                      )}
                    </div>
                  </label>
                ))}

                <button
                  onClick={() => setStep(3)}
                  className="self-start mt-2 px-8 py-3 bg-ink text-cream text-xs uppercase tracking-wider rounded-sm hover:bg-[#2d2926] transition-colors"
                >
                  Continue to Review →
                </button>
              </div>
            )}

            {step > 2 && (
              <div className="px-5 pb-4 text-sm text-muted">
                {payMethod === "COD" ? "Cash on Delivery" : "Pay Online (Simulated)"}
              </div>
            )}
          </section>

          {/* ── Step 3: Review & Place ──────────────────────── */}
          <section className={`bg-white border rounded-sm ${step === 3 ? "border-ink" : "border-border"} ${step < 3 ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="px-5 py-4">
              <h2 className="font-medium text-ink flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center
                  ${step === 3 ? "bg-ink text-cream" : "bg-cream text-muted border border-border"}`}>
                  3
                </span>
                Review Order
              </h2>
            </div>

            {step === 3 && (
              <div className="px-5 pb-5 flex flex-col gap-4">
                {/* Item list */}
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <div key={item.id ?? item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-cream rounded overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? (
                          <img src={imgSrc(item.product.images[0])} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.product?.name}</p>
                        <p className="text-xs text-muted">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-ink shrink-0">
                        ₹{(Number(item.product?.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full py-3.5 bg-ink text-cream text-xs font-medium tracking-[0.12em] uppercase
                    rounded-sm hover:bg-[#2d2926] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {placing ? "Placing Order…" : payMethod === "COD" ? "Place Order" : "Confirm & Pay"}
                </button>

                <p className="text-xs text-center text-muted">
                  By placing your order you agree to our terms of service.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Order Summary ──────────────────────────── */}
        <div className="bg-white border border-border rounded-sm p-5 sticky top-20 flex flex-col gap-4">
          <h2 className="font-serif text-lg font-light text-ink">Order Summary</h2>

          {/* Items */}
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id ?? item.productId} className="flex justify-between text-sm">
                <span className="text-muted truncate flex-1 pr-2">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="text-ink shrink-0">
                  ₹{(Number(item.product?.price ?? 0) * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Totals */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
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

          <Link href="/cart" className="text-xs text-center text-muted hover:text-ink transition-colors">
            ← Edit Cart
          </Link>
        </div>
      </div>
    </div>
  );
}