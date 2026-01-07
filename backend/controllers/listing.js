import listingService from "../services/listing.js";
import sellerRequestService from "../services/sellerRequest.js";
import emailLib from "../lib/email.js";
import userService from "../services/user.js";

const controller = {
  getTop5ClosingSoon: function (req, res, next) {
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    listingService
      .top5ClosingSoonSummary({ limit: 5, requesterId, requesterRole })
      .then((data) => res.json(data || []))
      .catch(next);
  },

  getTop5HighestPrice: function (req, res, next) {
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    listingService
      .top5HighestPriceSummary({ limit: 5, requesterId, requesterRole })
      .then((data) => res.json(data || []))
      .catch(next);
  },

  getTop5MostBids: function (req, res, next) {
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    listingService
      .top5MostBidsSummary({ limit: 5, requesterId, requesterRole })
      .then((data) => res.json(data || []))
      .catch(next);
  },

  listAll: function (req, res, next) {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    const cat = req.query.cat ? String(req.query.cat) : undefined;
    const sub = req.query.sub ? String(req.query.sub) : undefined;
    const mode = req.query.mode ? String(req.query.mode) : undefined;
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    const fn =
      mode === "summary"
        ? listingService.listAllSummary
        : listingService.listAll;
    fn.call(listingService, {
      page,
      limit,
      sort,
      cat,
      sub,
      requesterId,
      requesterRole,
    })
      .then((result) => {
        res.json(result);
      })
      .catch((err) => {
        console.error("Error in listAll controller:", err);
        next(err);
      });
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    listingService
      .listOne(id, null, requesterId, requesterRole)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Listing not found" });
        res.json(item);
      })
      .catch(next);
  },

  search: function (req, res, next) {
    const q = req.query.q;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    const mode = req.query.mode ? String(req.query.mode) : undefined;
    const requesterId = req.user?.userId || null;
    const requesterRole = req.user?.role || null;
    const fn =
      mode === "summary"
        ? listingService.searchListingsSummary
        : listingService.searchListings;
    fn.call(listingService, {
      query: q,
      page,
      limit,
      sort,
      requesterId,
      requesterRole,
    })
      .then((result) => res.json(result))
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const isAdmin = req.user.role === "admin";
      const sellerId = Number(req.body.sellerId);
      if (!isAdmin && Number(req.user.userId) !== sellerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const requests = await sellerRequestService.listAll(req.body.sellerId);
      const approved = requests.find((r) => r.status === "approved");

      // If no approved request found but user has seller role, allow (for seed data)
      if (!approved) {
        const user = req.user;
        if (!user || user.role !== "seller") {
          return res.status(403).json({
            message:
              "Seller privileges required. Please request seller approval.",
          });
        }
      } else if (approved.reviewedAt) {
        const validDays = 7;
        const expireDate = new Date(
          new Date(approved.reviewedAt).getTime() +
            validDays * 24 * 60 * 60 * 1000
        );
        if (new Date() > expireDate) {
          return res.status(403).json({
            message: "Seller privileges expired. Please request renewal.",
          });
        }
      }

      const created = await listingService.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  update: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const requesterId = req.user?.userId || null;
      const requesterRole = req.user?.role || null;
      if (!requesterId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const existing = await listingService.listOne(
        id,
        null,
        requesterId,
        requesterRole
      );
      if (!existing)
        return res.status(404).json({ message: "Listing not found" });

      const isAdmin = requesterRole === "admin";
      const isOwnerSeller = String(existing.sellerId) === String(requesterId);
      if (!isAdmin && !isOwnerSeller) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Append-Only Description Check
      if (
        req.body.description &&
        req.body.description !== existing.description
      ) {
        if (!req.body.description.startsWith(existing.description)) {
          return res.status(400).json({
            message: "Description cannot be edited, only appended to.",
          });
        }

        // Send email to all current bidders about description update
        if (existing.bids && existing.bids.length > 0) {
          const bidService = await import("../services/bid.js");
          const allBids = await bidService.default.listAll(id);
          const uniqueBidders = [...new Set(allBids.map((b) => b.bidderId))];

          for (const bidderId of uniqueBidders) {
            try {
              const bidder = await userService.listOne(Number(bidderId));
              if (bidder && bidder.email) {
                await emailLib.sendListingUpdatedEmail(
                  bidder.email,
                  existing.title,
                  id
                );
              }
            } catch (emailErr) {
              console.error(
                `Failed to send listing update email to bidder ${bidderId}:`,
                emailErr
              );
            }
          }
        }
      }

      // Send email notification if bidders were rejected
      let nextCurrentBid = null;
      if (req.body.rejectedBidders && Array.isArray(req.body.rejectedBidders)) {
        const existingRejected = existing.rejectedBidders || [];
        const newRejected = req.body.rejectedBidders.filter(
          (bidderId) => !existingRejected.includes(bidderId)
        );

        if (newRejected.length > 0) {
          try {
            const bidService = (await import("../services/bid.js")).default;
            const allBefore = await bidService.listAll(id);
            const prevTop = allBefore.length > 0 ? allBefore[0] : null;

            for (const bidderId of newRejected) {
              await bidService.removeForListingBidder(id, Number(bidderId));
            }

            if (prevTop && newRejected.includes(String(prevTop.bidderId))) {
              const after = await bidService.listAll(id);
              nextCurrentBid =
                after.length > 0
                  ? Number(after[0].amount)
                  : Number(existing.startingPrice || 0);
            }
          } catch (e) {
            console.error("Failed to apply reject transfer logic", e);
          }
        }

        for (const bidderId of newRejected) {
          try {
            const bidder = await userService.listOne(Number(bidderId));
            if (bidder && bidder.email) {
              await emailLib.sendBidderRejectedEmail(
                bidder.email,
                bidder.name,
                existing.title
              );
            }
          } catch (emailErr) {
            console.error(
              `Failed to send rejection email to bidder ${bidderId}:`,
              emailErr
            );
          }
        }
      }

      const updates = { ...req.body, listingId: id };
      if (nextCurrentBid != null) updates.currentBid = nextCurrentBid;
      const updated = await listingService.update(updates);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const requesterId = req.user?.userId || null;
      const requesterRole = req.user?.role || null;
      if (!requesterId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const existing = await listingService.listOne(
        id,
        null,
        requesterId,
        requesterRole
      );
      if (!existing)
        return res.status(404).json({ message: "Listing not found" });

      const isAdmin = requesterRole === "admin";
      const isOwnerSeller = String(existing.sellerId) === String(requesterId);
      if (!isAdmin && !isOwnerSeller) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (existing.bids && existing.bids.length > 0) {
        return res
          .status(400)
          .json({ message: "Cannot remove listing that already has bids." });
      }

      await listingService.remove(id);
      res.json({});
    } catch (err) {
      next(err);
    }
  },

  listParticipating: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId)
        return res.status(401).json({ message: "Unauthorized" });

      const requesterRole = req.user?.role || null;
      const listings = await listingService.listParticipating(
        req.user.userId,
        requesterRole
      );
      res.json(listings);
    } catch (err) {
      next(err);
    }
  },

  listWon: async function (req, res, next) {
    try {
      if (!req.user || !req.user.userId)
        return res.status(401).json({ message: "Unauthorized" });

      const requesterRole = req.user?.role || null;
      const listings = await listingService.listWon(
        req.user.userId,
        requesterRole
      );
      res.json(listings);
    } catch (err) {
      next(err);
    }
  },
};

export default controller;
