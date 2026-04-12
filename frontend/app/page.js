"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL;

const imgSrc = (url) =>
  url ? (url.startsWith("/") ? `${API}${url}` : url) : null;

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    // Fetch featured products
    fetch(`${API}/api/products?limit=4&sort=newest`)
      .then((r) => r.json())
      .then((d) => setFeatured(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    // Fetch categories
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {});
  }, []);

  // Parallax on hero
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrolled = window.scrollY;
      heroRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[92vh] min-h-[600px] overflow-hidden bg-[#1a1714]">
        {/* Background image layer with parallax */}
        <div ref={heroRef} className="absolute inset-0 scale-110">
          <div
            className="w-full h-full bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1800&auto=format&fit=crop')",
            }}
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1714]/90 via-[#1a1714]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1714]/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-center">
          <div className="max-w-xl animate-fadeUp">
            <p
              className="text-[0.65rem] font-medium tracking-[0.25em] uppercase mb-5"
              style={{ color: "#c8a97e" }}
            >
              Crafted for Living
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-6">
              Furniture that
              <br />
              <em className="italic" style={{ color: "#c8a97e" }}>
                tells a story
              </em>
            </h1>
            <p className="text-white/60 text-base sm:text-lg font-light leading-relaxed mb-10 max-w-md">
              Thoughtfully designed pieces that bring warmth, character, and
              lasting beauty to the spaces you love most.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:gap-4"
                style={{ backgroundColor: "#c8a97e", color: "#1a1714" }}
              >
                Shop Collection
                <ArrowRight size={14} />
              </Link>
              <Link
                href="#about"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-medium tracking-[0.12em] uppercase border border-white/30 text-white hover:border-white/70 transition-colors"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[0.6rem] tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="bg-[#f5f0e8] border-y border-[#e8e0d0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-[#e8e0d0]">
          {[
            { number: "2,000+", label: "Happy Homes" },
            { number: "150+",   label: "Unique Designs" },
            { number: "12",     label: "Years of Craft" },
            { number: "100%",   label: "Solid Wood" },
          ].map((s) => (
            <div key={s.label} className="pl-6 first:pl-0">
              <p className="font-serif text-3xl font-light text-ink">{s.number}</p>
              <p className="text-xs tracking-wider uppercase text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-muted mb-2">
                Browse
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink">
                Shop by Room
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-sm aspect-square bg-[#f5f0e8] flex items-end p-5"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="relative z-10">
                  <p className="font-serif text-white text-lg font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-1 group-hover:translate-y-0 transform">
                    {cat.name}
                  </p>
                  <p className="text-[0.62rem] tracking-widest uppercase text-ink group-hover:text-white/70 transition-colors font-medium">
                    {cat.name}
                  </p>
                </div>
                {/* Placeholder gradient when no image */}
                <div
                  className="absolute inset-0 -z-10"
                  style={{
                    background: [
                      "linear-gradient(135deg, #e8ddd0 0%, #d4c4b0 100%)",
                      "linear-gradient(135deg, #d4c8b8 0%, #c4b49a 100%)",
                      "linear-gradient(135deg, #ddd4c4 0%, #ccc0a8 100%)",
                      "linear-gradient(135deg, #e4d8c8 0%, #d0c0a4 100%)",
                    ][i % 4],
                  }}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="bg-[#f9f6f1] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-muted mb-2">
                Handpicked
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors underline-offset-4 hover:underline"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded shimmer" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-muted text-sm">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-ink underline underline-offset-4"
            >
              View all products <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── About Us ─────────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image collage */}
          <div className="relative">
            <div
              className="aspect-[4/5] rounded-sm bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop')",
              }}
            />
            {/* Floating accent card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-[#c8a97e] p-6 sm:p-8 max-w-[200px]">
              <p className="font-serif text-4xl font-light text-white">12</p>
              <p className="text-xs tracking-wider uppercase text-white/80 mt-1">
                Years crafting homes
              </p>
            </div>
          </div>

          {/* Text */}
          <div className="lg:pr-8">
            <p className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-muted mb-4">
              Our Story
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-ink leading-tight mb-6">
              Made with hands,
              <br />
              <em className="italic" style={{ color: "#c8a97e" }}>
                made to last
              </em>
            </h2>
            <p className="text-muted leading-relaxed mb-5">
              Founded in 2012, we began as a small workshop in Kerala with a simple
              belief — that furniture should be built to outlast trends, not follow
              them. Every piece we make starts with sustainably sourced timber and
              ends in a home that deserves the best.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              Our craftsmen bring decades of tradition to every joint, curve, and
              finish. No shortcuts. No compromises. Just furniture that becomes a
              part of your family's story.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mb-10 pt-4 border-t border-border">
              {[
                { icon: "🌿", title: "Sustainably Sourced", desc: "FSC-certified timber from responsible forests" },
                { icon: "🤝", title: "Artisan Crafted",     desc: "Every piece handmade by master craftsmen" },
                { icon: "✦",  title: "Lifetime Support",    desc: "We stand behind every piece, forever" },
              ].map((v) => (
                <div key={v.title} className="flex-1">
                  <span className="text-xl">{v.icon}</span>
                  <p className="text-sm font-medium text-ink mt-2">{v.title}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:gap-4 bg-ink text-cream hover:bg-[#2d2926]"
            >
              Explore Collection <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Banner CTA ───────────────────────────────────────── */}
      <section
        className="relative py-20 sm:py-28 overflow-hidden"
        style={{ backgroundColor: "#1a1714" }}
      >
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1400&auto=format&fit=crop')",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <p className="text-[0.65rem] font-medium tracking-[0.25em] uppercase mb-4" style={{ color: "#c8a97e" }}>
            Limited Time
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-6">
            Free shipping on orders
            <br />above ₹5,000
          </h2>
          <p className="text-white/50 mb-10 text-base">
            Plus complimentary white-glove delivery and in-room setup for orders above ₹20,000.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 px-8 py-4 text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:gap-4"
            style={{ backgroundColor: "#c8a97e", color: "#1a1714" }}
          >
            Shop Now <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────── */}
      <section id="contact" className="bg-[#f9f6f1] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

            {/* Left — info */}
            <div>
              <p className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-muted mb-4">
                Get In Touch
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink mb-6">
                We'd love to hear
                <br />from you
              </h2>
              <p className="text-muted leading-relaxed mb-10">
                Whether you're looking for a custom piece, need help choosing the
                right furniture for your space, or simply want to visit our showroom
                — we're here to help.
              </p>

              <div className="flex flex-col gap-6">
                {[
                  {
                    icon: <MapPin />,
                    title: "Showroom",
                    lines: ["12 Craft Lane, MG Road", "Thiruvananthapuram, Kerala 695001"],
                  },
                  {
                    icon: <Phone />,
                    title: "Phone",
                    lines: ["+91 98470 12345", "Mon – Sat, 10am – 7pm"],
                  },
                  {
                    icon: <Mail />,
                    title: "Email",
                    lines: ["hello@yourfurniture.in", "We reply within 24 hours"],
                  },
                ].map((c) => (
                  <div key={c.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-sm bg-[#f0ebe0] flex items-center justify-center shrink-0 text-muted">
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink">{c.title}</p>
                      {c.lines.map((l) => (
                        <p key={l} className="text-sm text-muted mt-0.5">{l}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-ink text-white/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <p className="font-serif text-xl text-white mb-3">MS Furniture</p>
              <p className="text-sm leading-relaxed text-white/40 max-w-[200px]">
                Crafting furniture that becomes part of your story.
              </p>
            </div>
            {[
              {
                title: "Shop",
                links: [
                  { label: "All Products", href: "/shop" },
                  { label: "New Arrivals", href: "/shop?sort=newest" },
                  { label: "Best Sellers", href: "/shop" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us",    href: "#about"   },
                  { label: "Contact",     href: "#contact" },
                  { label: "Careers",     href: "#"        },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "Shipping",    href: "#" },
                  { label: "Returns",     href: "#" },
                  { label: "Care Guide",  href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[0.65rem] font-medium tracking-[0.15em] uppercase text-white mb-4">
                  {col.title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Artisana. All rights reserved.
            </p>
            <p className="text-xs text-white/30">
              Handcrafted in Kerala, India 🇮🇳
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeUp {
          animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product }) {
  const discount =
    Number(product.mrp) > Number(product.price)
      ? Math.round((1 - Number(product.price) / Number(product.mrp)) * 100)
      : null;

  const src = imgSrc(product.images?.[0]);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col bg-white border border-border rounded-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        {src ? (
          <img
            src={src}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cream to-border flex items-center justify-center">
            <span className="font-serif text-4xl text-muted/20">{product.name[0]}</span>
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-ink text-cream text-[0.62rem] font-medium tracking-wider px-2 py-0.5 rounded-sm">
            -{discount}%
          </span>
        )}
        {product.inventory?.quantity === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[0.65rem] uppercase tracking-widest text-ink font-medium bg-white px-3 py-1 rounded-sm border border-border">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <p className="text-[0.62rem] font-medium tracking-[0.08em] uppercase text-muted">
          {product.category?.name}
        </p>
        <h3 className="font-serif text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-ink">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
            {discount && (
              <span className="text-xs text-muted line-through">
                ₹{Number(product.mrp).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Contact Form ──────────────────────────────────────────────
function ContactForm() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus]   = useState(""); // "" | "sending" | "sent" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate sending — wire up to your backend as needed
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
  };

  const field =
    "w-full px-4 py-3 border border-border rounded-sm text-sm text-ink bg-white outline-none focus:border-accent transition-colors placeholder:text-muted/40";

  if (status === "sent") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-700 text-xl">
          ✓
        </div>
        <p className="font-serif text-2xl font-light text-ink">Message sent!</p>
        <p className="text-sm text-muted">We'll get back to you within 24 hours.</p>
        <button
          onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus(""); }}
          className="text-xs text-muted underline underline-offset-4 mt-2 hover:text-ink transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[0.65rem] font-medium uppercase tracking-wider text-muted block mb-1.5">Name</label>
          <input
            type="text"
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={field}
          />
        </div>
        <div>
          <label className="text-[0.65rem] font-medium uppercase tracking-wider text-muted block mb-1.5">Email</label>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={field}
          />
        </div>
      </div>
      <div>
        <label className="text-[0.65rem] font-medium uppercase tracking-wider text-muted block mb-1.5">Subject</label>
        <input
          type="text"
          placeholder="How can we help?"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className={field}
        />
      </div>
      <div>
        <label className="text-[0.65rem] font-medium uppercase tracking-wider text-muted block mb-1.5">Message</label>
        <textarea
          required
          rows={5}
          placeholder="Tell us about your project or question…"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className={`${field} resize-none`}
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-3.5 text-xs font-medium tracking-[0.12em] uppercase bg-ink text-cream hover:bg-[#2d2926] disabled:opacity-60 transition-colors"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

// ── Tiny icons ────────────────────────────────────────────────
function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function MapPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21s-8-6.75-8-11a8 8 0 1 1 16 0c0 4.25-8 11-8 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function Phone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.08 5.18 2 2 0 0 1 4.06 3h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.9a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.18-1.18a2 2 0 0 1 2.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0 1 21 17z" />
    </svg>
  );
}
function Mail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}