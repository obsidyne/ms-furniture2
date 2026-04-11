import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/products
// Supports: ?page=1&limit=12&category=slug&sort=price_asc&search=sofa&featured=true
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 12,
      category,
      sort     = "newest",
      search,
      featured,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (featured === "true") {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags:        { has: search } },
      ];
    }

    // Build orderBy
    const orderByMap = {
      newest:     { createdAt: "desc" },
      oldest:     { createdAt: "asc" },
      price_asc:  { price: "asc" },
      price_desc: { price: "desc" },
      name_asc:   { name: "asc" },
    };
    const orderBy = orderByMap[sort] ?? { createdAt: "desc" };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          category:  { select: { name: true, slug: true } },
          inventory: { select: { quantity: true } },
          reviews:   { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Compute average rating per product
    const data = products.map((p) => ({
      ...p,
      avgRating: p.reviews.length
        ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
        : null,
      reviewCount: p.reviews.length,
      reviews: undefined, // strip raw reviews from list response
    }));

    return res.json({
      data,
      meta: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/products/:slug
// ─────────────────────────────────────────────────────────────
router.get("/:slug", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category:  true,
        inventory: true,
        reviews: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    const avgRating = product.reviews.length
      ? +(product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
      : null;

    return res.json({ ...product, avgRating });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;