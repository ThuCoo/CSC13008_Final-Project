import { createContext } from "react";
import { User } from "./user";

export interface UserContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);
