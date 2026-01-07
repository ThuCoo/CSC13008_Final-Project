import bidService from "../services/bid.js";
import ratingService from "../services/rating.js";
import listingService from "../services/listing.js";
import userService from "../services/user.js";
import autoBidService from "../services/autoBid.js";
import emailLib from "../lib/email.js";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickBestCompetitor(autoBids, currentBidderId, nextMinAmount) {
  const eligible = autoBids.filter(
    (ab) =>
      ab.isActive &&
      Number(ab.userId) !== Number(currentBidderId) &&
      toNumber(ab.maxBidAmount) >= nextMinAmount
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => toNumber(b.maxBidAmount) - toNumber(a.maxBidAmount));
  return eligible[0];
}

function computeProxyOutcome(participants, step, currentAmount) {
  const sorted = [...participants].sort((a, b) => {
    const byMax = toNumber(b.max) - toNumber(a.max);
    if (byMax !== 0) return byMax;
    return (
      toNumber(a.tieBreaker, Number.MAX_SAFE_INTEGER) -
      toNumber(b.tieBreaker, Number.MAX_SAFE_INTEGER)
    );
  });

  const winner = sorted[0] || null;
  const runnerUp = sorted[1] || null;
  if (!winner || !runnerUp) return null;

  const winnerMax = toNumber(winner.max);
  const runnerUpMax = toNumber(runnerUp.max);

  let finalPrice = 0;
  if (winnerMax <= runnerUpMax) {
    finalPrice = winnerMax;
  } else {
    finalPrice = Math.min(winnerMax, runnerUpMax + step);
  }

  finalPrice = Math.max(finalPrice, currentAmount);

  return {
    winnerId: Number(winner.userId),
    winnerMax,
    runnerUpId: Number(runnerUp.userId),
    runnerUpMax,
    finalPrice,
  };
}

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
      const listing = await listingService.listOne(listingId, null, bidderId);
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
        return res
          .status(403)
          .json({ message: "Cannot bid on your own listing" });

      // only bidders can bid
      if (bidder.role !== "bidder")
        return res.status(403).json({ message: "Only bidders can place bids" });

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
        "bidder"
      );
      if (summary.total > 0) {
        const ratio = summary.up / summary.total;
        if (ratio < minRatio) {
          return res.status(403).json({
            message: `Bid denied: bidder rating too low (required >= ${minRatio})`,
          });
        }
      } else {
        const allowUnrated = listing.allowUnratedBidders !== false;
        if (!allowUnrated) {
          return res.status(403).json({
            message:
              "Bid denied: unrated bidders are not allowed for this listing",
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

      // enforce bid to be minimum.
      if (req.body.maxPrice != null) {
        const maxPrice = toNumber(req.body.maxPrice);
        if (!Number.isFinite(maxPrice) || maxPrice <= toNumber(amount)) {
          return res
            .status(400)
            .json({ message: "maxPrice must be greater than bid amount" });
        }
        if (Number(amount) !== minAccept) {
          return res.status(400).json({
            message:
              "When using auto-bid, the initial bid must equal the suggested minimum.",
          });
        }
      }

      // auto-extend if bid is made within window
      const autoExtendEnabled = process.env.AUTO_EXTEND_ENABLED !== "false";
      const windowMin = parseInt(process.env.AUTO_EXTEND_WINDOW_MINUTES || "5");
      const extMin = parseInt(
        process.env.AUTO_EXTEND_EXTENSION_MINUTES || "10"
      );
      const timeLeftMs = new Date(listing.endsAt) - new Date();
      let extended = false;
      const listingAutoExtendEnabled = listing.autoExtendEnabled !== false;
      if (
        autoExtendEnabled &&
        listingAutoExtendEnabled &&
        timeLeftMs <= windowMin * 60 * 1000
      ) {
        const newEnds = new Date(
          new Date(listing.endsAt).getTime() + extMin * 60 * 1000
        );
        const newAuto = Array.isArray(listing.autoExtendDates)
          ? [...listing.autoExtendDates, newEnds]
          : [newEnds];
        await listingService.update({
          listingId,
          endsAt: newEnds,
          autoExtendDates: newAuto,
        });
        listing.endsAt = newEnds;
        extended = true;
      }

      // identify previous high bidder
      const existingBids = await bidService.listAll(listingId);
      const prevHighBid = existingBids.length > 0 ? existingBids[0] : null;

      const row = await bidService.create(req.body);

      // notify seller of the new bid
      try {
        const seller = await userService.listOne(listing.sellerId);
        if (seller?.email) {
          emailLib
            .sendSellerBidEmail(
              seller.email,
              listing.title,
              bidder.name,
              Number(amount),
              listingId
            )
            .catch((e) => console.error("Email failed", e));
        }
      } catch (e) {
        console.error("Failed to send seller bid email", e);
      }

      // notify current bidder of success
      emailLib
        .sendBidSuccessEmail(
          bidder.email,
          listing.title,
          Number(amount),
          listingId
        )
        .catch((e) => console.error("Email failed", e));

      // notify previous bidder they've been outbid
      if (prevHighBid && prevHighBid.bidderId !== bidderId) {
        const prevUser = await userService.listOne(prevHighBid.bidderId);
        if (prevUser) {
          emailLib
            .sendOutbidEmail(
              prevUser.email,
              listing.title,
              Number(amount),
              listingId
            )
            .catch((e) => console.error("Email failed", e));
        }
      }

      // Auto-Bidding
      if (req.body.maxPrice && toNumber(req.body.maxPrice) > toNumber(amount)) {
        const existingAuto = await autoBidService.getByListingAndUser(
          listingId,
          bidderId
        );
        if (existingAuto) {
          await autoBidService.update(existingAuto.autoBidId, {
            maxBidAmount: req.body.maxPrice,
            isActive: true,
          });
        } else {
          await autoBidService.create({
            listingId,
            userId: bidderId,
            maxBidAmount: req.body.maxPrice,
            incrementAmount: step || 10,
            currentBidAmount: amount,
          });
        }
      }

      // Resolve auto-bidding war: bots continue until one reaches max.
      const autoBidsAll = (await autoBidService.listAll(null, listingId)) || [];
      const activeAutoBids = autoBidsAll.filter((ab) => ab.isActive);

      let finalBidRow = row;
      let note = "";
      let currentAmount = toNumber(amount);
      let currentBidderId = bidderId;

      const nextMin = currentAmount + step;
      const hasAnyCompetitor =
        pickBestCompetitor(activeAutoBids, currentBidderId, nextMin) != null;

      if (!hasAnyCompetitor) {
        await listingService.updateCurrentBid(
          listingId,
          currentAmount,
          bidderId
        );
      } else {
        const byUser = new Map();
        for (const ab of activeAutoBids) {
          const userId = Number(ab.userId);
          const max = toNumber(ab.maxBidAmount);
          if (!Number.isFinite(userId) || userId <= 0) continue;
          if (!Number.isFinite(max) || max <= 0) continue;
          const existing = byUser.get(userId);
          const tieBreaker = toNumber(ab.autoBidId, Number.MAX_SAFE_INTEGER);
          if (!existing || max > existing.max) {
            byUser.set(userId, { userId, max, tieBreaker });
          }
        }

        if (!byUser.has(Number(bidderId))) {
          byUser.set(Number(bidderId), {
            userId: Number(bidderId),
            max: currentAmount,
            tieBreaker: Number.MAX_SAFE_INTEGER,
          });
        }

        const outcome = computeProxyOutcome(
          [...byUser.values()],
          step,
          currentAmount
        );

        if (!outcome) {
          await listingService.updateCurrentBid(
            listingId,
            currentAmount,
            bidderId
          );
        } else {
          const { winnerId, runnerUpId, runnerUpMax, finalPrice } = outcome;

          // Optional: record runner-up reaching max (one bid), then winner at final price.
          const runnerUpBidAmount = Math.min(runnerUpMax, finalPrice - step);
          if (
            runnerUpBidAmount > currentAmount &&
            runnerUpBidAmount >= currentAmount + step
          ) {
            finalBidRow = await bidService.create({
              listingId,
              bidderId: runnerUpId,
              amount: runnerUpBidAmount,
            });
            currentAmount = runnerUpBidAmount;
            currentBidderId = runnerUpId;
          }

          if (finalPrice > currentAmount) {
            finalBidRow = await bidService.create({
              listingId,
              bidderId: winnerId,
              amount: finalPrice,
            });
            currentAmount = finalPrice;
            currentBidderId = winnerId;
          }

          await listingService.updateCurrentBid(
            listingId,
            currentAmount,
            currentBidderId
          );

          if (Number(currentBidderId) !== Number(bidderId)) {
            note = "You have been outbid by automatic bidding.";
            emailLib
              .sendOutbidEmail(
                bidder.email,
                listing.title,
                currentAmount,
                listingId
              )
              .catch((e) => console.error("Email failed", e));
          }
        }
      }

      if (
        listing.buyNowPrice &&
        Number(amount) >= Number(listing.buyNowPrice)
      ) {
        const orderService = await import("../services/order.js");
        await orderService.default.create({
          listingId,
          bidderId: bidderId,
          sellerId: listing.sellerId,
          finalPrice: amount,
          shippingAddress: null,
        });
        const updated = await listingService.listOne(listingId, null, bidderId);
        return res
          .status(201)
          .json({ bid: row, orderCreated: true, listing: updated });
      }

      const updated = await listingService.listOne(listingId, null, bidderId);
      return res
        .status(201)
        .json({ bid: finalBidRow, extended, listing: updated, note });
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
