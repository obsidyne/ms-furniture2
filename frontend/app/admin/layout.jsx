"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { label: "Dashboard",  href: "/admin"            },
  { label: "Products",   href: "/admin/products"   },
  { label: "Categories", href: "/admin/categories" },
  { label: "Inventory",  href: "/admin/inventory"  },
  { label: "Orders",     href: "/admin/orders"     },
  { label: "Users",      href: "/admin/users"      },
];

// No AdminProtectedRoute here — login page lives at /admin/login
// and must not be intercepted. Each protected page handles its own guard.
export default function AdminLayout({ children }) {
  return <>{children}</>;
}