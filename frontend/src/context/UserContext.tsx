import React, { createContext, useContext, useState } from "react";
import { User } from "./user";

export interface UserContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => boolean;
  signup: (data: { email: string; name: string; password?: string, address?: string }) => void;
  logout: () => void;
  updateProfile: (id: string, data: Partial<User>) => void;
  changePassword: (id: string, current: string, newPass: string) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

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
  password: "password123", // Plain text for mock
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

export const MOCK_USERS = [MOCK_BUYER, MOCK_SELLER, MOCK_ADMIN];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(() => {
    if (typeof window !== "undefined") {
      const storedUserString = localStorage.getItem("auctionhub_user");
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        const mockMatch = MOCK_USERS.find(u => u.email === storedUser.email);
        if (mockMatch) {
             const updatedUser = {
                 ...storedUser,
                 type: mockMatch.type,
                 sellerApproved: mockMatch.sellerApproved
             };
             if (updatedUser.type !== storedUser.type || updatedUser.sellerApproved !== storedUser.sellerApproved) {
                 localStorage.setItem("auctionhub_user", JSON.stringify(updatedUser));
             }
             return updatedUser;
        }
        return storedUser;
      }
    }
    return null;
  });

  const login = (email: string, passwordInput: string): boolean => {
    const foundUser = MOCK_USERS.find((u) => u.email === email);

    if (!foundUser || foundUser.password !== passwordInput) {
       return false;
    }

    const { password, ...userToStore } = foundUser;
    
    setUser(userToStore);
    localStorage.setItem("auctionhub_user", JSON.stringify(userToStore));
    return true;
  };

  const signup = (data: { email: string; name: string; password?: string, address?: string }) => {
    const newUser: User = {
      id: String(Date.now()),
      email: data.email,
      name: data.name,
      avatar: data.name.slice(0, 2).toUpperCase(),
      type: "buyer",
      sellerApproved: false,
      createdAt: Date.now(),
      address: data.address
    };

    const { ...userToStore } = newUser;
    setUser(userToStore);
    localStorage.setItem("auctionhub_user", JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auctionhub_user");
  };

  const updateProfile = (id: string, data: Partial<User>) => {
    if (!user || user.id !== id) return;
    const updatedUser = { ...user, ...data } as Omit<User, "password">;
    setUser(updatedUser);
    localStorage.setItem("auctionhub_user", JSON.stringify(updatedUser));
  };

  const changePassword = (id: string, current: string, newPass: string) => {
    // Mock implementation
    console.log(`Password changed for user ${id} from ${current} to ${newPass}`);
  };

  return (
    <UserContext.Provider
      value={{ user, login, signup, logout, updateProfile, changePassword }}
    >
      {children}
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
