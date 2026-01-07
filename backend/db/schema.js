import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  decimal,
  json,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar("name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  role: varchar("role").default("bidder").notNull(),
  seller_approved: boolean("seller_approved").default(false).notNull(),
  address: text("address").notNull(),
  birthday: varchar("birthday"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otps = pgTable("otps", {
  otpId: serial("otp_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId),
  code: varchar("code").notNull(),
  purpose: varchar("purpose").notNull(), // 'verify' | 'reset'
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  categoryId: serial("category_id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subcategories = pgTable("subcategories", {
  subcategoryId: serial("subcategory_id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.categoryId),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  listingId: serial("listing_id").primaryKey(),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.userId),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.categoryId),
  subcategoryId: integer("subcategory_id")
    .notNull()
    .references(() => subcategories.subcategoryId),
  startingPrice: decimal("starting_price").notNull(),
  currentBid: decimal("current_bid").notNull(),
  stepPrice: decimal("step_price").notNull(),
  buyNowPrice: decimal("buy_now_price"),
  status: varchar("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endsAt: timestamp("ends_at").notNull(),
  itemCondition: varchar("item_condition").notNull(),
  shippingCost: decimal("shipping_cost").notNull(),
  returnPolicy: text("return_policy").notNull(),
  images: json("images").notNull(),
  autoExtendEnabled: boolean("auto_extend_enabled").default(true).notNull(),
  autoExtendDates: json("auto_extended_dates").notNull(),
  allowUnratedBidders: boolean("allow_unrated_bidders").default(true).notNull(),
  rejectedBidders: json("rejected_bidders"),
});

export const bids = pgTable("bids", {
  bidId: serial("bid_id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.listingId),
  bidderId: integer("bidder_id")
    .notNull()
    .references(() => users.userId),
  amount: decimal("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  questionId: serial("question_id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.listingId),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchlists = pgTable("watchlists", {
  userId: integer("user_id")
    .references(() => users.userId)
    .primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.listingId)
    .primaryKey(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const sellerRequests = pgTable("seller_requests", {
  requestId: serial("request_id").primaryKey(),
  userId: integer("user_id").references(() => users.userId),
  businessName: varchar("business_name").notNull(),
  businessDescription: text("business_description"),
  status: varchar("status").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.userId),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  ratingId: serial("rating_id").primaryKey(),
  targetUserId: integer("target_user_id")
    .notNull()
    .references(() => users.userId),
  raterUserId: integer("rater_user_id")
    .notNull()
    .references(() => users.userId),
  rating: integer("rating").notNull(), // 1 or -1
  role: varchar("role").notNull(), // 'bidder' or 'seller'
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.listingId),
  bidderId: integer("bidder_id")
    .notNull()
    .references(() => users.userId),
  sellerId: integer("seller_id")
    .notNull()
    .references(() => users.userId),
  finalPrice: decimal("final_price").notNull(),
  status: varchar("status").notNull(),
  shippingAddress: text("shipping_address"),
  paymentProof: text("payment_proof"),
  shippingProof: text("shipping_proof"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderMessages = pgTable("order_messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.userId),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
