"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export function useAuthActions() {
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── User actions (redirect handled by AuthContext) ────────

  /** Google OAuth — users only */
  const loginWithGoogle = () =>
    run(async () => {
      await signInWithPopup(auth, googleProvider);
      // AuthContext onAuthStateChanged fires → syncs user → redirects to /
    });

  /** Email + password login — users */
  const loginWithEmail = (email, password) =>
    run(async () => {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext handles redirect based on role
    });

  /** Email + password register — users only */
  const registerWithEmail = (name, email, password) =>
    run(async () => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await user.getIdToken(true); // force refresh so displayName is in token
      // AuthContext handles redirect
    });

  // ── Admin action ──────────────────────────────────────────

  /** Email + password login — admin only, no Google */
  const loginAsAdmin = (email, password) =>
    run(async () => {
      console.log("here")
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext checks role → redirects to /admin if ADMIN
      // If role is USER, AuthContext will redirect to / instead
    });

  return {
    loginWithGoogle,
    loginWithEmail,
    loginAsAdmin,
    registerWithEmail,
    loading,
    error,
  };
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/invalid-credential":   "Invalid email or password.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}