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
          const { status, proof } = req.body;
          const data = { status };
          if (proof) {
              if (status === "paid") data.paymentProof = proof;
              if (status === "shipped") data.shippingProof = proof;
          }
          const updated = await orderService.updateStatus(id, data);
          res.json(updated);
      } catch (err) {
          next(err);
      }
  }
};

export default controller;
