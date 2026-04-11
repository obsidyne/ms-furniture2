import { Router } from "express";
import admin from "../lib/firebase.js";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/auth/sync
 *
 * Called by the frontend right after Firebase login (Google or Email).
 * - If user exists in DB  → return existing user
 * - If new user           → create User + AuthProviderLink row
 *
 * This is the bridge between Firebase Auth and your Postgres DB.
 */
router.post("/sync", async (req, res) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = header.split(" ")[1];

    // Verify token with Firebase Admin SDK
    const decoded = await admin.auth().verifyIdToken(token);

    const { uid, email, name, picture, firebase } = decoded;

    // Determine provider (google.com → GOOGLE, password → EMAIL)
    const rawProvider = firebase?.sign_in_provider;
    const provider = rawProvider === "google.com" ? "GOOGLE" : "EMAIL";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: { providers: true },
    });

    if (!user) {
      // New user — create User + AuthProviderLink in a transaction
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firebaseUid: uid,
            email:       email ?? "",
            name:        name  ?? email?.split("@")[0] ?? "User",
            avatarUrl:   picture ?? null,
          },
        });

        await tx.authProviderLink.create({
          data: {
            userId:      newUser.id,
            provider,
            providerUid: uid,
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { providers: true },
        });
      });
    } else {
      // Existing user — link new provider if not already linked
      const alreadyLinked = user.providers.some((p) => p.provider === provider);

      if (!alreadyLinked) {
        await prisma.authProviderLink.create({
          data: {
            userId:      user.id,
            provider,
            providerUid: uid,
          },
        });
      }
    }

    return res.status(200).json({
      id:        user.id,
      name:      user.name,
      email:     user.email,
      avatarUrl: user.avatarUrl,
      role:      user.role,
    });
  } catch (err) {
    console.error("Auth sync error:", err.message);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * GET /api/auth/me
 *
 * Returns the currently logged-in user's profile.
 * Protected — requires a valid Firebase token.
 */
router.get("/me", verifyToken, (req, res) => {
  const { id, name, email, avatarUrl, role, phone } = req.user;
  return res.status(200).json({ id, name, email, avatarUrl, role, phone });
});

export default router;