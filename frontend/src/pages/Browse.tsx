import { useState, useEffect } from "react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { Listing } from "../context/ListingsContext";
import { useUser } from "../context/UserContext";
import { isNewProduct, formatAuctionTime, maskBidderName } from "../lib/utils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCategories } from "../context/CategoriesContext";
import apiClient from "../lib/api-client";

export default function Browse() {
  const { categories, loadCategories } = useCategories();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const ITEMS_PER_PAGE = 9;

  const [serverListings, setServerListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const initialCat = searchParams.get("cat") || "All";
  const initialSub = searchParams.get("sub") || "";
  const initialSearch = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "ending_desc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSort(initialSort);
  }, [initialSort]);

  // Server-side paging/sorting
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(ITEMS_PER_PAGE));
        params.set("sort", initialSort);
        params.set("mode", "summary");

        if (initialSearch) {
          params.set("q", initialSearch);
          const { data } = await apiClient.get(`/listings/search?${params}`);
          if (cancelled) return;
          setServerListings(Array.isArray(data?.data) ? data.data : []);
          setTotalItems(Number(data?.totalItems || 0));
        } else {
          if (initialCat && initialCat !== "All") params.set("cat", initialCat);
          if (initialSub) params.set("sub", initialSub);
          const { data } = await apiClient.get(`/listings?${params}`);
          if (cancelled) return;
          setServerListings(Array.isArray(data?.data) ? data.data : []);
          setTotalItems(Number(data?.totalItems || 0));
        }
      } catch {
        if (cancelled) return;
        setServerListings([]);
        setTotalItems(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [initialCat, initialSub, initialSearch, initialSort, page]);

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedListings = serverListings;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("q", val);
    else newParams.delete("q");
    newParams.delete("cat");
    newParams.delete("sub");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", val);
    newParams.set("page", "1"); // Reset to first page when sorting changes
    setSearchParams(newParams);
  };

  const handleCategoryClick = (cat: string, sub?: string) => {
    const newParams = new URLSearchParams();
    newParams.set("cat", cat);
    if (sub) newParams.set("sub", sub);
    newParams.delete("q");
    newParams.set("page", "1");
    setSearchParams(newParams);
    setSearch("");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4 text-rose-900 border-b pb-2">
                Categories
              </h3>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => handleCategoryClick("All")}
                    className={`text-sm font-medium ${
                      initialCat === "All"
                        ? "text-rose-600 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`text-sm font-medium block w-full text-left ${
                        initialCat === cat.name && !initialSub
                          ? "text-rose-600 font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {cat.name}
                    </button>
                    {/* Subcategories */}
                    <ul className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-2">
                      {cat.subcategories?.map(
                        (sub: { id: string; name: string }) => {
                          const isSelected =
                            initialCat === cat.name && initialSub === sub.name;
                          return (
                            <li key={`${cat.id}-${sub.id}`}>
                              <button
                                onClick={() =>
                                  handleCategoryClick(cat.name, sub.name)
                                }
                                className={`text-sm block w-full text-left ${
                                  isSelected
                                    ? "text-rose-600 font-bold"
                                    : "text-gray-500 hover:text-gray-900"
                                }`}
                              >
                                {sub.name}
                              </button>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold">
                {initialCat === "All" ? "All Products" : initialCat}{" "}
                {initialSub && `> ${initialSub}`}
              </h1>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="max-w-50"
                />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ending_desc">
                      Time: Ending Soon
                    </SelectItem>
                    <SelectItem value="price_asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price_high">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading && (
              <div className="mb-6">
                <LoadingSpinner text="Loading products..." />
              </div>
            )}

            {/* Product Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedListings.map((l: Listing) => {
                const isNew = isNewProduct(l.createdAt);
                const bidCount =
                  typeof l.bidCount === "number"
                    ? l.bidCount
                    : l.bids?.length || 0;
                const topBidder =
                  l.topBidderName ||
                  (l.bids && l.bids.length > 0 ? l.bids[0].bidderName : null);
                const canSeeTopBidder =
                  user?.role === "admin" ||
                  (user?.role === "seller" &&
                    String(l.sellerId) === String(user?.id));

                return (
                  <Link
                    key={l.id}
                    to={`/auction/${l.id}`}
                    className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group ${
                      isNew ? "ring-2 ring-rose-400" : ""
                    }`}
                  >
                    <div className="h-48 relative bg-gray-200">
                      <img
                        src={
                          l.images && l.images.length > 0
                            ? l.images[0]
                            : "https://placehold.co/400x300?text=No+Image"
                        }
                        alt={l.title}
                        className="w-full h-full object-cover"
                      />
                      {isNew && (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Zap className="w-3 h-3" /> NEW
                        </span>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {formatAuctionTime(l.endsAt)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold truncate mb-1 group-hover:text-rose-600">
                        {l.title}
                      </h3>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Current Bid</p>
                          <p className="text-xl font-bold text-primary">
                            {l.currentBid.toLocaleString()}₫
                          </p>
                          {l.buyNowPrice && (
                            <>
                              <p className="text-xs text-gray-500 mt-1">
                                Buy Now
                              </p>
                              <p className="text-sm font-semibold">
                                {l.buyNowPrice.toLocaleString()}₫
                              </p>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {bidCount} bids
                        </p>
                      </div>
                      {topBidder && (
                        <p className="text-xs text-gray-500 border-t pt-2">
                          Top Bidder:{" "}
                          {canSeeTopBidder
                            ? topBidder
                            : maskBidderName(topBidder)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {!isLoading && paginatedListings.length === 0 && (
              <div className="text-center py-20 text-slate-500 bg-white rounded-lg border">
                No products found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
