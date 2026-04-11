import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();
// All cart routes are protected — verifyToken is applied in app.js

// ─────────────────────────────────────────────────────────────
// GET /api/cart
// Returns the current user's cart with product details
// ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            inventory: { select: { quantity: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    return res.json({ items, subtotal: +subtotal.toFixed(2) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/cart
// Add item or increment quantity if already in cart
// Body: { productId, quantity }
// ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // Check product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    const stock = product.inventory?.quantity ?? 0;
    if (stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    // Upsert: create new or increment existing
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    let cartItem;
    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      if (newQty > stock) {
        return res.status(400).json({ error: "Not enough stock available" });
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data:  { quantity: newQty },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { userId: req.user.id, productId, quantity: Number(quantity) },
      });
    }

    return res.status(201).json(cartItem);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/cart/:productId
// Update quantity of a specific cart item
// Body: { quantity }
// ─────────────────────────────────────────────────────────────
router.patch("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity }  = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const item = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    if (!item) return res.status(404).json({ error: "Item not in cart" });

    // Verify stock
    const inventory = await prisma.inventory.findUnique({ where: { productId } });
    if (inventory && inventory.quantity < quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    const updated = await prisma.cartItem.update({
      where: { id: item.id },
      data:  { quantity: Number(quantity) },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/cart/:productId
// Remove a single item from the cart
// ─────────────────────────────────────────────────────────────
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id, productId },
    });

    return res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to remove cart item" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/cart/merge
// Called after login — merges guest localStorage cart into DB
// Body: { items: [{ productId, quantity }] }
// ─────────────────────────────────────────────────────────────
router.post("/merge", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.json({ message: "Nothing to merge" });

    for (const { productId, quantity } of items) {
      if (!productId || !quantity) continue;

      // Check product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true },
      });
      if (!product || !product.isActive) continue;

      const stock = product.inventory?.quantity ?? 0;

      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: req.user.id, productId } },
      });

      if (existing) {
        // Merge: take the higher quantity, capped at stock
        const mergedQty = Math.min(Math.max(existing.quantity, quantity), stock);
        await prisma.cartItem.update({
          where: { id: existing.id },
          data:  { quantity: mergedQty },
        });
      } else {
        // New item — add if stock allows
        const qty = Math.min(quantity, stock);
        if (qty > 0) {
          await prisma.cartItem.create({
            data: { userId: req.user.id, productId, quantity: qty },
          });
        }
      }
    }

    // Return the updated cart
    const updatedItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { inventory: { select: { quantity: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    const subtotal = updatedItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity, 0
    );

    return res.json({ items: updatedItems, subtotal: +subtotal.toFixed(2) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to merge cart" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/cart
// Clear entire cart (used after order is placed)
// ─────────────────────────────────────────────────────────────
router.delete("/", async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    return res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
});

export default router;