import questionService from "../services/question.js";

const controller = {
  listAll: function (req, res, next) {
    const listingId = req.query.listingId ? Number(req.query.listingId) : null;
    const userId = req.query.userId ? Number(req.query.userId) : null;
    questionService
      .listAll(listingId, userId)
      .then((rows) => res.json(rows))
      .catch(next);
  },

  listOne: function (req, res, next) {
    const id = Number(req.params.id);
    questionService
      .listOne(id)
      .then((item) => {
        if (!item)
          return res.status(404).json({ message: "Question not found" });
        res.json(item);
      })
      .catch(next);
  },

  create: async function (req, res, next) {
    try {
      const { listingId, questionText } = req.body;
      const requesterId = req.user?.userId || null;
      const row = await questionService.create(req.body);

      // Notify seller
      const listingService = (await import("../services/listing.js")).default;
      const userService = (await import("../services/user.js")).default;
      const emailLib = (await import("../lib/email.js")).default;

      const listing = await listingService.listOne(
        listingId,
        null,
        requesterId
      );
      if (listing) {
        const seller = await userService.listOne(listing.sellerId);
        if (seller) {
          emailLib
            .sendQuestionEmail(seller.email, listing.title, questionText)
            .catch(console.error);
        }
      }

      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  },

  answer: async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const existing = await questionService.listOne(id);
      if (!existing)
        return res.status(404).json({ message: "Question not found" });

      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const listingService = (await import("../services/listing.js")).default;
      const userService = (await import("../services/user.js")).default;
      const bidService = (await import("../services/bid.js")).default;
      const emailLib = (await import("../lib/email.js")).default;

      const listing = await listingService.listOne(existing.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const isAdmin = req.user.role === "admin";
      const isSeller = Number(listing.sellerId) === Number(req.user.userId);
      if (!isAdmin && !isSeller) {
        return res.status(403).json({ message: "Only the seller can answer." });
      }

      const updates = { ...existing, ...req.body, questionId: id };
      const updated = await questionService.update(updates);

      // Notify askers + bidders involved
      try {
        const allQuestions = await questionService.listAll(existing.listingId);
        const askers = allQuestions.map((q) => Number(q.userId));
        const allBids = await bidService.listAll(existing.listingId);
        const bidders = allBids.map((b) => Number(b.bidderId));
        const recipients = [...new Set([...askers, ...bidders])].filter(
          (uid) => uid && uid !== Number(listing.sellerId)
        );

        for (const uid of recipients) {
          const u = await userService.listOne(uid);
          if (u?.email) {
            emailLib
              .sendQuestionAnsweredEmail(
                u.email,
                listing.title,
                existing.questionText,
                updated.answerText || req.body.answer || "",
                existing.listingId
              )
              .catch(console.error);
          }
        }
      } catch (e) {
        console.error("Failed to send question answered emails", e);
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  remove: function (req, res, next) {
    const id = Number(req.params.id);
    questionService
      .remove(id)
      .then(() => res.json({}))
      .catch(next);
  },
};

export default controller;
