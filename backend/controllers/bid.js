import bidService from "../services/bid.js";
import ratingService from "../services/rating.js";
import listingService from "../services/listing.js";
import userService from "../services/user.js";
import autoBidService from "../services/autoBid.js";
import emailLib from "../lib/email.js";

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
        const maxPrice = Number(req.body.maxPrice);
        if (!Number.isFinite(maxPrice) || maxPrice <= Number(amount)) {
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
      if (req.body.maxPrice && Number(req.body.maxPrice) > Number(amount)) {
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

      const otherAutoBids = await autoBidService.listAll(null, listingId);
      const competitorBids = otherAutoBids.filter(
        (ab) =>
          ab.userId !== bidderId &&
          ab.isActive &&
          Number(ab.maxBidAmount) > Number(amount)
      );

      let finalBidRow = row;
      let note = "";

      if (competitorBids.length > 0) {
        competitorBids.sort(
          (a, b) => Number(b.maxBidAmount) - Number(a.maxBidAmount)
        );
        const bestBot = competitorBids[0];
        let counterBid = Number(amount) + Number(step);
        if (counterBid <= Number(bestBot.maxBidAmount)) {
          const botBid = await bidService.create({
            listingId,
            bidderId: bestBot.userId,
            amount: counterBid,
          });
          await listingService.updateCurrentBid(
            listingId,
            counterBid,
            bidderId
          );

          // notify seller of the auto-bid counter bid
          try {
            const seller = await userService.listOne(listing.sellerId);
            const botUser = await userService.listOne(bestBot.userId);
            if (seller?.email && botUser) {
              emailLib
                .sendSellerBidEmail(
                  seller.email,
                  listing.title,
                  botUser.name,
                  counterBid,
                  listingId
                )
                .catch((e) => console.error("Email failed", e));
            }
          } catch (e) {
            console.error("Failed to send seller bid email", e);
          }

          // notify user they were outbid by bot
          emailLib
            .sendOutbidEmail(bidder.email, listing.title, counterBid, listingId)
            .catch((e) => console.error("Email failed", e));

          // notify bot owner they bid successfully
          const botUser = await userService.listOne(bestBot.userId);
          if (botUser) {
            emailLib
              .sendBidSuccessEmail(
                botUser.email,
                listing.title,
                counterBid,
                listingId
              )
              .catch((e) => console.error("Email failed", e));
          }

          if (
            autoExtendEnabled &&
            new Date(listing.endsAt) - new Date() <= windowMin * 60 * 1000
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

          finalBidRow = botBid;
          note = "You have been outbid by an automatic bid.";
        }
      } else {
        await listingService.updateCurrentBid(listingId, amount, bidderId);
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
