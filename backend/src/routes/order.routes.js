import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();
// All order routes are protected via app.js

// ─────────────────────────────────────────────────────────────
// GET /api/orders
// List all orders for the logged-in user
// ─────────────────────────────────────────────────────────────
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
      // Create order
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

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method:  paymentMethod,
          amount:  total,
          status:  paymentMethod === "COD" ? "PENDING" : "PENDING",
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