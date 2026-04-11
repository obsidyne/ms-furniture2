import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_PATH = path.join(__dirname, "../../uploads");

// ── Route imports ─────────────────────────────────────────────
import authRoutes     from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes  from "./routes/product.routes.js";
import userRoutes     from "./routes/user.routes.js";
import cartRoutes     from "./routes/cart.routes.js";
import orderRoutes    from "./routes/order.routes.js";
// import paymentRoutes from "./routes/payment.routes.js"; // razorpay — not integrated yet
// import reviewRoutes  from "./routes/review.routes.js";  // not built yet
// import couponRoutes  from "./routes/coupon.routes.js";  // not built yet

// ── Admin route imports ───────────────────────────────────────
import adminProductRoutes   from "./routes/admin/product.routes.js";
import adminCategoryRoutes  from "./routes/admin/category.routes.js";
import adminInventoryRoutes from "./routes/admin/inventory.routes.js";
import adminOrderRoutes     from "./routes/admin/order.routes.js";
import adminUserRoutes   from "./routes/admin/user.routes.js";   // not built yet

// ── Middleware imports ────────────────────────────────────────
import { verifyToken }  from "./middleware/auth.js";
import { requireAdmin } from "./middleware/requireAdmin.js";

const app = express();
app.set("etag", false); // disable ETags — prevents 304 empty responses

// ── CORS ──────────────────────────────────────────────────────
const corsOptions = {
  origin:         process.env.CLIENT_URL || "http://localhost:3000",
  credentials:    true,
  methods:        ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ── Serve uploaded images (before helmet) ─────────────────────
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(UPLOADS_PATH));

// ── Security + logging ────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(morgan("dev"));

// ── Public routes ─────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products",   productRoutes);

// ── Protected routes ──────────────────────────────────────────
app.use("/api/users",    verifyToken, userRoutes);
app.use("/api/cart",     verifyToken, cartRoutes);
app.use("/api/orders",   verifyToken, orderRoutes);
// app.use("/api/payments", verifyToken, paymentRoutes);
// app.use("/api/reviews",  reviewRoutes);
// app.use("/api/coupons",  verifyToken, couponRoutes);

// ── Admin routes ──────────────────────────────────────────────
app.use("/api/admin/products",   verifyToken, requireAdmin, adminProductRoutes);
app.use("/api/admin/categories", verifyToken, requireAdmin, adminCategoryRoutes);
app.use("/api/admin/inventory",  verifyToken, requireAdmin, adminInventoryRoutes);
app.use("/api/admin/orders",     verifyToken, requireAdmin, adminOrderRoutes);
app.use("/api/admin/users",   verifyToken, requireAdmin, adminUserRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

export default app;