import { Link } from "react-router-dom";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Gavel,
  Zap,
  Shield,
} from "lucide-react";
import { Listing } from "@/context/ListingsContext";
import { formatAuctionTime, maskBidderName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

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
    description: "Find items at incredible prices below retail",
  },
];

interface HomePageProps {
  closingSoon: Listing[];
  mostBids: Listing[];
  highestPrice: Listing[];
}

// Component for a single listing card
const ListingCard = ({ listing }: { listing: Listing }) => {
  const topBidder = listing.bids.length > 0 ? listing.bids[0].bidderName : null;

  return (
    <Link
      to={`/auction/${listing.id}`}
      className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group"
    >
      <div className={`h-40 bg-gradient-to-br ${listing.imageColor} relative`}>
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatAuctionTime(listing.endsAt)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold truncate mb-1 group-hover:text-blue-600">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{listing.category}</p>

        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-lg font-bold text-blue-900">
              ${listing.currentBid.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Bids</p>
            <p className="font-medium">{listing.bids.length}</p>
          </div>
        </div>

        {topBidder && (
          <p className="text-xs text-gray-500 pt-2 border-t mt-2">
            Top Bidder:{" "}
            <span className="font-medium text-gray-700">
              {maskBidderName(topBidder)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
};

export default function HomePage({
  closingSoon,
  mostBids,
  highestPrice,
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

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
              <Button asChild size="lg" className="text-base">
                <Link to="/browse">Start Bidding</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/selling">Become a Seller</Link>
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl h-96 flex items-center justify-center">
            <Gavel className="w-24 h-24 text-white opacity-50" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose AuctionHub?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-8 rounded-xl border border-border hover:border-primary transition"
                >
                  <Icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <h2 className="text-4xl font-bold text-center mb-16">
          Starting Bidding Now!
        </h2>
        {/* Section 1: Closing Soon */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Closing Soon (Top 5)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {closingSoon.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>

        {/* Section 2: Most Bids */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Most Active Auctions (Top 5)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {mostBids.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>

        {/* Section 3: Highest Price */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Highest Priced Items (Top 5)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {highestPrice.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
