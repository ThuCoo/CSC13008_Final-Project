/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { User } from "./user";
import apiClient from "../lib/api-client";

export interface UserContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<boolean>;
  sendOtp: (data: {
    email: string;
    name: string;
    password?: string;
    address?: string;
    birthday?: string;
    recaptchaToken?: string;
  }) => Promise<void>;
  resendOtp: (email: string, purpose?: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (id: string, data: Partial<User>) => Promise<void>;
  changePassword: (
    id: string,
    current: string,
    newPass: string
  ) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  banUser: (id: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string) => Promise<void>;
  getUserReviews: (userId: string) => Promise<
    Array<{
      rating: number;
      comment: string;
      [key: string]: unknown;
    }>
  >;
  rateUser: (
    targetId: string,
    rating: number,
    comment: string,
    role: "bidder" | "seller"
  ) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get("/users/me");
      const userData = data.userId ? data : data.user;
      const mappedUser = {
        ...userData,
        id: String(userData.userId),
        userId: userData.userId,
      };
      setUser(mappedUser);
    } catch (error) {
      console.error("Failed to load user", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    passwordInput: string
  ): Promise<boolean> => {
    try {
      const { data } = await apiClient.post("/auth/login", {
        email,
        password: passwordInput,
      });
      localStorage.setItem("token", data.token);
      // Map userId to id for consistency
      const mappedUser = {
        ...data.user,
        id: String(data.user.userId),
        userId: data.user.userId,
      };
      setUser(mappedUser);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const sendOtp = async (data: {
    email: string;
    name: string;
    password?: string;
    address?: string;
    birthday?: string;
    recaptchaToken?: string;
  }) => {
    try {
      await apiClient.post("/auth/register", data);
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Registration failed";
      throw new Error(message || "Registration failed");
    }
  };

  const resendOtp = async (email: string, purpose: string = "verify") => {
    try {
      await apiClient.post("/auth/resend", { email, purpose });
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to resend code";
      throw new Error(message || "Failed to resend code");
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    try {
      await apiClient.post("/auth/verify", { email, code });
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Verification failed";
      throw new Error(message || "Verification failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("auctionhub_user");
  };

  const updateProfile = async (id: string, data: Partial<User>) => {
    if (!user || user.id !== id) return;
    try {
      await apiClient.put(`/users/${Number(id)}`, data);
      setUser({ ...user, ...data } as Omit<User, "password">);
    } catch (error) {
      console.error("Update profile failed", error);
    }
  };

  const getAllUsers = async () => {
    try {
      const { data } = await apiClient.get("/users");
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const banUser = async (id: string) => {
    try {
      await apiClient.put(`/users/${Number(id)}`, { status: "banned" });
    } catch (e) {
      console.error(e);
    }
  };

  const unbanUser = async (id: string) => {
    try {
      await apiClient.put(`/users/${Number(id)}`, { status: "active" });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/users/${Number(id)}`);
    } catch (e) {
      console.error(e);
    }
  };

  const resetUserPassword = async (id: string) => {
    try {
      await apiClient.post(`/users/${Number(id)}/reset-password`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const getUserReviews = async (userId: string) => {
    try {
      const { data } = await apiClient.get(`/ratings/${Number(userId)}`);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const rateUser = async (
    targetId: string,
    rating: number,
    comment: string,
    role: "bidder" | "seller"
  ) => {
    try {
      await apiClient.post("/ratings", {
        targetUserId: Number(targetId),
        rating,
        comment,
        role,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const changePassword = async (
    id: string,
    _current: string,
    newPass: string
  ) => {
    if (!user || user.id !== id) return;
    try {
      await apiClient.put(`/users/${id}`, { password: newPass });
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        sendOtp,
        resendOtp,
        verifyOtp,
        logout,
        updateProfile,
        changePassword,
        getAllUsers,
        banUser,
        unbanUser,
        deleteUser,
        resetUserPassword,
        getUserReviews,
        rateUser,
      }}
    >
      {!isLoading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
