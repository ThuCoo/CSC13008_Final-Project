import sellerRequestService from "../services/sellerRequest.js";
import userService from "../services/user.js";
import emailLib from "../lib/email.js";

const controller = {
  listAll: function (req, res, next) {
    const requester = req.user;
    const isAdmin = requester?.role === "admin";

    const userIdRaw = req.query.userId ? Number(req.query.userId) : null;
    const reviewedByRaw = req.query.reviewedBy
      ? Number(req.query.reviewedBy)
      : null;

    const userId = isAdmin ? userIdRaw : Number(requester?.userId);
    const reviewedBy = isAdmin ? reviewedByRaw : null;
    sellerRequestService
      .listAll(userId, reviewedBy)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    sellerRequestService
      .listOne(id)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Seller request not found" });

        const requester = req.user;
        const isAdmin = requester?.role === "admin";
        if (!isAdmin && Number(requester?.userId) !== Number(item.userId)) {
          return res.status(403).json({ message: "Forbidden" });
        }

        res.json(item);
      })
      .catch(next);
  },

  create: function (req, res, next) {
    sellerRequestService
      .create(req.body)
      .then((row) => res.status(201).json(row))
      .catch(next);
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await sellerRequestService.listOne(id);
      if (!existing)
        return res.status(404).json({ message: "Seller request not found" });

      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const nextStatus = req.body.status;
      const statusChanged =
        nextStatus && String(nextStatus) !== String(existing.status);

      const updates = { ...existing, ...req.body, requestId: id };
      if (statusChanged) {
        if (updates.reviewedBy == null) updates.reviewedBy = req.user.userId;
        if (updates.reviewedAt == null) updates.reviewedAt = new Date();
      }
      const updated = await sellerRequestService.update(updates);

      // Send email notification based on status change
      if (req.body.status && req.body.status !== existing.status) {
        try {
          const user = await userService.listOne(existing.userId);
          if (user && user.email) {
            if (req.body.status === "approved") {
              await emailLib.sendSellerApprovalEmail(user.email, user.name);
            } else if (req.body.status === "rejected") {
              const reason = req.body.rejectionReason || "No reason provided";
              await emailLib.sendSellerRejectionEmail(
                user.email,
                user.name,
                reason
              );
            }
          }
        } catch (emailErr) {
          console.error("Failed to send email notification:", emailErr);
        }
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    sellerRequestService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
