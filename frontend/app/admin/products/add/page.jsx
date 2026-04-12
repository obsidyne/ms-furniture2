"use client";

import AdminShell from "@/components/AdminShell";
import ProductForm from "@/components/ProductForm";
import Link from "next/link";

export default function AddProductPage() {
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
          <h1 className="font-serif text-2xl font-light text-ink mt-2">Add Product</h1>
        </div>

        {/* Form — null product = add mode */}
        <ProductForm product={null} />

      </div>
    </AdminShell>
  );
}