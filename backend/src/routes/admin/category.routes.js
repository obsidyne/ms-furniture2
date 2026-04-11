import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "../../lib/prisma.js";

const router  = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Uploads folder ────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "../../../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer — memory storage ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  },
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/categories/upload-image
// ─────────────────────────────────────────────────────────────
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const filename = `cat-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const filepath  = path.join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .webp({ quality: 85 })
      .toFile(filepath);

    return res.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Image upload failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/categories
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/categories
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    if (!name || !slug)
      return res.status(400).json({ error: "name and slug are required" });

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl },
    });
    return res.status(201).json(category);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(400).json({ error: "Category name or slug already exists" });
    return res.status(500).json({ error: "Failed to create category" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id
// ─────────────────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data:  { name, slug, description, imageUrl },
    });
    return res.json(category);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(400).json({ error: "Category name or slug already exists" });
    return res.status(500).json({ error: "Failed to update category" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/categories/:id
// ─────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0)
      return res.status(400).json({
        error: `Cannot delete — ${count} product${count > 1 ? "s" : ""} still use this category`,
      });

    await prisma.category.delete({ where: { id: req.params.id } });
    return res.json({ message: "Category deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;