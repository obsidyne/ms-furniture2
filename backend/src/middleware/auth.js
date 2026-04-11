import admin from "../lib/firebase.js";
import prisma from "../lib/prisma.js";

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the DB user object to req.user.
 *
 * Header expected: Authorization: Bearer <firebase_id_token>
 */
export async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = header.split(" ")[1];

    // Verify token with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(token);

    // Find user in DB by their Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found. Please login again." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}