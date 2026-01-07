/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
  autoExtendEnabled?: boolean;
  allowUnratedBidders?: boolean;
  rejectedBidders?: string[];
  questions: Question[];

  // optimise
  bidCount?: number;
  topBidderName?: string;
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
  fetchListingById: (id: string) => Promise<Listing | undefined>;
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
    maxPrice?: number
  ) => void;
  rejectBidder: (listingId: string, bidderId: string) => void;
  getListingById: (id: string) => Listing | undefined;
  getSellerListings: (sellerId: string) => Listing[];
  extendAuctionIfNoBids: () => boolean;
  getListingsByCategory: (category: string) => Listing[];
  getTop5ClosingSoon: () => Listing[];
  getTop5MostBids: () => Listing[];
  getTop5HighestPrice: () => Listing[];
  addQuestion: (listingId: string, question: string, userId: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  getSellerOrders: (sellerId: string) => Promise<
    Array<{
      id: string;
      status: string;
      [key: string]: unknown;
    }>
  >;
  getBidderOrders: () => Promise<
    Array<{
      id: string;
      status: string;
      [key: string]: unknown;
    }>
  >;
  updateOrderStatus: (
    orderId: string,
    status: string,
    proof?: string,
    shippingAddress?: string
  ) => Promise<{
    id: string;
    status: string;
    [key: string]: unknown;
  }>;

  getOrderMessages: (orderId: string) => Promise<
    Array<{
      id: number;
      orderId: number;
      senderId: number;
      senderName: string;
      message: string;
      createdAt: string;
    }>
  >;

  sendOrderMessage: (
    orderId: string,
    message: string
  ) => Promise<{
    id: number;
    orderId: number;
    senderId: number;
    message: string;
    createdAt: string;
  }>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined
);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const loadListings = useCallback(async () => {
    // Simple cache: don't refetch if data was fetched less than 2 minutes ago
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000;
    if (listings.length > 0 && now - lastFetch < CACHE_DURATION) {
      console.log("Using cached listings data");
      return;
    }

    setIsLoading(true);
    try {
      // Preload
      const { data } = await apiClient.get(
        "/listings?limit=90&page=1&mode=summary"
      );
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
    } catch (error) {
      console.error("Failed to load listings", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: unknown };
          message?: string;
        };
        console.error(
          "Error details:",
          axiosError.response?.data || axiosError.message
        );
      }
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [listings.length, lastFetch]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const fetchListingById = useCallback(async (id: string) => {
    if (!id) return undefined;
    try {
      const { data } = await apiClient.get(`/listings/${Number(id)}`);
      if (!data) return undefined;
      setListings((prev) => {
        const existingIdx = prev.findIndex((l) => l.id === String(id));
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = data;
          return next;
        }
        return [data, ...prev];
      });
      return data as Listing;
    } catch (error) {
      console.error("Failed to fetch listing by id", error);
      return undefined;
    }
  }, []);

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
      await apiClient.put(`/listings/${Number(id)}`, data);
      setListings((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...data } as Listing) : l))
      );
    } catch (error) {
      console.error("Failed to update listing", error);
    }
  };

  const deleteListing = async (id: string) => {
    try {
      await apiClient.delete(`/listings/${Number(id)}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
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
    maxPrice?: number
  ) => {
    try {
      const { data } = await apiClient.post("/bids", {
        listingId: Number(listingId),
        bidderId: Number(bidderId),
        amount,
        maxPrice,
      });
      if (data.listing) {
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? data.listing : l))
        );
      }
    } catch (error) {
      console.error("Failed to place bid", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to place bid";
      throw new Error(message || "Failed to place bid");
    }
  };

  const rejectBidder = async (listingId: string, bidderId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    const currentRejected = listing.rejectedBidders || [];
    if (!currentRejected.includes(bidderId)) {
      await updateListing(listingId, {
        rejectedBidders: [...currentRejected, bidderId],
      });
    }
  };

  const getListingById = (id: string) => listings.find((l) => l.id === id);
  const getSellerListings = (id: string) =>
    listings.filter((l) => l.sellerId === id);
  const extendAuctionIfNoBids = () => false;
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
      .sort(
        (a, b) =>
          (typeof b.bidCount === "number" ? b.bidCount : b.bids?.length || 0) -
          (typeof a.bidCount === "number" ? a.bidCount : a.bids?.length || 0)
      )
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
    userId: string
  ) => {
    try {
      await apiClient.post("/questions", {
        listingId: Number(listingId),
        userId: Number(userId),
        questionText,
      });
      await loadListings();
    } catch (e) {
      console.error(e);
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    try {
      await apiClient.post(`/questions/${Number(questionId)}/answer`, {
        answer,
      });
      await loadListings();
    } catch (e) {
      console.error(e);
    }
  };

  const getSellerOrders = async (sellerId: string) => {
    try {
      const { data } = await apiClient.get(
        `/orders/seller?sellerId=${Number(sellerId)}`
      );
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const getBidderOrders = async () => {
    try {
      const { data } = await apiClient.get(`/orders/bidder`);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: string,
    proof?: string,
    shippingAddress?: string
  ) => {
    try {
      const { data } = await apiClient.put(
        `/orders/${Number(orderId)}/status`,
        {
          status,
          proof,
          shippingAddress,
        }
      );
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const getOrderMessages = async (orderId: string) => {
    try {
      const { data } = await apiClient.get(
        `/orders/${Number(orderId)}/messages`
      );
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const sendOrderMessage = async (orderId: string, message: string) => {
    const { data } = await apiClient.post(
      `/orders/${Number(orderId)}/messages`,
      {
        message,
      }
    );
    return data;
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        isLoading,
        fetchListingById,
        createListing,
        updateListing,
        deleteListing,
        endListing,
        placeBid,
        rejectBidder,
        getListingById,
        getSellerListings,
        extendAuctionIfNoBids,
        getListingsByCategory,
        getTop5ClosingSoon,
        getTop5MostBids,
        getTop5HighestPrice,
        addQuestion,
        answerQuestion,
        getSellerOrders,
        getBidderOrders,
        updateOrderStatus,
        getOrderMessages,
        sendOrderMessage,
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
