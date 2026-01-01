import bidService from "../services/bid.js";
import ratingService from "../services/rating.js";
import listingService from "../services/listing.js";
import userService from "../services/user.js";

const controller = {
  listAll: function (req, res, next) {
    const listingId = req.query.listingId ? Number(req.query.listingId) : null;
    const bidderId = req.query.bidderId ? Number(req.query.bidderId) : null;
    bidService
      .listAll(listingId, bidderId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    bidService
      .listOne(id)
      .then((item) => {
        if (!item) return res.status(404).json({ message: "Bid not found" });
        res.json(item);
      })
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
      const { listingId, bidderId, amount } = req.body;

      // Basic validations: listing exists, bidder exists
      const listing = await listingService.listOne(listingId);
      if (!listing)
        return res.status(404).json({ message: "Listing not found" });
      if (listing.status !== "active")
        return res.status(400).json({ message: "Listing not active" });
      const now = new Date();
      if (new Date(listing.endsAt) <= now)
        return res.status(400).json({ message: "Listing already ended" });

      const bidder = await userService.listOne(bidderId);
      if (!bidder) return res.status(404).json({ message: "Bidder not found" });

      // prevent self-bid
      if (bidderId === listing.sellerId)
        return res.status(403).json({ message: "Cannot bid on your own listing" });

      // only buyers can bid
      if (bidder.role !== "buyer")
        return res.status(403).json({ message: "Only buyers can place bids" });

      // rejected bidders
      const rejected = listing.rejectedBidders || [];
      if (Array.isArray(rejected) && rejected.includes(bidderId)) {
        return res
          .status(403)
          .json({ message: "Bidder rejected from this listing" });
      }

      // configurable minimum positive ratio
      const minRatio = parseFloat(process.env.RATING_MIN_POSITIVE_RATIO) || 0.8;
      const summary = await ratingService.summaryForUserByRole(
        bidderId,
        "buyer"
      );
      if (summary.total > 0) {
        const ratio = summary.up / summary.total;
        if (ratio < minRatio) {
          return res
            .status(403)
            .json({
              message: `Bid denied: bidder rating too low (required >= ${minRatio})`,
            });
        }
      }

      // amount validation
      const currentBid = Number(
        listing.currentBid || listing.startingPrice || 0
      );
      const step = Number(listing.stepPrice || 0);
      const minAccept = currentBid + step;
      if (Number(amount) < minAccept) {
        return res
          .status(400)
          .json({ message: `Amount must be at least ${minAccept}` });
      }

      // auto-extend if bid is made within window
      const autoExtendEnabled = process.env.AUTO_EXTEND_ENABLED !== "false";
      const windowMin = parseInt(process.env.AUTO_EXTEND_WINDOW_MINUTES || "5");
      const extMin = parseInt(process.env.AUTO_EXTEND_EXTENSION_MINUTES || "10");
      const timeLeftMs = new Date(listing.endsAt) - new Date();
      let extended = false;
      if (autoExtendEnabled && timeLeftMs <= windowMin * 60 * 1000) {
        const newEnds = new Date(new Date(listing.endsAt).getTime() + extMin * 60 * 1000);
        const newAuto = Array.isArray(listing.autoExtendDates) ? [...listing.autoExtendDates, newEnds] : [newEnds];
        await listingService.update({ listingId, endsAt: newEnds, autoExtendDates: newAuto });
        listing.endsAt = newEnds;
        extended = true;
      }

      const row = await bidService.create(req.body);

      // update listing currentBid
      await listingService.updateCurrentBid(listingId, amount);

      // buy now handling
      if (listing.buyNowPrice && Number(amount) >= Number(listing.buyNowPrice)) {
        // create order and mark listing sold
        const orderService = await import("../services/order.js");
        await orderService.default.create({ listingId, buyerId: bidderId, sellerId: listing.sellerId, finalPrice: amount, shippingAddress: null });
        // reflect sold status
        const updated = await listingService.listOne(listingId);
        return res.status(201).json({ bid: row, orderCreated: true, listing: updated });
      }

      const updated = await listingService.listOne(listingId);
      return res.status(201).json({ bid: row, extended, listing: updated });
    } catch (err) {
      next(err);
    }
  }, 

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    bidService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
