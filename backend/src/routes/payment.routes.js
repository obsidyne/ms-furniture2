import { Router } from "express";
import prisma from "../lib/prisma.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// POST /api/payment/create-razorpay-order
// Create a Razorpay order for an existing system order
// ─────────────────────────────────────────────────────────────
router.post("/create-razorpay-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    // Amount is in smallest currency unit (paise for INR)
    const options = {
      amount: Math.round(Number(order.total) * 100),
      currency: "INR",
      receipt: order.id,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Update payment record with razorpayOrderId
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerId: rzpOrder.id },
    });

    return res.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      userName: order.user.name,
      userEmail: order.user.email,
    });
  } catch (err) {
    console.error("Razorpay Order Creation Error:", err);
    return res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payment/verify-razorpay
// Verify Razorpay signature and update order status
// ─────────────────────────────────────────────────────────────
router.post("/verify-razorpay", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Payment is authentic, update order and payment status
    const payment = await prisma.payment.findFirst({
      where: { providerId: razorpay_order_id },
    });

    if (!payment) return res.status(404).json({ error: "Payment record not found" });

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          transactionId: razorpay_payment_id,
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      }),
    ]);

    return res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("Razorpay Verification Error:", err);
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;