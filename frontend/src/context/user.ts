export interface User {
  id: string;
  userId?: number;
  email: string;
  name: string;
  avatar?: string;
  role: "bidder" | "seller" | "admin";
  type?: "bidder" | "seller" | "admin";
  sellerApproved?: boolean;
  status?: string;
  createdAt?: number;
  address?: string;
  birthday?: string;
  positiveRatings?: number;
  totalRatings?: number;
}
