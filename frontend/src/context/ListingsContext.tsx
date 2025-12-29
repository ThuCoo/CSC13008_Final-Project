import React, { createContext, useContext, useState } from "react";

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface Question {
  id: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  timestamp: number;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  categories: string[];
  startingPrice: number;
  currentBid: number;
  stepPrice: number;
  buyNowPrice?: number;
  bids: Bid[];
  status: "active" | "ended" | "sold";
  createdAt: number;
  endsAt: number;
  condition: string;
  imageColor: string;
  shippingCost: number;
  returns: string;
  images: string[];
  autoExtendedDates: number[];
  rejectedBidders?: string[];
  questions: Question[];
}

type NewListingData = Omit<
  Listing,
  | "id"
  | "bids"
  | "createdAt"
  | "currentBid"
  | "status"
  | "autoExtendedDates"
  | "rejectedBidders"
  | "questions"
>;

interface ListingsContextType {
  listings: Listing[];
  createListing: (data: NewListingData) => Listing;
  updateListing: (id: string, data: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  endListing: (id: string) => void;
  placeBid: (
    listingId: string,
    bidderId: string,
    bidderName: string,
    amount: number,
    bidderStats?: { positive: number; total: number },
  ) => void;
  rejectBidder: (listingId: string, bidderId: string) => void;
  getListingById: (id: string) => Listing | undefined;
  getSellerListings: (sellerId: string) => Listing[];
  getActiveBiddingListings: (bidderId: string) => Listing[];
  extendAuctionIfNoBids: (id: string) => boolean;
  getListingsByCategory: (category: string) => Listing[];
  getTop5ClosingSoon: () => Listing[];
  getTop5MostBids: () => Listing[];
  getTop5HighestPrice: () => Listing[];
  addQuestion: (
    listingId: string,
    question: string,
    userId: string,
    userName: string,
  ) => void;
  answerQuestion: (
    listingId: string,
    questionId: string,
    answer: string,
  ) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined,
);

// Mock Data
const generateMockListings = (): Listing[] => {
  const categories = [
    { main: "Electronics", sub: ["Mobile Phones", "Laptops"] },
    { main: "Fashion", sub: ["Shoes", "Watches"] },
    { main: "Collectibles", sub: ["Coins", "Stamps"] },
  ];

  const listings: Listing[] = [];

  for (let i = 1; i <= 30; i++) {
    const cat = categories[i % 3];
    const sub = cat.sub[i % 2];
    const timeLeft = Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000);

    listings.push({
      id: i.toString(),
      sellerId: "2",
      sellerName: "Jane Seller",
      title: `${sub} Item #${i} - ${cat.main} Edition`,
      description: "Description...",
      category: cat.main,
      subCategory: sub,
      categories: [cat.main, sub],
      startingPrice: 1000000 * i,
      currentBid: 1000000 * i + Math.floor(Math.random() * 500000),
      stepPrice: 50000,
      bids: Array(Math.floor(Math.random() * 10))
        .fill(null)
        .map((_, idx) => ({
          id: `b${i}_${idx}`,
          bidderId: "1",
          bidderName: "Test User",
          amount: 1000000,
          timestamp: Date.now(),
        })),
      status: "active",
      createdAt: Date.now() - 100000,
      endsAt: Date.now() + timeLeft,
      condition: "New",
      imageColor: "from-rose-400 to-rose-600",
      shippingCost: 30000,
      returns: "None",
      images: [],
      autoExtendedDates: [],
      questions: [],
    });
  }
  return listings;
};

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(() => {
    const stored = localStorage.getItem("auctionhub_listings");
    if (stored) return JSON.parse(stored);
    return generateMockListings();
  });

  const saveListings = (newListings: Listing[]) => {
    setListings(newListings);
    localStorage.setItem("auctionhub_listings", JSON.stringify(newListings));
  };

  const createListing = (data: NewListingData) => {
    const newListing: Listing = {
      ...data,
      id: String(Date.now()),
      bids: [],
      createdAt: Date.now(),
      currentBid: data.startingPrice,
      status: "active" as const,
      autoExtendedDates: [],
      rejectedBidders: [],
      questions: [],
    };
    saveListings([newListing, ...listings]);
    return newListing;
  };

  const updateListing = (id: string, data: Partial<Listing>) => {
    const updated = listings.map((l) =>
      l.id === id ? ({ ...l, ...data } as Listing) : l,
    );
    saveListings(updated);
  };

  const deleteListing = (id: string) => {
    saveListings(listings.filter((l) => l.id !== id));
  };

  const endListing = (id: string) => {
    const updated = listings.map((l) =>
      l.id === id ? ({ ...l, status: "ended" } as Listing) : l,
    );
    saveListings(updated);
  };

  const placeBid = (
    listingId: string,
    bidderId: string,
    bidderName: string,
    amount: number,
    bidderStats?: { positive: number; total: number },
  ) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new Error("Listing not found");

    if (listing.rejectedBidders?.includes(bidderId)) {
      throw new Error("You have been blocked from bidding on this item.");
    }

    if (bidderStats) {
      const { positive, total } = bidderStats;
      if (total > 0) {
        const rating = (positive / total) * 100;
        if (rating < 80) {
          throw new Error(
            `Cannot bid. Your rating (${rating.toFixed(1)}%) is below 80%. `,
          );
        }
      }
    }
    if (amount <= listing.currentBid) throw new Error("Bid too low");

    let newEndsAt = listing.endsAt;
    const timeRemaining = listing.endsAt - Date.now();
    if (timeRemaining < 5 * 60 * 1000 && timeRemaining > 0) {
      newEndsAt += 10 * 60 * 1000;
    }

    const newBid = {
      id: String(Date.now()),
      bidderId,
      bidderName,
      amount,
      timestamp: Date.now(),
    };

    const updated = listings.map((l) =>
      l.id === listingId
        ? {
            ...l,
            bids: [newBid, ...l.bids],
            currentBid: amount,
            endsAt: newEndsAt,
          }
        : l,
    );

    saveListings(updated);
  };

  const rejectBidder = (listingId: string, bidderId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    const validBids = listing.bids.filter((b) => b.bidderId !== bidderId);

    let newPrice = listing.startingPrice;
    if (validBids.length > 0) {
      newPrice = Math.max(...validBids.map((b) => b.amount));
    }

    const updated = listings.map((l) =>
      l.id === listingId
        ? {
            ...l,
            bids: validBids,
            currentBid: newPrice,
            rejectedBidders: [...(l.rejectedBidders || []), bidderId],
          }
        : l,
    );

    saveListings(updated);
  };

  const getTop5ClosingSoon = () => {
    return listings
      .filter((l) => l.status === "active" && l.endsAt > Date.now())
      .sort((a, b) => a.endsAt - b.endsAt)
      .slice(0, 5);
  };

  const getTop5MostBids = () => {
    return listings
      .filter((l) => l.status === "active")
      .sort((a, b) => b.bids.length - a.bids.length)
      .slice(0, 5);
  };

  const getTop5HighestPrice = () => {
    return listings
      .filter((l) => l.status === "active")
      .sort((a, b) => b.currentBid - a.currentBid)
      .slice(0, 5);
  };

  const addQuestion = (
    listingId: string,
    questionText: string,
    userId: string,
    userName: string,
  ) => {
    const newQuestion: Question = {
      id: String(Date.now()),
      userId,
      userName,
      question: questionText,
      timestamp: Date.now(),
    };

    const updated = listings.map((l) =>
      l.id === listingId
        ? { ...l, questions: [...l.questions, newQuestion] }
        : l,
    );
    saveListings(updated);
  };

  const answerQuestion = (
    listingId: string,
    questionId: string,
    answer: string,
  ) => {
    const updated = listings.map((l) => {
      if (l.id === listingId) {
        const updatedQuestions = l.questions.map((q) =>
          q.id === questionId ? { ...q, answer } : q,
        );
        return { ...l, questions: updatedQuestions };
      }
      return l;
    });
    saveListings(updated);
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        createListing,
        updateListing,
        deleteListing,
        endListing,
        placeBid,
        rejectBidder,
        getListingById: (id) => listings.find((l) => l.id === id),
        getSellerListings: (id) => listings.filter((l) => l.sellerId === id),
        getActiveBiddingListings: (id) =>
          listings.filter((l) => l.bids.some((b) => b.bidderId === id)),
        extendAuctionIfNoBids: (_id) => false, // placeholder
        getListingsByCategory: (cat) =>
          listings.filter((l) => l.category === cat),
        getTop5ClosingSoon,
        getTop5MostBids,
        getTop5HighestPrice,
        addQuestion,
        answerQuestion,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingsContext);
  if (!context) throw new Error("useListings must be used within provider");
  return context;
}
