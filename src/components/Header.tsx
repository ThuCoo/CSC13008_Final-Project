import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Search,
  Heart,
  ShoppingBag,
  Menu,
  SquareMousePointer,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-rose-600"
          >
            <Gavel className="w-6 h-6" />
            <span>AuctionHub</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 mx-8 max-w-md">
            <div className="relative w-full">
              <Input placeholder="Search items..." className="pr-10" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 font-bold" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/categories"
              className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
            >
              <Menu className="w-4 h-4" /> All Categories
            </Link>

            <Link
              to="/browse"
              className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
            >
              <SquareMousePointer className="w-4 h-4" /> Browse
            </Link>

            <Link
              to="/selling"
              className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
            >
              <ShoppingBag className="w-4 h-4" /> Sell
            </Link>

            {
              <Link
                to="/watchlist"
                className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
              >
                <Heart className="w-4 h-4" /> Watchlist
              </Link>
            }

            {
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-rose-700 border border-rose-700"
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-rose-700 text-white">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            }
          </nav>
        </div>
      </div>
    </header>
  );
}
