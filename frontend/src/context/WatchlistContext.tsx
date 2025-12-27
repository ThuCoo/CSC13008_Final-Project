import React, { createContext, useContext, useState } from "react";

export interface WatchlistItem {
  listingId: string;
  userId: string;
  addedAt: number;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (listingId: string, userId: string) => void;
  removeFromWatchlist: (listingId: string, userId: string) => void;
  isInWatchlist: (listingId: string, userId: string) => boolean;
  getUserWatchlist: (userId: string) => string[];
  clearUserWatchlist: (userId: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

const INITIAL_WATCHLIST: WatchlistItem[] = [];

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const stored = localStorage.getItem("auctionhub_watchlist");
    if (!stored) return INITIAL_WATCHLIST;
    return JSON.parse(stored);
  });

  const saveWatchlist = (newWatchlist: WatchlistItem[]) => {
    setWatchlist(newWatchlist);
    localStorage.setItem("auctionhub_watchlist", JSON.stringify(newWatchlist));
  };

  const addToWatchlist = (listingId: string, userId: string) => {
    if (!isInWatchlist(listingId, userId)) {
      const newItem: WatchlistItem = {
        listingId,
        userId,
        addedAt: Date.now(),
      };
      saveWatchlist([...watchlist, newItem]);
    }
  };

  const removeFromWatchlist = (listingId: string, userId: string) => {
    const filtered = watchlist.filter(
      (item) => !(item.listingId === listingId && item.userId === userId)
    );
    saveWatchlist(filtered);
  };

  const isInWatchlist = (listingId: string, userId: string) => {
    return watchlist.some(
      (item) => item.listingId === listingId && item.userId === userId
    );
  };

  const getUserWatchlist = (userId: string) => {
    return watchlist
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.addedAt - a.addedAt)
      .map((item) => item.listingId);
  };

  const clearUserWatchlist = (userId: string) => {
    const filtered = watchlist.filter((item) => item.userId !== userId);
    saveWatchlist(filtered);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        getUserWatchlist,
        clearUserWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
