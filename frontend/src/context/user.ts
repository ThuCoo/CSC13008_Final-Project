export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "bidder" | "seller" | "admin";
  type?: "bidder" | "seller" | "admin";
  sellerApproved?: boolean;
  createdAt?: number;
  address?: string;
  birthday?: string;
  positiveRatings?: number;
  totalRatings?: number;
}
