import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Zap, TrendingUp, Users } from "lucide-react";

export const sellingSteps = [
  {
    icon: Upload,
    title: "Create Listing",
    description: "Add photos, description, and pricing for your item",
  },
  {
    icon: Users,
    title: "Attract Bidders",
    description: "Showcase your item to thousands of potential buyers",
  },
  {
    icon: Zap,
    title: "Get Bids",
    description: "Watch the bidding happen in real-time",
  },
  {
    icon: TrendingUp,
    title: "Maximize Value",
    description: "Our auction format typically gets you 20-30% more",
  },
];

interface SellingPageProps {
  user: any;
}

export default function SellingPage({ user }: SellingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Start Selling on <span className="text-primary">AuctionHub</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Reach millions of buyers and get the best prices for your items. Our auction format ensures competitive bidding that maximizes your value.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-base">
                <Link to={user ? "/create-listing" : "/login"}>
                  {user ? "Create Your First Listing" : "Sign Up as Seller"}
                </Link>
              </Button>
              {user && (
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link to="/seller-dashboard">My Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl h-96 flex items-center justify-center">
            <Upload className="w-24 h-24 text-white opacity-50" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">How Selling Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sellingSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold mb-4">
                    {idx + 1}
                  </div>
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                  {idx < sellingSteps.length - 1 && (
                    <div className="absolute top-6 -right-4 w-8 border-t-2 border-border hidden lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold mb-12">Why Sellers Choose AuctionHub</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Higher Prices", desc: "Auctions typically get 20-30% more than fixed pricing" },
            { title: "Wide Audience", desc: "Reach millions of active buyers globally" },
            { title: "Secure Platform", desc: "Built-in buyer protection and payment handling" },
          ].map((item, idx) => (
            <div key={idx} className="p-8 rounded-xl border border-border bg-white">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary to-secondary py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start Your First Auction Today</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of successful sellers earning more on AuctionHub
          </p>
          <Button asChild size="lg" className="text-base" variant="secondary">
            <Link to={user ? "/create-listing" : "/login"}>
               {user ? "Create Listing" : "Create Seller Account"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
