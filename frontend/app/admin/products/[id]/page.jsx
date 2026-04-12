"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get(`/api/admin/products/${id}`)
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminShell>
      <div className="p-8 max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="text-xs text-muted hover:text-ink transition-colors tracking-wide"
          >
            ← Back to Products
          </Link>
          <h1 className="font-serif text-2xl font-light text-ink mt-2">
            {loading ? "Loading…" : `Edit — ${product?.name ?? "Product"}`}
          </h1>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded shimmer" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
            {error}
          </p>
        )}

        {/* Form — product passed = edit mode */}
        {!loading && !error && product && (
          <ProductForm product={product} />
        )}

      </div>
    </AdminShell>
  );
}