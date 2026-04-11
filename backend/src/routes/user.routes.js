import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();
// All user routes are protected via app.js

// ─────────────────────────────────────────────────────────────
// GET /api/users/profile
// ─────────────────────────────────────────────────────────────
router.get("/profile", (req, res) => {
  const { id, name, email, phone, avatarUrl, role, createdAt } = req.user;
  return res.json({ id, name, email, phone, avatarUrl, role, createdAt });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/profile
// Body: { name, phone }
// ─────────────────────────────────────────────────────────────
router.patch("/profile", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data:  { name, phone },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/addresses
// ─────────────────────────────────────────────────────────────
router.get("/addresses", async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where:   { userId: req.user.id },
      orderBy: { isDefault: "desc" },
    });
    return res.json(addresses);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/users/addresses
// Body: { name, phone, line1, line2, city, state, pincode, isDefault }
// ─────────────────────────────────────────────────────────────
router.post("/addresses", async (req, res) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!name || !phone || !line1 || !city || !state || !pincode)
      return res.status(400).json({ error: "All required fields must be filled" });

    // If this is the default address, unset previous default
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data:  { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { userId: req.user.id, name, phone, line1, line2, city, state, pincode, isDefault: !!isDefault },
    });
    return res.status(201).json(address);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create address" });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/users/addresses/:id
// ─────────────────────────────────────────────────────────────
router.patch("/addresses/:id", async (req, res) => {
  try {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!address || address.userId !== req.user.id)
      return res.status(404).json({ error: "Address not found" });

    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data:  { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data:  { name, phone, line1, line2, city, state, pincode, isDefault: !!isDefault },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update address" });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/users/addresses/:id
// ─────────────────────────────────────────────────────────────
router.delete("/addresses/:id", async (req, res) => {
  try {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!address || address.userId !== req.user.id)
      return res.status(404).json({ error: "Address not found" });

    await prisma.address.delete({ where: { id: req.params.id } });
    return res.json({ message: "Address deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete address" });
  }
});

export default router;