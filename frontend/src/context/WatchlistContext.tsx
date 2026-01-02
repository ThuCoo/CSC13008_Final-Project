import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/api-client";

export interface WatchlistItem {
  listingId: string;
  userId: string;
  addedAt: number;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (listingId: string, userId: string) => Promise<void>;
  removeFromWatchlist: (listingId: string, userId: string) => Promise<void>;
  isInWatchlist: (listingId: string, userId: string) => boolean;
  getUserWatchlist: (userId: string) => string[];
  clearUserWatchlist: (userId: string) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
      try {
          const { data } = await apiClient.get("/watchlists");
          if (Array.isArray(data)) {
              const mapped = data.map((item: any) => ({
                  listingId: String(item.listingId),
                  userId: String(item.userId),
                  addedAt: new Date(item.addedAt).getTime()
              }));
              setWatchlist(mapped);
          }
      } catch (e) {
          console.error("Failed to load watchlist", e);
      }
  };

  const addToWatchlist = async (listingId: string, userId: string) => {
    if (!isInWatchlist(listingId, userId)) {
        try {
            await apiClient.post("/watchlists", { listingId, userId });
            const newItem: WatchlistItem = {
                listingId,
                userId,
                addedAt: Date.now(),
            };
            setWatchlist(prev => [...prev, newItem]);
        } catch (e) {
            console.error("Failed to add to watchlist", e);
        }
    }
  };

  const removeFromWatchlist = async (listingId: string, userId: string) => {
      try {
          await apiClient.delete(`/watchlists/${userId}/${listingId}`);
          setWatchlist(prev => prev.filter(
            (item) => !(item.listingId === listingId && item.userId === userId)
          ));
      } catch (e) {
          console.error("Failed to remove from watchlist", e);
      }
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

  const clearUserWatchlist = async (userId: string) => {
      const userItems = watchlist.filter(item => item.userId === userId);
      for (const item of userItems) {
          await removeFromWatchlist(item.listingId, userId);
      }
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
