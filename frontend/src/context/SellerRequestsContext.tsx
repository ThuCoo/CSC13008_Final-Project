import React, { createContext, useContext, useState } from "react";

export interface SellerRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  businessName: string;
  businessDescription: string;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface SellerRequestsContextType {
  requests: SellerRequest[];
  createSellerRequest: (data: Omit<SellerRequest, "id" | "status" | "createdAt">) => SellerRequest;
  approveRequest: (requestId: string, adminId: string) => void;
  rejectRequest: (requestId: string, adminId: string, reason: string) => void;
  getPendingRequests: () => SellerRequest[];
  getRequestByUserId: (userId: string) => SellerRequest | undefined;
}

const SellerRequestsContext = createContext<SellerRequestsContextType | undefined>(undefined);

const INITIAL_REQUESTS: SellerRequest[] = [];

export function SellerRequestsProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<SellerRequest[]>(() => {
    const stored = localStorage.getItem("auctionhub_seller_requests");
    if (!stored) return INITIAL_REQUESTS;
    return JSON.parse(stored);
  });

  const saveRequests = (newRequests: SellerRequest[]) => {
    setRequests(newRequests);
    localStorage.setItem("auctionhub_seller_requests", JSON.stringify(newRequests));
  };

  const createSellerRequest = (
    data: Omit<SellerRequest, "id" | "status" | "createdAt">
  ): SellerRequest => {
    const existingRequest = requests.find(
      (r) => r.userId === data.userId && r.status === "pending"
    );

    if (existingRequest) {
      throw new Error("You already have a pending seller request");
    }

    const newRequest: SellerRequest = {
      ...data,
      id: String(Date.now()),
      status: "pending",
      createdAt: Date.now(),
    };

    saveRequests([...requests, newRequest]);
    return newRequest;
  };

  const approveRequest = (requestId: string, adminId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "approved" as const,
            reviewedAt: Date.now(),
            reviewedBy: adminId,
          }
        : r
    );

    saveRequests(updated);

    const storedUser = localStorage.getItem("auctionhub_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id === request.userId) {
        user.type = "seller";
        user.sellerApproved = true;
        localStorage.setItem("auctionhub_user", JSON.stringify(user));
      }
    }
  };

  const rejectRequest = (requestId: string, adminId: string, reason: string) => {
    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "rejected" as const,
            reviewedAt: Date.now(),
            reviewedBy: adminId,
            rejectionReason: reason,
          }
        : r
    );

    saveRequests(updated);
  };

  const getPendingRequests = () => {
    return requests.filter((r) => r.status === "pending");
  };

  const getRequestByUserId = (userId: string) => {
    return requests.find((r) => r.userId === userId);
  };

  return (
    <SellerRequestsContext.Provider
      value={{
        requests,
        createSellerRequest,
        approveRequest,
        rejectRequest,
        getPendingRequests,
        getRequestByUserId,
      }}
    >
      {children}
    </SellerRequestsContext.Provider>
  );
}

export function useSellerRequests() {
  const context = useContext(SellerRequestsContext);
  if (context === undefined) {
    throw new Error("useSellerRequests must be used within a SellerRequestsProvider");
  }
  return context;
}
