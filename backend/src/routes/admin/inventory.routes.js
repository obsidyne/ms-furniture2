import { Router } from "express";
import prisma from "../../lib/prisma.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/admin/inventory
// ?filter=all|low|out  &search=name  &page=1&limit=20
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { filter = "all", search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build product name filter
    const productWhere = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    // Fetch all matching inventory rows
    const all = await prisma.inventory.findMany({
      where: { product: productWhere },
      include: {
        product: {
          select: { id: true, name: true, images: true, slug: true, isActive: true, category: { select: { name: true } } },
        },
      },
      orderBy: { quantity: "asc" },
    });

    // Apply stock filter
    const filtered = filter === "low"
      ? all.filter((i) => i.quantity > 0 && i.quantity <= i.lowStock)
      : filter === "out"
      ? all.filter((i) => i.quantity === 0)
      : all;

    // Paginate after filtering
    const total    = filtered.length;
    const paginated = filtered.slice(skip, skip + Number(limit));

    // Summary counts for the stat cards
    const stats = {
      total:    all.length,
      outCount: all.filter((i) => i.quantity === 0).length,
      lowCount: all.filter((i) => i.quantity > 0 && i.quantity <= i.lowStock).length,
      okCount:  all.filter((i) => i.quantity > i.lowStock).length,
    };

    return res.json({
      data: paginated,
      meta: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      stats,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/inventory/:productId
// Update quantity and/or lowStock threshold
// Body: { quantity?, lowStock? }
// ─────────────────────────────────────────────────────────────
router.patch("/:productId", async (req, res) => {
  try {
    const { quantity, lowStock } = req.body;
    const data = {};
    if (quantity  !== undefined) data.quantity  = Number(quantity);
    if (lowStock  !== undefined) data.lowStock  = Number(lowStock);

    if (Object.keys(data).length === 0)
      return res.status(400).json({ error: "Nothing to update" });

    const updated = await prisma.inventory.update({
      where: { productId: req.params.productId },
      data,
      include: {
        product: { select: { name: true } },
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update inventory" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/inventory/bulk-update
// Update multiple products at once
// Body: { updates: [{ productId, quantity, lowStock }] }
// ─────────────────────────────────────────────────────────────
router.post("/bulk-update", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0)
      return res.status(400).json({ error: "updates array is required" });

    const results = await prisma.$transaction(
      updates.map(({ productId, quantity, lowStock }) => {
        const data = {};
        if (quantity  !== undefined) data.quantity  = Number(quantity);
        if (lowStock  !== undefined) data.lowStock  = Number(lowStock);
        return prisma.inventory.update({ where: { productId }, data });
      })
    );

    return res.json({ updated: results.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Bulk update failed" });
  }
});

export default router;