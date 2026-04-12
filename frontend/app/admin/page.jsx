"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/orders/stats/summary")
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Revenue",  value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`, sub: "from paid orders" },
    { label: "Total Orders",   value: stats.totalOrders,   sub: "all time"          },
    { label: "Pending Orders", value: stats.pendingOrders, sub: "awaiting action"   },
    { label: "Total Users",    value: stats.totalUsers,    sub: "registered customers" },
  ] : [];

  return (
    <AdminShell>
      <div className="p-8">
        <h1 className="font-serif text-2xl font-light text-ink mb-8">Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            {[1,2,3,4].map((i) => <div key={i} className="h-28 rounded shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
            {cards.map(({ label, value, sub }) => (
              <div key={label} className="bg-white border border-border rounded-sm p-5">
                <p className="text-[0.68rem] uppercase tracking-wider text-muted font-medium mb-3">{label}</p>
                <p className="font-serif text-3xl font-light text-ink">{value}</p>
                <p className="text-xs text-muted mt-1">{sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: "Manage Products",   desc: "Add, edit or deactivate products",       href: "/admin/products"   },
            { title: "Manage Categories", desc: "Organise your product categories",        href: "/admin/categories" },
            { title: "View Inventory",    desc: "Track stock levels and low-stock alerts", href: "/admin/inventory"  },
            { title: "Manage Orders",     desc: "Update order statuses and view details",  href: "/admin/orders"     },
          ].map(({ title, desc, href }) => (
            <a key={href} href={href} className="bg-white border border-border rounded-sm p-5 hover:border-muted transition-colors">
              <p className="font-medium text-ink text-sm mb-1">{title}</p>
              <p className="text-xs text-muted">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}