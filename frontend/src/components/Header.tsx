import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  Gavel,
  Search,
  LogOut,
  Heart,
  ShoppingBag,
  Menu,
  Shield,
  LayoutDashboard,
  SquareMousePointer,
} from "lucide-react";
import { Input } from "./ui/input";
import { useUser } from "../context/UserContext";
import { useToast } from "./ui/use-toast";
import { useState } from "react";

export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate("/browse");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    toast({ title: "Logged out" });
    navigate("/");
  };

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
            <span>eBid</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 mx-8 max-w-md">
            <div className="relative w-full">
              <Input
                placeholder="Search items..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Search
                 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 font-bold cursor-pointer hover:text-rose-600"
                 onClick={handleSearch}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
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
              to="/become-seller"
              className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
            >
              <ShoppingBag className="w-4 h-4" /> Sell
            </Link>

            {user && (
              <Link
                to="/watchlist"
                className="text-gray-600 hover:text-rose-700 font-medium text-sm flex items-center gap-1 hover:font-bold transition"
              >
                <Heart className="w-4 h-4" /> Watchlist
              </Link>
            )}

            {/* Account */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  <div className="w-6 h-6 bg-rose-600 rounded-full text-white flex items-center justify-center text-xs font-bold">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-rose-600 shadow-lg rounded-md py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-xs font-medium text-gray-500 uppercase">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/account-settings"
                      className="block px-4 py-2 text-sm hover:bg-rose-50 text-rose-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Account
                    </Link>

                    {/* Admin Dashboard */}
                    {user.type === "admin" && (
                      <Link
                        to="/admin-dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-rose-50 text-rose-700 font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    {/* Seller Dashboard */}
                    {user.type === "seller" && (
                      <Link
                        to="/seller-dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-rose-50 text-rose-700 font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Seller Dashboard
                      </Link>
                    )}

                    <div className="border-t mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    to="/categories"
                    className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                  >
                    <Menu className="w-5 h-5" /> All Categories
                  </Link>
                  <Link
                    to="/browse"
                    className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                  >
                    <SquareMousePointer className="w-5 h-5" /> Browse
                  </Link>
                  <Link
                    to="/become-seller"
                    className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                  >
                    <ShoppingBag className="w-5 h-5" /> Sell
                  </Link>
                  {user && (
                    <Link
                      to="/watchlist"
                      className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                    >
                      <Heart className="w-5 h-5" /> Watchlist
                    </Link>
                  )}
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-rose-600 rounded-full text-white flex items-center justify-center text-sm font-bold">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/account-settings"
                          className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                        >
                          My Account
                        </Link>
                        {user.type === "admin" && (
                          <Link
                            to="/admin-dashboard"
                            className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                          >
                            <Shield className="w-5 h-5" /> Admin Dashboard
                          </Link>
                        )}
                        {user.type === "seller" && (
                          <Link
                            to="/seller-dashboard"
                            className="text-gray-600 hover:text-rose-700 font-medium text-lg flex items-center gap-2 hover:font-bold transition"
                          >
                            <LayoutDashboard className="w-5 h-5" /> Seller Dashboard
                          </Link>
                        )}
                        <Button
                          variant="destructive"
                          className="w-full bg-rose-700"
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          className="w-full text-rose-700 border border-rose-700"
                        >
                          <Link to="/login">Login</Link>
                        </Button>
                        <Button asChild className="w-full bg-rose-700 text-white">
                          <Link to="/signup">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
