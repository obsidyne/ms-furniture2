"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const data = await api.post("/api/auth/sync");
          setUser(data);

          // Only redirect when user is sitting on a login page
          // Never redirect from public pages like /, /shop, /shop/:slug
          const onUserLogin  = pathname === "/auth";
          const onAdminLogin = pathname === "/admin/login";

          if (onUserLogin || onAdminLogin) {
            if (data.role === "ADMIN") router.replace("/admin");
            else router.replace("/");
          }
        } catch (err) {
          console.error("Failed to sync user:", err.message);
          setUser(null);
        }
      } else {
        // Not logged in — that's fine, public pages work without auth
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async (isAdmin = false) => {
    await signOut(auth);
    setUser(null);
    router.replace(isAdmin ? "/admin/login" : "/auth");
  };

  return (
    // Never block rendering — children always render immediately
    // ProtectedRoute handles blocking for pages that require login
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}