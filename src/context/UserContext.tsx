import React, { useState } from "react";
import { User } from "./user";
import { UserContext } from "./UserContext";

// Mock Data
const MOCK_BUYER: User & { password: string } = {
  id: "1",
  email: "buyer@example.com",
  name: "Account Buyer",
  avatar: "AB",
  type: "buyer",
  sellerApproved: false,
  address: "227 Nguyen Van Cu, Cho Quan Ward, HCM City",
  birthday: "1995-08-15",
  password: "password123",
};

const MOCK_SELLER: User & { password: string } = {
  id: "2",
  email: "seller@example.com",
  name: "Account Seller",
  avatar: "AS",
  type: "seller",
  sellerApproved: true,
  address: "227 Nguyen Van Cu, Cho Quan Ward, HCM City",
  birthday: "1995-08-15",
  password: "password123",
};

const MOCK_ADMIN: User & { password: string } = {
  id: "3",
  email: "admin@example.com",
  name: "Account Admin",
  avatar: "AA",
  type: "admin",
  sellerApproved: true,
  address: "227 Nguyen Van Cu, Cho Quan Ward, HCM City",
  birthday: "1995-08-15",
  password: "password123",
};

const MOCK_USERS = [MOCK_BUYER, MOCK_SELLER, MOCK_ADMIN];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("auctionhub_user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    }
    return null;
  });

  const login = async (email: string, passwordInput: string) => {
    const foundUser = MOCK_USERS.find((u) => u.email === email);

    if (!foundUser || foundUser.password !== passwordInput) {
      throw new Error("Invalid credentials");
    }

    const { password, ...userToStore } = foundUser;
    void password;

    setUser(userToStore);
    localStorage.setItem("auctionhub_user", JSON.stringify(userToStore));
  };

  const signup = async (email: string, name: string) => {
    const newUser: User = {
      id: String(Date.now()),
      email,
      name,
      avatar: name.slice(0, 2).toUpperCase(),
      type: "buyer",
      sellerApproved: false,
      createdAt: Date.now(),
    };

    const { ...userToStore } = newUser;
    setUser(userToStore);
    localStorage.setItem("auctionhub_user", JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auctionhub_user");
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data } as Omit<User, "password">;
    setUser(updatedUser);
    localStorage.setItem("auctionhub_user", JSON.stringify(updatedUser));
  };

  return (
    <UserContext.Provider
      value={{ user, login, signup, logout, updateProfile }}
    >
      {children}
    </UserContext.Provider>
  );
}
