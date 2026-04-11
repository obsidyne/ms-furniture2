import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/categories
// Returns all active categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    return res.json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch category" });
  }
});

export default router;