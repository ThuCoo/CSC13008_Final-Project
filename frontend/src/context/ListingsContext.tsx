import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/api-client";

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
  bidderRating?: number;
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
  categoryId: number;
  subcategoryId?: number;
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
  itemCondition?: string;
  shippingCost: number;
  returns: string;
  returnPolicy?: string;
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
  isLoading: boolean;
  createListing: (data: NewListingData) => Promise<Listing>;
  updateListing: (id: string, data: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  endListing: (id: string) => void;
  placeBid: (
    listingId: string,
    bidderId: string,
    bidderName: string,
    amount: number,
    bidderStats?: { positive: number; total: number },
    maxPrice?: number,
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
  getSellerOrders: (sellerId: string) => Promise<any[]>;
  updateOrderStatus: (orderId: string, status: string, proof?: string) => Promise<any>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined,
);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    // Simple cache: don't refetch if data was fetched less than 2 minutes ago
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000;
    if (listings.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      console.log("Using cached listings data");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/listings?limit=50&page=1"); 
      console.log("Listings API Response:", data);
      if (data && Array.isArray(data.data)) {
        console.log(`Loaded ${data.data.length} listings`);
        setListings(data.data);
        setLastFetch(now);
      } else if (data && Array.isArray(data)) {
        // Handle case where API returns array directly
        console.log(`Loaded ${data.length} listings (direct array)`);
        setListings(data);
        setLastFetch(now);
      } else {
        console.warn("Unexpected listings response format:", data);
        setListings([]);
      }
    } catch (error: any) {
      console.error("Failed to load listings", error);
      console.error("Error details:", error.response?.data || error.message);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createListing = async (data: NewListingData) => {
    try {
      const { data: newListing } = await apiClient.post("/listings", data);
      setListings((prev) => [newListing, ...prev]);
      return newListing;
    } catch (error) {
      console.error("Failed to create listing", error);
      throw error;
    }
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
     try {
       await apiClient.put(`/listings/${id}`, data);
       setListings(prev => prev.map(l => l.id === id ? { ...l, ...data } as Listing : l));
     } catch (error) {
       console.error("Failed to update listing", error);
     }
  };

  const deleteListing = async (id: string) => {
    try {
      await apiClient.delete(`/listings/${id}`);
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Failed to delete listing", error);
    }
  };

  const endListing = async (id: string) => {
     await updateListing(id, { status: "ended" });
  };

  const placeBid = async (
    listingId: string,
    bidderId: string,
    _bidderName: string,
    amount: number,
    _bidderStats?: { positive: number; total: number },
    maxPrice?: number,
  ) => {
    try {
      const { data } = await apiClient.post("/bids", {
        listingId,
        bidderId,
        amount,
        maxPrice
      });
      if (data.listing) {
          setListings(prev => prev.map(l => l.id === listingId ? data.listing : l));
      }
    } catch (error: any) {
      console.error("Failed to place bid", error);
      throw new Error(error.response?.data?.message || "Failed to place bid");
    }
  };

  const rejectBidder = async (listingId: string, bidderId: string) => {
     const listing = listings.find(l => l.id === listingId);
     if (!listing) return;
     const currentRejected = listing.rejectedBidders || [];
     if (!currentRejected.includes(bidderId)) {
         await updateListing(listingId, { rejectedBidders: [...currentRejected, bidderId] });
     }
  };

  const getListingById = (id: string) => listings.find((l) => l.id === id);
  const getSellerListings = (id: string) => listings.filter((l) => l.sellerId === id);
  const getActiveBiddingListings = (id: string) =>
          listings.filter((l) => l.bids?.some((b) => b.bidderId === id));
  const extendAuctionIfNoBids = (_id: string) => false; 
  const getListingsByCategory = (cat: string) =>
          listings.filter((l) => l.category === cat);
  
  const getTop5ClosingSoon = () => {
    return listings
      .filter((l) => l.status === "active" && l.endsAt > Date.now())
      .sort((a, b) => a.endsAt - b.endsAt)
      .slice(0, 5);
  };

  const getTop5MostBids = () => {
    return listings
      .filter((l) => l.status === "active")
      .sort((a, b) => (b.bids?.length||0) - (a.bids?.length||0))
      .slice(0, 5);
  };

  const getTop5HighestPrice = () => {
    return listings
      .filter((l) => l.status === "active")
      .sort((a, b) => b.currentBid - a.currentBid)
      .slice(0, 5);
  };

  const addQuestion = async (
    listingId: string,
    questionText: string,
    userId: string,
    _userName: string,
  ) => {
    try {
        await apiClient.post("/questions", { listingId, userId, questionText });
        loadListings(); 
    } catch(e) { console.error(e) }
  };

  const answerQuestion = async (
    _listingId: string,
    questionId: string,
    answer: string,
  ) => {
     try {
         await apiClient.put(`/questions/${questionId}`, { answerText: answer });
         loadListings();
     } catch(e) { console.error(e) }
  };

  const getSellerOrders = async (_sellerId: string) => {
    try {
        const { data } = await apiClient.get("/orders/seller");
        return data; 
    } catch(e) { console.error(e); return []; }
  };

  const updateOrderStatus = async (orderId: string, status: string, proof?: string) => {
      try {
          const { data } = await apiClient.put(`/orders/${orderId}/status`, { status, proof });
          return data;
      } catch(e) { console.error(e); throw e; }
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        isLoading,
        createListing: createListing as any,
        updateListing,
        deleteListing,
        endListing,
        placeBid,
        rejectBidder,
        getListingById,
        getSellerListings,
        getActiveBiddingListings,
        extendAuctionIfNoBids,
        getListingsByCategory,
        getTop5ClosingSoon,
        getTop5MostBids,
        getTop5HighestPrice,
        addQuestion,
        answerQuestion,
        getSellerOrders,
        updateOrderStatus,
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
