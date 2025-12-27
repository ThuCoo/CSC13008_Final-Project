import React, { createContext, useContext, useState } from "react";

export interface AutoBid {
  id: string;
  listingId: string;
  userId: string;
  maxBidAmount: number;
  currentBidAmount: number;
  isActive: boolean;
  createdAt: number;
  incrementAmount: number;
}

interface AutoBidsContextType {
  autoBids: AutoBid[];
  createAutoBid: (
    listingId: string,
    userId: string,
    maxBidAmount: number,
    incrementAmount: number
  ) => AutoBid;
  updateAutoBid: (id: string, data: Partial<AutoBid>) => void;
  deleteAutoBid: (id: string) => void;
  getAutoBidByListingAndUser: (
    listingId: string,
    userId: string
  ) => AutoBid | undefined;
  getUserAutoBids: (userId: string) => AutoBid[];
  getAutoBidsForListing: (listingId: string) => AutoBid[];
  placingAutoBids: (listingId: string, newBidAmount: number) => string | null;
}

const AutoBidsContext = createContext<AutoBidsContextType | undefined>(undefined);

const INITIAL_AUTO_BIDS: AutoBid[] = [];

export function AutoBidsProvider({ children }: { children: React.ReactNode }) {
  const [autoBids, setAutoBids] = useState<AutoBid[]>(() => {
    const stored = localStorage.getItem("auctionhub_auto_bids");
    if (!stored) return INITIAL_AUTO_BIDS;
    return JSON.parse(stored);
  });

  const saveAutoBids = (newAutoBids: AutoBid[]) => {
    setAutoBids(newAutoBids);
    localStorage.setItem("auctionhub_auto_bids", JSON.stringify(newAutoBids));
  };

  const createAutoBid = (
    listingId: string,
    userId: string,
    maxBidAmount: number,
    incrementAmount: number
  ): AutoBid => {
    const existingBid = getAutoBidByListingAndUser(listingId, userId);
    if (existingBid) {
      updateAutoBid(existingBid.id, {
        maxBidAmount,
        incrementAmount,
        isActive: true,
      });
      return { ...existingBid, maxBidAmount, incrementAmount, isActive: true };
    }

    const newAutoBid: AutoBid = {
      id: String(Date.now()),
      listingId,
      userId,
      maxBidAmount,
      currentBidAmount: 0,
      isActive: true,
      createdAt: Date.now(),
      incrementAmount,
    };

    saveAutoBids([...autoBids, newAutoBid]);
    return newAutoBid;
  };

  const updateAutoBid = (id: string, data: Partial<AutoBid>) => {
    const updated = autoBids.map((bid) =>
      bid.id === id ? { ...bid, ...data } : bid
    );
    saveAutoBids(updated);
  };

  const deleteAutoBid = (id: string) => {
    const filtered = autoBids.filter((bid) => bid.id !== id);
    saveAutoBids(filtered);
  };

  const getAutoBidByListingAndUser = (
    listingId: string,
    userId: string
  ): AutoBid | undefined => {
    return autoBids.find(
      (bid) => bid.listingId === listingId && bid.userId === userId
    );
  };

  const getUserAutoBids = (userId: string): AutoBid[] => {
    return autoBids.filter((bid) => bid.userId === userId && bid.isActive);
  };

  const getAutoBidsForListing = (listingId: string): AutoBid[] => {
    return autoBids.filter((bid) => bid.listingId === listingId && bid.isActive);
  };

  const placingAutoBids = (
    listingId: string,
    newBidAmount: number
  ): string | null => {
    const autoBidsForListing = getAutoBidsForListing(listingId);

    let highestAutoBidId: string | null = null;
    let highestBidderId: string | null = null;
    let highestMaxBid = 0;

    for (const autoBid of autoBidsForListing) {
      if (
        autoBid.isActive &&
        autoBid.maxBidAmount >= newBidAmount &&
        autoBid.maxBidAmount > highestMaxBid
      ) {
        highestMaxBid = autoBid.maxBidAmount;
        highestAutoBidId = autoBid.id;
        highestBidderId = autoBid.userId;
      }
    }

    if (highestAutoBidId && highestBidderId) {
      updateAutoBid(highestAutoBidId, {
        currentBidAmount: Math.min(
          newBidAmount,
          highestMaxBid
        ),
      });
      return highestBidderId;
    }

    return null;
  };

  return (
    <AutoBidsContext.Provider
      value={{
        autoBids,
        createAutoBid,
        updateAutoBid,
        deleteAutoBid,
        getAutoBidByListingAndUser,
        getUserAutoBids,
        getAutoBidsForListing,
        placingAutoBids,
      }}
    >
      {children}
    </AutoBidsContext.Provider>
  );
}

export function useAutoBids() {
  const context = useContext(AutoBidsContext);
  if (context === undefined) {
    throw new Error("useAutoBids must be used within an AutoBidsProvider");
  }
  return context;
}
