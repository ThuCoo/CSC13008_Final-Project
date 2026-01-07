import orderService from "../services/order.js";
import orderMessageService from "../services/orderMessage.js";
import ratingService from "../services/rating.js";

const controller = {
  listForSeller: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId)
        return res.status(401).json({ message: "Unauthorized" });
      const requesterRole = req.user?.role || null;
      const orders = await orderService.listBySeller(
        req.user.userId,
        requesterRole
      );
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  listForBidder: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId)
        return res.status(401).json({ message: "Unauthorized" });
      const orders = await orderService.listByBidder(req.user.userId);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  updateStatus: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = Number(req.params.id);
      const { status, proof, shippingAddress } = req.body;

      const existing = await orderService.getById(id);
      if (!existing)
        return res.status(404).json({ message: "Order not found" });

      const actorId = Number(req.user.userId);
      const isAdmin = req.user.role === "admin";

      const isSeller = Number(existing.sellerId) === actorId;
      const isBidder = Number(existing.bidderId) === actorId;

      if (!isAdmin && !isSeller && !isBidder) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const currentStatus = String(existing.status);
      const nextStatus = String(status);

      // Basic flow enforcement
      if (!isAdmin) {
        if (isBidder) {
          if (nextStatus === "paid") {
            if (currentStatus !== "pending_payment") {
              return res.status(400).json({
                message:
                  "Can only submit payment when status is pending_payment.",
              });
            }

            if (!proof || String(proof).trim().length === 0) {
              return res
                .status(400)
                .json({ message: "Payment proof is required." });
            }
            if (
              !shippingAddress ||
              String(shippingAddress).trim().length === 0
            ) {
              return res
                .status(400)
                .json({ message: "Shipping address is required." });
            }
          } else if (nextStatus === "delivered") {
            if (currentStatus !== "shipped") {
              return res
                .status(400)
                .json({ message: "Can only confirm delivery after shipment." });
            }
          } else {
            return res.status(403).json({
              message: "Bidder is not allowed to set this status.",
            });
          }
        }

        if (isSeller) {
          if (nextStatus === "shipped") {
            if (currentStatus !== "paid") {
              return res
                .status(400)
                .json({ message: "Can only mark shipped after payment." });
            }

            if (!proof || String(proof).trim().length === 0) {
              return res
                .status(400)
                .json({ message: "Shipping proof is required." });
            }
          } else if (nextStatus === "completed") {
            if (currentStatus !== "delivered") {
              return res
                .status(400)
                .json({ message: "Can only complete after delivery." });
            }

            const hasBoth = await ratingService.hasMutualRatings({
              sellerId: existing.sellerId,
              bidderId: existing.bidderId,
            });
            if (!hasBoth) {
              return res.status(400).json({
                message:
                  "Both parties must rate the transaction before completion.",
              });
            }
          } else if (nextStatus === "cancelled") {
            if (["completed", "cancelled"].includes(currentStatus)) {
              return res.status(400).json({
                message: "Cannot cancel a completed/cancelled order.",
              });
            }
          } else if (!isBidder) {
            return res.status(403).json({
              message: "Seller is not allowed to set this status.",
            });
          }
        }
      }

      const data = { status };

      if (nextStatus === "paid") {
        data.paymentProof = proof;
        data.shippingAddress = shippingAddress;
      }
      if (nextStatus === "shipped") {
        data.shippingProof = proof;
      }

      const updated = await orderService.updateStatus(id, data);

      // seller cancelling
      if (!isAdmin && isSeller && nextStatus === "cancelled") {
        try {
          await ratingService.upsert({
            targetUserId: Number(existing.bidderId),
            raterUserId: Number(existing.sellerId),
            role: "bidder",
            rating: -1,
            comment: "Winner did not pay",
          });
        } catch (rateErr) {
          console.error("Failed to auto-rate bidder on cancellation:", rateErr);
        }
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  listMessages: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderId = Number(req.params.id);
      const existing = await orderService.getById(orderId);
      if (!existing)
        return res.status(404).json({ message: "Order not found" });

      const actorId = Number(req.user.userId);
      const isAdmin = req.user.role === "admin";
      const isSeller = Number(existing.sellerId) === actorId;
      const isBidder = Number(existing.bidderId) === actorId;

      if (!isAdmin && !isSeller && !isBidder) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await orderMessageService.listByOrderId(orderId);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  },

  postMessage: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const orderId = Number(req.params.id);
      const { message } = req.body;

      if (!message || String(message).trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      const existing = await orderService.getById(orderId);
      if (!existing)
        return res.status(404).json({ message: "Order not found" });

      const actorId = Number(req.user.userId);
      const isAdmin = req.user.role === "admin";
      const isSeller = Number(existing.sellerId) === actorId;
      const isBidder = Number(existing.bidderId) === actorId;

      if (!isAdmin && !isSeller && !isBidder) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const row = await orderMessageService.create({
        orderId,
        senderId: actorId,
        message: String(message).trim(),
      });

      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  },
};

export default controller;
