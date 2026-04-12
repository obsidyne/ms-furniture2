"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_FORM = {
  name:        "",
  slug:        "",
  description: "",
  price:       "",
  mrp:         "",
  categoryId:  "",
  tags:        "",
  isFeatured:  false,
  isActive:    true,
  quantity:    "",
};

/**
 * Reusable product form for both /admin/products/add and /admin/products/[id]
 * Props:
 *   product  — existing product object (edit mode) or null (add mode)
 *   onSaved  — callback after successful save
 */
export default function ProductForm({ product = null, onSaved }) {
  const router   = useRouter();
  const isEdit   = !!product;
  const fileRef  = useRef(null);

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [images,     setImages]     = useState([]);   // array of URL strings
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  // Populate form when editing
  useEffect(() => {
    api.get("/api/admin/categories").then((data) => setCategories(data));

    if (product) {
      setForm({
        name:        product.name        ?? "",
        slug:        product.slug        ?? "",
        description: product.description ?? "",
        price:       product.price       ?? "",
        mrp:         product.mrp         ?? "",
        categoryId:  product.categoryId  ?? "",
        tags:        product.tags?.join(", ") ?? "",
        isFeatured:  product.isFeatured  ?? false,
        isActive:    product.isActive    ?? true,
        quantity:    product.inventory?.quantity ?? "",
      });
      setImages(product.images ?? []);
    }
  }, [product]);

  // Auto-generate slug from name (only in add mode)
  const handleNameChange = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      ...(!isEdit && {
        slug: value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
      }),
    }));
  };

  // Upload images → backend converts to webp
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      // Use raw fetch here since api wrapper sends JSON content-type
      const currentUser = (await import("@/lib/firebase")).auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`${API}/api/admin/products/upload-image`, {
        method:  "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImages((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price:      Number(form.price),
        mrp:        Number(form.mrp),
        tags:       form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        images,
        isFeatured: form.isFeatured,
        isActive:   form.isActive,
        ...(!isEdit && { quantity: Number(form.quantity) || 0 }),
      };

      if (isEdit) {
        await api.patch(`/api/admin/products/${product.id}`, payload);
      } else {
        await api.post("/api/admin/products", payload);
      }

      if (onSaved) onSaved();
      else router.push("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-border rounded-sm bg-white text-sm text-ink outline-none focus:border-accent transition-colors";
  const labelClass =
    "block text-[0.68rem] font-medium tracking-[0.08em] uppercase text-muted mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      {/* ── Basic info ───────────────────────────────────── */}
      <section className="bg-white border border-border rounded-sm p-6">
        <h2 className="text-xs font-medium tracking-[0.1em] uppercase text-muted mb-5">
          Basic Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="md:col-span-2">
            <label className={labelClass}>Product Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Walnut Dining Chair"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Slug *</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="walnut-dining-chair"
              required
            />
            <p className="text-[0.68rem] text-muted mt-1">
              URL: /shop/{form.slug || "product-slug"}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the product..."
            />
          </div>

          <div>
            <label className={labelClass}>Price (₹) *</label>
            <input
              type="number"
              className={inputClass}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="12999"
              required
              min="0"
            />
          </div>

          <div>
            <label className={labelClass}>MRP (₹) *</label>
            <input
              type="number"
              className={inputClass}
              value={form.mrp}
              onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
              placeholder="15999"
              required
              min="0"
            />
          </div>

          <div>
            <label className={labelClass}>Category *</label>
            <select
              className={inputClass}
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div>
              <label className={labelClass}>Initial Stock</label>
              <input
                type="number"
                className={inputClass}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="0"
                min="0"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className={labelClass}>Tags (comma separated)</label>
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="wood, modern, dining"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-8 mt-5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              className="w-4 h-4 accent-ink"
            />
            <span className="text-sm text-ink">Featured product</span>
          </label>

          {isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-sm text-ink">Active (visible in store)</span>
            </label>
          )}
        </div>
      </section>

      {/* ── Images ───────────────────────────────────────── */}
      <section className="bg-white border border-border rounded-sm p-6">
        <h2 className="text-xs font-medium tracking-[0.1em] uppercase text-muted mb-5">
          Images
        </h2>

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded overflow-hidden border border-border bg-cream">
                <img
                  src={url.startsWith("/") ? `${API}${url}` : url}
                  alt={`Product image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full
                    text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[0.6rem] bg-ink text-cream px-1.5 py-0.5 rounded-sm">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 border border-dashed border-border rounded-sm
            text-sm text-muted hover:border-accent hover:text-ink disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-muted border-t-ink rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <UploadIcon />
              Upload Images (JPG, PNG, WebP → converted to WebP)
            </>
          )}
        </button>
        <p className="text-[0.68rem] text-muted mt-2">
          First image is used as the cover. Max 5 images, 10 MB each.
        </p>
      </section>

      {/* ── Error + Submit ────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-8 py-3 bg-ink text-cream text-xs font-medium tracking-[0.1em] uppercase
            rounded-sm hover:bg-[#2d2926] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-3 border border-border text-sm text-muted rounded-sm hover:border-ink hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}