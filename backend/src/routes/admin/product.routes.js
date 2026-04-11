import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "../../lib/prisma.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Uploads folder ────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, "../../../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer — store in memory, we convert before saving ───────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  },
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/products/upload-image
// Accepts up to 5 images, converts to WebP, saves to /uploads
// Returns array of public URLs
// ─────────────────────────────────────────────────────────────
router.post("/upload-image", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: "No images uploaded" });

    const urls = [];

    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const filepath  = path.join(UPLOADS_DIR, filename);

      // Convert to WebP using sharp
      await sharp(file.buffer)
        .webp({ quality: 85 })
        .toFile(filepath);

      urls.push(`/uploads/${filename}`);
    }

    return res.json({ urls });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Image upload failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/products
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = search ? { name: { contains: search, mode: "insensitive" } } : {};

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          category:  { select: { name: true } },
          inventory: { select: { quantity: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      meta: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/products/:id
// ─────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where:   { id: req.params.id },
      include: {
        category:  true,
        inventory: true,
      },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/products
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, slug, description, price, mrp, categoryId, images, tags, isFeatured, quantity = 0 } = req.body;

    if (!name || !slug || !price || !mrp || !categoryId)
      return res.status(400).json({ error: "name, slug, price, mrp and categoryId are required" });

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name, slug, description,
          price, mrp, categoryId,
          images:     images     ?? [],
          tags:       tags       ?? [],
          isFeatured: !!isFeatured,
        },
      });
      await tx.inventory.create({ data: { productId: p.id, quantity: Number(quantity) } });
      return p;
    });

    return res.status(201).json(product);
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ error: "Slug already exists" });
    console.error(err);
    return res.status(500).json({ error: "Failed to create product" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/products/:id
// ─────────────────────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const { name, slug, description, price, mrp, categoryId, images, tags, isFeatured, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data:  { name, slug, description, price, mrp, categoryId, images, tags, isFeatured, isActive },
    });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update product" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/products/:id — soft delete
// ─────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });
    return res.json({ message: "Product deactivated" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;