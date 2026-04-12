"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const NAV = [
  { label: "Dashboard",  href: "/admin"            },
  { label: "Products",   href: "/admin/products"   },
  { label: "Categories", href: "/admin/categories" },
  { label: "Inventory",  href: "/admin/inventory"  },
  { label: "Orders",     href: "/admin/orders"     },
  { label: "Users",      href: "/admin/users"      },
];

/**
 * Wrap every admin page (except login) with this.
 *
 * Usage in any admin page:
 *   import AdminShell from "@/components/AdminShell";
 *   export default function AdminProductsPage() {
 *     return <AdminShell>...page content...</AdminShell>;
 *   }
 */
export default function AdminShell({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Guard — redirect to login if not admin
  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <p className="font-serif italic text-white/30 text-lg tracking-widest">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f4]">

      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-ink text-cream flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="block font-serif text-2xl font-light tracking-[0.3em] text-cream">
            MS Furntiure
          </span>
          <p className="text-[0.6rem] uppercase tracking-[0.15em] text-white/30 mt-0.5">
            Admin Panel
          </p>
        </div>

        <nav className="flex flex-col py-4 flex-1">
          {NAV.map(({ label, href }) => (
            <NavLink key={href} label={label} href={href} />
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10 flex flex-col gap-2">
          {user && (
            <>
              <p className="text-xs text-white/50 truncate">{user.name}</p>
              <p className="text-[0.65rem] text-white/30 truncate">{user.email}</p>
            </>
          )}
          <div className="flex items-center justify-between mt-1">
            <a href="/" className="text-[0.68rem] text-white/30 hover:text-white/60 transition-colors">
              ← Store
            </a>
            <button
              onClick={() => logout(true)}
              className="text-[0.68rem] text-white/30 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ label, href }) {
  const pathname = usePathname();
  const isActive = href === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-6 py-2.5 text-sm transition-colors border-l-2
        ${isActive
          ? "bg-white/10 text-white font-medium border-accent"
          : "text-white/50 hover:text-white hover:bg-white/5 border-transparent"}`}
    >
      {label}
    </Link>
  );
}