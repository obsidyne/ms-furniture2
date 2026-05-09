import { Router } from "express";
import prisma from "../lib/prisma.js";

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

router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
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
// GET /api/orders/:id
// Single order detail
// ─────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { product: true },
        },
        address: true,
        payment: true,
        coupon:  { include: { coupon: true } },
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id)
      return res.status(403).json({ error: "Access denied" });

    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/orders
// Place a new order
// Body: { addressId, paymentMethod, couponId? }
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { addressId, paymentMethod, couponId } = req.body;

    if (!addressId)     return res.status(400).json({ error: "addressId is required" });
    if (!paymentMethod) return res.status(400).json({ error: "paymentMethod is required" });

    // Validate address belongs to user
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== req.user.id)
      return res.status(400).json({ error: "Invalid address" });

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where:   { userId: req.user.id },
      include: { product: { include: { inventory: true } } },
    });

    if (cartItems.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    // Validate stock for every item
    for (const item of cartItems) {
      const stock = item.product.inventory?.quantity ?? 0;
      if (!item.product.isActive)
        return res.status(400).json({ error: `${item.product.name} is no longer available` });
      if (stock < item.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
    }

    // Calculate totals
    const subtotal       = cartItems.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    const shippingCharge = subtotal >= 5000 ? 0 : 299;

    // Apply coupon if provided
    let discount = 0;
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (coupon && coupon.isActive) {
        if (coupon.discountPct)  discount = (subtotal * coupon.discountPct) / 100;
        if (coupon.discountFlat) discount = Number(coupon.discountFlat);
        discount = Math.min(discount, subtotal);
      }
    }

    const total = subtotal + shippingCharge - discount;

    // Create order in a transaction — deduct stock, clear cart, log coupon usage
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId:        req.user.id,
          addressId,
          subtotal,
          shippingCharge,
          discount,
          total,
          status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
          items: {
            create: cartItems.map((i) => ({
              productId: i.productId,
              quantity:  i.quantity,
              price:     i.product.price,
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method:  paymentMethod,
          amount:  total,
          status:  "PENDING",
        },
      });

      // Deduct inventory
      for (const item of cartItems) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data:  { quantity: { decrement: item.quantity } },
        });
      }

      // Log coupon usage
      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, orderId: newOrder.id },
        });
        await tx.coupon.update({
          where: { id: couponId },
          data:  { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

      return newOrder;
    });

    return res.status(201).json({ orderId: order.id, total: order.total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to place order" });
  }
});

export default router;