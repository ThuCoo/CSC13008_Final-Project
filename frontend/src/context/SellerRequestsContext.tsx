/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import apiClient from "../lib/api-client";

export interface SellerRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
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
  loadRequests: () => Promise<void>;
  createSellerRequest: (
    data: Omit<
      SellerRequest,
      "id" | "status" | "createdAt" | "userName" | "userEmail"
    >
  ) => Promise<SellerRequest>;
  approveRequest: (requestId: string, adminId: string) => Promise<void>;
  rejectRequest: (
    requestId: string,
    adminId: string,
    reason: string
  ) => Promise<void>;
  getPendingRequests: () => SellerRequest[];
  getRequestByUserId: (userId: string) => SellerRequest | undefined;
}

const SellerRequestsContext = createContext<
  SellerRequestsContextType | undefined
>(undefined);

export function SellerRequestsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requests, setRequests] = useState<SellerRequest[]>([]);

  // useEffect(() => {
  //    loadRequests();
  // }, []);

  const loadRequests = async () => {
    try {
      const { data } = await apiClient.get("/seller-requests");
      if (data && Array.isArray(data)) {
        const mapped = data.map(
          (r: {
            requestId: number;
            userId: number;
            userName?: string;
            userEmail?: string;
            status: "pending" | "approved" | "rejected";
            businessName: string;
            businessDescription: string;
            createdAt: number;
            reviewedAt?: number;
            reviewedBy?: string;
            rejectionReason?: string;
          }) => ({
            ...r,
            id: String(r.requestId),
            userId: String(r.userId),
            userName: r.userName || r.userEmail?.split("@")[0] || "Unknown",
            userEmail: r.userEmail,
          })
        );
        setRequests(mapped);
      }
    } catch (error) {
      console.error("Failed to load seller requests", error);
    }
  };

  const createSellerRequest = async (
    data: Omit<
      SellerRequest,
      "id" | "status" | "createdAt" | "userName" | "userEmail"
    >
  ): Promise<SellerRequest> => {
    try {
      const { data: newReq } = await apiClient.post("/seller-requests", data);
      const mapped = {
        ...newReq,
        id: String(newReq.requestId),
        userId: String(newReq.userId),
      } as SellerRequest;
      setRequests((prev) => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error("Failed to create seller request", error);
      throw error;
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      await apiClient.put(`/seller-requests/${requestId}`, {
        status: "approved",
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r))
      );
    } catch (error) {
      console.error("Failed to approve request", error);
      throw error;
    }
  };

  const rejectRequest = async (
    requestId: string,
    _adminId: string,
    reason: string
  ) => {
    try {
      await apiClient.put(`/seller-requests/${requestId}`, {
        status: "rejected",
        rejectionReason: reason,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: "rejected", rejectionReason: reason }
            : r
        )
      );
    } catch (error) {
      console.error("Failed to reject request", error);
      throw error;
    }
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
        loadRequests,
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
    throw new Error(
      "useSellerRequests must be used within a SellerRequestsProvider"
    );
  }
  return context;
}
