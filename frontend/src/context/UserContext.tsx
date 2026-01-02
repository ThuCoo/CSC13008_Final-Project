import React, { createContext, useContext, useState } from "react";
import { User } from "./user";
import apiClient from "../lib/api-client";

export interface UserContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: { email: string; name: string; password?: string, address?: string, birthday?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (id: string, data: Partial<User>) => Promise<void>;
  changePassword: (id: string, current: string, newPass: string) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

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
      setUser(data.user);
    } catch (error) {
      console.error("Failed to load user", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, passwordInput: string): Promise<boolean> => {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password: passwordInput });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const signup = async (data: { email: string; name: string; password?: string, address?: string, birthday?: string }) => {
    try {
      await apiClient.post("/auth/register", data);
      alert("Registration successful! Please check your email for the verification code.");
    } catch (error) {
      console.error("Signup failed", error);
      alert("Registration failed");
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
        await apiClient.put(`/users/${id}`, data);
        setUser({ ...user, ...data } as Omit<User, "password">);
    } catch(error) {
        console.error("Update profile failed", error);
    }
  };

  const changePassword = async (id: string, current: string, newPass: string) => {
    console.log(`Password change request for ${id}`, current, newPass);
  };

  return (
    <UserContext.Provider
      value={{ user, login, signup, logout, updateProfile, changePassword }}
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
