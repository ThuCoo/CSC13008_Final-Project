import { eq, desc } from "drizzle-orm";
import db from "../db/index.js";
import { orders, listings, users } from "../db/schema.js";
import listingService from "./listing.js";
import emailLib from "../lib/email.js";

const service = {
  getById: async function (orderId) {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        sellerId: orders.sellerId,
        bidderId: orders.bidderId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return rows[0] || null;
  },

  getByListingId: async function (listingId) {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        sellerId: orders.sellerId,
        bidderId: orders.bidderId,
        finalPrice: orders.finalPrice,
      })
      .from(orders)
      .where(eq(orders.listingId, listingId))
      .limit(1);
    return rows[0] || null;
  },

  create: async function ({
    listingId,
    bidderId,
    sellerId,
    finalPrice,
    shippingAddress = null,
    status = "pending_payment",
    sendEmails = true,
  }) {
    const result = await db
      .insert(orders)
      .values({
        listingId,
        bidderId,
        sellerId,
        finalPrice,
        status,
        shippingAddress,
      })
      .returning();
    // mark listing sold and close
    await listingService.update({
      listingId,
      status: "sold",
      endsAt: new Date(),
    });

    if (sendEmails) {
      // Send auction ended email to winner
      try {
        const listing = await listingService.listOne(listingId);
        const winner = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.userId, bidderId))
          .limit(1);

        const seller = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.userId, sellerId))
          .limit(1);

        if (winner[0] && listing) {
          await emailLib.sendAuctionEndedEmail(
            winner[0].email,
            listing.title,
            "won",
            finalPrice
          );
        }

        if (seller[0] && listing && winner[0]) {
          await emailLib.sendAuctionEndedSellerEmail(
            seller[0].email,
            listing.title,
            "with_winner",
            Number(finalPrice),
            winner[0].name
          );
        }
      } catch (emailErr) {
        console.error("Failed to send auction ended email:", emailErr);
      }
    }

    return result[0];
  },

  listBySeller: async function (sellerId, requesterRole = null) {
    const result = await db
      .select({
        id: orders.id,
        finalPrice: orders.finalPrice,
        status: orders.status,
        shippingAddress: orders.shippingAddress,
        paymentProof: orders.paymentProof,
        shippingProof: orders.shippingProof,
        createdAt: orders.createdAt,
        listingId: listings.listingId,
        listingTitle: listings.title,
        bidderName: users.name,
        bidderId: orders.bidderId,
      })
      .from(orders)
      .leftJoin(listings, eq(listings.listingId, orders.listingId))
      .leftJoin(users, eq(users.userId, orders.bidderId))
      .where(eq(orders.sellerId, sellerId))
      .orderBy(desc(orders.createdAt));
    return result.map((o) => ({
      ...o,
      bidderName: o.bidderName || "Unknown",
    }));
  },

  listByBidder: async function (bidderId) {
    const result = await db
      .select({
        id: orders.id,
        finalPrice: orders.finalPrice,
        status: orders.status,
        shippingAddress: orders.shippingAddress,
        paymentProof: orders.paymentProof,
        shippingProof: orders.shippingProof,
        createdAt: orders.createdAt,
        listingId: listings.listingId,
        listingTitle: listings.title,
        sellerName: users.name,
        sellerId: orders.sellerId,
      })
      .from(orders)
      .leftJoin(listings, eq(listings.listingId, orders.listingId))
      .leftJoin(users, eq(users.userId, orders.sellerId))
      .where(eq(orders.bidderId, bidderId))
      .orderBy(desc(orders.createdAt));
    return result;
  },

  updateStatus: async function (orderId, data) {
    const result = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  },
};

export default service;
