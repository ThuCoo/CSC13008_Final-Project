import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Gavel,
  Zap,
  Shield,
} from "lucide-react";
import { Listing } from "../context/ListingsContext";
import { formatAuctionTime, maskBidderName } from "../lib/utils";
import { Button } from "../components/ui/button";
import { LoadingSpinner } from "../components/LoadingSpinner";
import apiClient from "../lib/api-client";

const features = [
  {
    icon: Zap,
    title: "Real-Time Bidding",
    description: "Participate in live auctions with real-time bid updates",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Buyer protection and verified sellers for peace of mind",
  },
  {
    icon: TrendingUp,
    title: "Best Value",
    description: "Find items at incroseible prices below retail",
  },
];

// Component for a single listing card
const ListingCard = ({
  listing,
  user,
}: {
  listing: Listing;
  user: { role?: string; id?: string } | null;
}) => {
  const bidCount =
    typeof listing.bidCount === "number"
      ? listing.bidCount
      : listing.bids?.length || 0;
  const topBidder =
    listing.topBidderName ||
    (listing.bids && listing.bids.length > 0
      ? listing.bids[0].bidderName
      : null);
  const createdTime = new Date(listing.createdAt).getTime();
  const thirtyMinutesAgo = new Date().getTime() - 30 * 60 * 1000;
  const isNew = createdTime > thirtyMinutesAgo;
  const canSeeTopBidder =
    user?.role === "admin" ||
    (user?.role === "seller" && String(listing.sellerId) === String(user?.id));

  return (
    <Link
      to={`/auction/${listing.id}`}
      className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group ${
        isNew ? "ring-2 ring-rose-400" : ""
      }`}
    >
      <div className="h-48 relative bg-gray-200">
        <img
          src={
            listing.images && listing.images.length > 0
              ? listing.images[0]
              : "https://placehold.co/400x300?text=No+Image"
          }
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        {isNew && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <Zap className="w-3 h-3" /> NEW
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatAuctionTime(listing.endsAt)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold truncate mb-1 group-hover:text-rose-600">
          {listing.title}
        </h3>

        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs text-slate-500">Current Bid</p>
            <p className="text-xl font-bold text-primary">
              {listing.currentBid.toLocaleString()}₫
            </p>
            {listing.buyNowPrice && (
              <>
                <p className="text-xs text-gray-500 mt-1">Buy Now</p>
                <p className="text-sm font-semibold">
                  {listing.buyNowPrice.toLocaleString()}₫
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500">{bidCount} bids</p>
        </div>

        {topBidder && (
          <p className="text-xs text-gray-500 border-t pt-2">
            Top Bidder:{" "}
            {canSeeTopBidder ? topBidder : maskBidderName(topBidder)}
          </p>
        )}
      </div>
    </Link>
  );
};

export default function HomePage() {
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [closingSoon, setClosingSoon] = useState<Listing[]>([]);
  const [mostBids, setMostBids] = useState<Listing[]>([]);
  const [highestPrice, setHighestPrice] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const [cs, mb, hp] = await Promise.all([
          apiClient.get("/listings/top5-closing-soon"),
          apiClient.get("/listings/top5-most-bids"),
          apiClient.get("/listings/top5-highest-price"),
        ]);
        if (cancelled) return;
        setClosingSoon(Array.isArray(cs.data) ? cs.data : []);
        setMostBids(Array.isArray(mb.data) ? mb.data : []);
        setHighestPrice(Array.isArray(hp.data) ? hp.data : []);
      } catch {
        if (cancelled) return;
        setClosingSoon([]);
        setMostBids([]);
        setHighestPrice([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Discover Amazing Deals at{" "}
              <span className="text-primary">Live Auctions</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of bidders competing for unique items. From vintage
              collectibles to modern treasures, find what you love at the price
              you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base border-rose-700 hover:bg-rose-700 hover:text-white transition"
              >
                <Link to="/browse">Start Bidding</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base bg-rose-700 text-white hover:border-rose-700 hover:bg-white transition"
              >
                <Link to="/selling">Become a Seller</Link>
              </Button>
            </div>
          </div>
          <div className="bg-rose-500 rounded-2xl h-96 flex items-center justify-center">
            <Gavel className="w-24 h-24 opacity-50 text-white" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-rose-700">
            Why Choose eBid?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-8 rounded-xl border border-border hover:border-primary transition"
                >
                  <Icon className="w-10 h-10 mb-4 text-rose-500" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <h2 className="text-4xl font-bold text-center mb-16 text-rose-700">
          Starting Bidding Now!
        </h2>
        {isLoading ? (
          <LoadingSpinner text="Loading featured products..." size="lg" />
        ) : (
          <>
            {/* Closing Soon */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Closing Soon
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {closingSoon.map((l) => (
                  <ListingCard key={l.id} listing={l} user={user} />
                ))}
              </div>
            </section>

            {/* Most Bids */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Most Active Auctions
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {mostBids.map((l) => (
                  <ListingCard key={l.id} listing={l} user={user} />
                ))}
              </div>
            </section>

            {/* Highest Price */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Highest Priced Items
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {highestPrice.map((l) => (
                  <ListingCard key={l.id} listing={l} user={user} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
