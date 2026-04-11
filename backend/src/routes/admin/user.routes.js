import { Router } from "express";
import prisma from "../../lib/prisma.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// ?search=name|email  &page=1&limit=20
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { name:  { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id:        true,
          name:      true,
          email:     true,
          phone:     true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            select: { total: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Attach lifetime spend to each user
    const data = users.map((u) => ({
      ...u,
      totalSpend: u.orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
      orders: undefined, // strip raw orders array
    }));

    return res.json({
      data,
      meta: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// Full user detail with order history
// ─────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id:        true,
        name:      true,
        email:     true,
        phone:     true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            payment: { select: { status: true, method: true } },
            _count:  { select: { items: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;