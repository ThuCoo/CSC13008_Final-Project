import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isNewProduct(createdAt: number): boolean {
  // Considered new if created within the last 3 days
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAt < threeDays;
}

export function formatAuctionTime(endsAt: number): string {
  const now = Date.now();
  const diff = endsAt - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function maskBidderName(name: string): string {
  if (name.length <= 2) return name;
  return name.slice(0, 1) + "***" + name.slice(-1);
}
