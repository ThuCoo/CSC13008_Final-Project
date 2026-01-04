/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

export interface RejectedBidder {
  listingId: string;
  bidderId: string;
  reason: string;
  createdAt: number;
}

export interface BidIncrement {
  rangeMin: number;
  rangeMax: number;
  increment: number;
}

interface BiddingRulesContextType {
  rejectedBidders: RejectedBidder[];
  bidIncrements: BidIncrement[];
  rejectBidder: (listingId: string, bidderId: string, reason: string) => void;
  unrejectBidder: (listingId: string, bidderId: string) => void;
  isBidderRejected: (listingId: string, bidderId: string) => boolean;
  getRejectedBiddersForListing: (listingId: string) => RejectedBidder[];
  calculateMinimumBid: (currentBid: number) => number;
  validateBid: (
    listingId: string,
    bidderId: string,
    bidAmount: number,
    currentBid: number
  ) => { valid: boolean; message: string };
}

const BiddingRulesContext = createContext<BiddingRulesContextType | undefined>(
  undefined
);

const INITIAL_REJECTED_BIDDERS: RejectedBidder[] = [];

const DEFAULT_BID_INCREMENTS: BidIncrement[] = [
  { rangeMin: 0, rangeMax: 9.99, increment: 0.25 },
  { rangeMin: 10, rangeMax: 99.99, increment: 0.5 },
  { rangeMin: 100, rangeMax: 249.99, increment: 1 },
  { rangeMin: 250, rangeMax: 499.99, increment: 2.5 },
  { rangeMin: 500, rangeMax: 999.99, increment: 5 },
  { rangeMin: 1000, rangeMax: 2499.99, increment: 10 },
  { rangeMin: 2500, rangeMax: 4999.99, increment: 25 },
  { rangeMin: 5000, rangeMax: Infinity, increment: 50 },
];

export function BiddingRulesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rejectedBidders, setRejectedBidders] = useState<RejectedBidder[]>(
    () => {
      const stored = localStorage.getItem("auctionhub_rejected_bidders");
      if (!stored) return INITIAL_REJECTED_BIDDERS;
      return JSON.parse(stored);
    }
  );

  const [bidIncrements] = useState<BidIncrement[]>(DEFAULT_BID_INCREMENTS);

  const saveRejectedBidders = (newRejected: RejectedBidder[]) => {
    setRejectedBidders(newRejected);
    localStorage.setItem(
      "auctionhub_rejected_bidders",
      JSON.stringify(newRejected)
    );
  };

  const rejectBidder = (
    listingId: string,
    bidderId: string,
    reason: string
  ) => {
    if (!isBidderRejected(listingId, bidderId)) {
      const newRejected: RejectedBidder = {
        listingId,
        bidderId,
        reason,
        createdAt: new Date().getTime(),
      };
      saveRejectedBidders([...rejectedBidders, newRejected]);
    }
  };

  const unrejectBidder = (listingId: string, bidderId: string) => {
    const filtered = rejectedBidders.filter(
      (r) => !(r.listingId === listingId && r.bidderId === bidderId)
    );
    saveRejectedBidders(filtered);
  };

  const isBidderRejected = (listingId: string, bidderId: string): boolean => {
    return rejectedBidders.some(
      (r) => r.listingId === listingId && r.bidderId === bidderId
    );
  };

  const getRejectedBiddersForListing = (
    listingId: string
  ): RejectedBidder[] => {
    return rejectedBidders.filter((r) => r.listingId === listingId);
  };

  const calculateMinimumBid = (currentBid: number): number => {
    const increment = bidIncrements.find(
      (bi) => currentBid >= bi.rangeMin && currentBid < bi.rangeMax
    );
    if (!increment) {
      return currentBid + 50;
    }
    return currentBid + increment.increment;
  };

  const validateBid = (
    listingId: string,
    bidderId: string,
    bidAmount: number,
    currentBid: number
  ): { valid: boolean; message: string } => {
    if (isBidderRejected(listingId, bidderId)) {
      return {
        valid: false,
        message: "Your bids have been rejected by the seller for this item",
      };
    }

    const minimumBid = calculateMinimumBid(currentBid);
    if (bidAmount < minimumBid) {
      return {
        valid: false,
        message: `Bid must be at least ${minimumBid.toLocaleString()}₫`,
      };
    }

    return {
      valid: true,
      message: "Bid is valid",
    };
  };

  return (
    <BiddingRulesContext.Provider
      value={{
        rejectedBidders,
        bidIncrements,
        rejectBidder,
        unrejectBidder,
        isBidderRejected,
        getRejectedBiddersForListing,
        calculateMinimumBid,
        validateBid,
      }}
    >
      {children}
    </BiddingRulesContext.Provider>
  );
}

export function useBiddingRules() {
  const context = useContext(BiddingRulesContext);
  if (context === undefined) {
    throw new Error(
      "useBiddingRules must be used within a BiddingRulesProvider"
    );
  }
  return context;
}
