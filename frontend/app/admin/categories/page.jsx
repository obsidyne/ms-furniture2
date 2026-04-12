"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import AdminShell from "@/components/AdminShell";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_FORM = { name: "", slug: "", description: "", imageUrl: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Modal state — null = closed, "add" = add mode, category obj = edit mode
  const [modal,    setModal]    = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/admin/categories");
      setCategories(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd  = ()      => setModal("add");
  const openEdit = (cat)   => setModal(cat);
  const closeModal = ()    => setModal(null);

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/categories/${cat.id}`);
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AdminShell>
      <div className="p-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-ink">Categories</h1>
            <p className="text-sm text-muted mt-0.5">{categories.length} total</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-ink text-cream text-xs font-medium tracking-widest
              uppercase rounded-sm hover:bg-[#2d2926] transition-colors"
          >
            + Add Category
          </button>
        </div>

        {/* ── Grid ───────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded shimmer" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl font-light text-muted mb-4">No categories yet</p>
            <button
              onClick={openAdd}
              className="px-6 py-2.5 bg-ink text-cream text-xs uppercase tracking-widest rounded-sm hover:bg-[#2d2926] transition-colors"
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => handleDelete(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────── */}
      {modal && (
        <CategoryModal
          category={modal === "add" ? null : modal}
          onClose={closeModal}
          onSaved={async () => { closeModal(); await fetchCategories(); }}
        />
      )}
    </AdminShell>
  );
}

// ── Category Card ─────────────────────────────────────────────
function CategoryCard({ cat, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-border rounded-sm overflow-hidden group">
      {/* Image */}
      <div className="aspect-video bg-cream overflow-hidden">
        {cat.imageUrl ? (
          <img
            src={cat.imageUrl.startsWith("/") ? `${API}${cat.imageUrl}` : cat.imageUrl}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream to-border">
            <span className="font-serif text-3xl text-muted/40">
              {cat.name[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-ink text-sm">{cat.name}</h3>
          <span className="text-[0.65rem] text-muted shrink-0">
            {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-[0.68rem] font-mono text-muted/70 mb-1">/{cat.slug}</p>
        {cat.description && (
          <p className="text-xs text-muted line-clamp-2 mb-3">{cat.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <button
            onClick={onEdit}
            className="text-xs text-ink underline underline-offset-2 hover:text-muted transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Modal ────────────────────────────────────────────
function CategoryModal({ category, onClose, onSaved }) {
  const isEdit  = !!category;
  const fileRef = useRef(null);

  const [form,      setForm]      = useState({
    name:        category?.name        ?? "",
    slug:        category?.slug        ?? "",
    description: category?.description ?? "",
    imageUrl:    category?.imageUrl    ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  // Auto-generate slug from name in add mode
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

  // Upload category image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const currentUser = (await import("@/lib/firebase")).auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`${API}/api/admin/categories/upload-image`, {
        method:  "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.patch(`/api/admin/categories/${category.id}`, form);
      } else {
        await api.post("/api/admin/categories", form);
      }
      onSaved();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-sm w-full max-w-md shadow-xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg font-light text-ink">
            {isEdit ? `Edit — ${category.name}` : "Add Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* Image upload */}
          <div>
            <label className={labelClass}>Category Image</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded bg-cream border border-border overflow-hidden shrink-0">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl.startsWith("/") ? `${API}${form.imageUrl}` : form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted/40">
                    <ImagePlaceholderIcon />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-dashed border-border rounded-sm text-xs text-muted
                    hover:border-accent hover:text-ink disabled:opacity-50 transition-colors text-left"
                >
                  {uploading ? "Uploading…" : form.imageUrl ? "Change image" : "Upload image"}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="text-xs text-red-400 hover:text-red-600 text-left transition-colors"
                  >
                    Remove image
                  </button>
                )}
                <p className="text-[0.65rem] text-muted">JPG, PNG or WebP. Converted to WebP.</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Living Room"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className={labelClass}>Slug *</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="living-room"
              required
            />
            <p className="text-[0.65rem] text-muted mt-1">
              Used in URL: /shop?category={form.slug || "slug"}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional short description..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-2.5 bg-ink text-cream text-xs font-medium tracking-[0.1em] uppercase
                rounded-sm hover:bg-[#2d2926] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-border text-sm text-muted rounded-sm
                hover:border-ink hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}