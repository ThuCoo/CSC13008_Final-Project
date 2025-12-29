import { useState, useMemo } from "react";

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
import { useListings, Listing } from "../context/ListingsContext";
import { isNewProduct, formatAuctionTime, maskBidderName } from "../lib/utils";

// Categories Structure for Sidebar
const CATEGORY_TREE = [
  { name: "Electronics", sub: ["Mobile Phones", "Laptops"] },
  { name: "Fashion", sub: ["Shoes", "Watches"] },
  { name: "Collectibles", sub: ["Coins", "Stamps"] },
];

export default function Browse() {
  const { listings, getListingsByCategory } = useListings();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get("cat") || "All";
  const initialSub = searchParams.get("sub") || "";
  const initialSearch = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "ending_soon";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  // Derive filtered listings
  const filteredListings = useMemo(() => {
    let result = initialCat && initialCat !== "All" ? getListingsByCategory(initialCat) : listings;

    if (initialSub) {
      result = result.filter(l => l.subCategory === initialSub);
    }

    if (search) {
      result = result.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort logic
    if (sort === "ending_soon") {
      result = [...result].sort((a, b) => a.endsAt - b.endsAt);
    } else if (sort === "price_low") {
      result = [...result].sort((a, b) => a.currentBid - b.currentBid);
    } else if (sort === "price_high") {
      result = [...result].sort((a, b) => b.currentBid - a.currentBid);
    }

    return result;
  }, [listings, getListingsByCategory, initialCat, initialSub, search, sort]);

  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set("q", val);
    else newParams.delete("q");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", val);
    setSearchParams(newParams);
  };

  const handleCategoryClick = (cat: string, sub?: string) => {
    const newParams = new URLSearchParams();
    newParams.set("cat", cat);
    if (sub) newParams.set("sub", sub);
    newParams.set("page", "1");
    setSearchParams(newParams);
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
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4 text-rose-900 border-b pb-2">
                Categories
              </h3>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => handleCategoryClick("All")}
                    className={`text-sm font-medium ${initialCat === "All" ? "text-rose-600 font-bold" : "text-gray-600"}`}
                  >
                    All Categories
                  </button>
                </li>
                {CATEGORY_TREE.map((cat) => (
                  <li key={cat.name}>
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`text-sm font-medium block w-full text-left ${initialCat === cat.name && !initialSub ? "text-rose-600 font-bold" : "text-gray-700"}`}
                    >
                      {cat.name}
                    </button>
                    {/* Subcategories */}
                    <ul className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-2">
                      {cat.sub.map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() => handleCategoryClick(cat.name, sub)}
                            className={`text-sm block w-full text-left ${initialSub === sub ? "text-rose-600 font-bold" : "text-gray-500 hover:text-gray-900"}`}
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
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
                  className="max-w-[200px]"
                />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
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

            {/* Product Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedListings.map((l: Listing) => {
                const isNew = isNewProduct(l.createdAt);
                const topBidder =
                  l.bids.length > 0 ? l.bids[0].bidderName : null;

                return (
                  <Link
                    key={l.id}
                    to={`/auction/${l.id}`}
                    className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group ${isNew ? "ring-2 ring-rose-400" : ""}`}
                  >
                    <div
                      className={`h-48 bg-gradient-to-br ${l.imageColor} relative`}
                    >
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
                          <p className="text-xl font-bold text-slate-900">
                            {l.currentBid.toLocaleString()}₫
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {l.bids.length} bids
                        </p>
                      </div>
                      {topBidder && (
                        <p className="text-xs text-gray-500 border-t pt-2">
                          Holder: {maskBidderName(topBidder)}
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

            {paginatedListings.length === 0 && (
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
