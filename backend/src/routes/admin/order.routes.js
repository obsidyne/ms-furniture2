import { Router } from "express";
import prisma from "../../lib/prisma.js";

const router = Router();

const ALL_STATUSES = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"];

// All order routes are protected via app.js

// ─────────────────────────────────────────────────────────────
// GET /api/admin/orders
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, images: true, slug: true } },
          },
        },
        payment: { select: { status: true, method: true } },
      },
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/orders/:id
// ─────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: { product: true },
        },
        address: true,
        payment: true,
        coupon:  { include: { coupon: true } },
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/:id/status
// Body: { status }
// ─────────────────────────────────────────────────────────────
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "status is required" });
    if (!ALL_STATUSES.includes(status))
      return res.status(400).json({ error: `Invalid status: ${status}` });

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data:  { status },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update order status" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/:id/payment
// Body: { status }
// ─────────────────────────────────────────────────────────────
router.patch("/:id/payment", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updated = await prisma.payment.update({
      where: { orderId: req.params.id },
      data:  { status, paidAt: status === "PAID" ? new Date() : null },
    });

    await prisma.order.update({
      where: { id: req.params.id },
      data:  { status: "DELIVERED" },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update payment status" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/orders/:id/note
// Body: { adminNote }
// ─────────────────────────────────────────────────────────────
router.patch("/:id/note", async (req, res) => {
  try {
    const { adminNote } = req.body;

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data:  { adminNote: adminNote ?? null },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update note" });
  }
});

export default router;