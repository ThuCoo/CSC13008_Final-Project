import orderService from "../services/order.js";

const controller = {
  listForSeller: async function (req, res, next) {
    try {
        if (!req.user || !req.user.userId) return res.status(401).json({ message: "Unauthorized" });
        const orders = await orderService.listBySeller(req.user.userId);
        res.json(orders);
    } catch (err) {
        next(err);
    }
  },

  updateStatus: async function (req, res, next) {
      try {
          const id = Number(req.params.id);
          const { status } = req.body;
          // Valid statuses: paid, shipped, delivered, completed, cancelled
          const updated = await orderService.updateStatus(id, status);
          res.json(updated);
      } catch (err) {
          next(err);
      }
  }
};

export default controller;
