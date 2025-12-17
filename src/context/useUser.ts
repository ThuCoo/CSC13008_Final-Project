import { useContext } from "react";
import { UserContext, UserContextType } from "./UserContext";

export function useUser() {
  const context = useContext<UserContextType | undefined>(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
