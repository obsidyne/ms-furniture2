/**
 * Must be used AFTER verifyToken middleware.
 * Blocks access if the logged-in user is not an ADMIN.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
}