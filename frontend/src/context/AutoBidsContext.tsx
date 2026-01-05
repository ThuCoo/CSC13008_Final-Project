/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/api-client";

export interface AutoBid {
  id: string;
  autoBidId?: number;
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
  ) => Promise<AutoBid>;
  updateAutoBid: (id: string, data: Partial<AutoBid>) => Promise<void>;
  deleteAutoBid: (id: string) => Promise<void>;
  getAutoBidByListingAndUser: (
    listingId: string,
    userId: string
  ) => AutoBid | undefined;
  getUserAutoBids: (userId: string) => AutoBid[];
  getAutoBidsForListing: (listingId: string) => AutoBid[];
  placingAutoBids: () => Promise<string | null>;
}

const AutoBidsContext = createContext<AutoBidsContextType | undefined>(
  undefined
);

export function AutoBidsProvider({ children }: { children: React.ReactNode }) {
  const [autoBids, setAutoBids] = useState<AutoBid[]>([]);

  const loadAutoBids = async () => {
    try {
      const { data } = await apiClient.get("/auto-bids");
      if (Array.isArray(data)) {
        const mapped = data.map(
          (b: {
            autoBidId: number;
            listingId: number;
            userId: number;
            createdAt: string;
            maxBidAmount: number;
            currentBidAmount: number;
            incrementAmount: number;
            isActive: boolean;
          }) => ({
            ...b,
            id: String(b.autoBidId),
            listingId: String(b.listingId),
            userId: String(b.userId),
            createdAt: new Date(b.createdAt).getTime(),
            maxBidAmount: Number(b.maxBidAmount),
            currentBidAmount: Number(b.currentBidAmount),
            incrementAmount: Number(b.incrementAmount),
          })
        );
        setAutoBids(mapped);
      }
    } catch (e) {
      console.error("Failed to load auto bids", e);
    }
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void loadAutoBids();
  }, []);

  const createAutoBid = async (
    listingId: string,
    userId: string,
    maxBidAmount: number,
    incrementAmount: number
  ): Promise<AutoBid> => {
    try {
      const { data } = await apiClient.post("/auto-bids", {
        listingId: Number(listingId),
        userId: Number(userId),
        maxBidAmount,
        incrementAmount,
      });
      const newBid: AutoBid = {
        ...data,
        id: String(data.autoBidId),
        listingId: String(data.listingId),
        userId: String(data.userId),
        createdAt: new Date(data.createdAt).getTime(),
        maxBidAmount: Number(data.maxBidAmount),
        currentBidAmount: Number(data.currentBidAmount),
        incrementAmount: Number(data.incrementAmount),
      };
      setAutoBids((prev) => [...prev, newBid]);
      return newBid;
    } catch (error) {
      console.error("Failed to create auto bid", error);
      throw error;
    }
  };

  const updateAutoBid = async (id: string, data: Partial<AutoBid>) => {
    try {
      await apiClient.put(`/auto-bids/${Number(id)}`, data);
      setAutoBids((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...data } : b))
      );
    } catch (error) {
      console.error("Failed to update auto bid", error);
      throw error;
    }
  };

  const deleteAutoBid = async (id: string) => {
    try {
      await apiClient.delete(`/auto-bids/${Number(id)}`);
      setAutoBids((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to delete auto bid", error);
      throw error;
    }
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
    return autoBids.filter(
      (bid) => bid.listingId === listingId && bid.isActive
    );
  };

  const placingAutoBids = async (): Promise<string | null> => {
    console.warn(
      "placingAutoBids called on frontend. This logic should be backend handled."
    );
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
