import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Link } from "react-router-dom";
import { Clock, Zap, ChevronRight, ChevronLeft } from "lucide-react";
// import { useState } from "react";
import { Listing } from "../context/ListingsContext";
import { isNewProduct, formatAuctionTime, maskBidderName } from "../lib/utils";

// Mock catergory
export const CATEGORY_TREE = [
  { name: "Electronics", sub: ["Mobile Phones", "Laptops"] },
  { name: "Fashion", sub: ["Shoes", "Watches"] },
  { name: "Collectibles", sub: ["Coins", "Stamps"] },
];

interface BrowsePageProps {
  filteredListings: Listing[];
  initialCat: string;
  initialSub: string;
  page: number;
  totalPages: number;
  search: string;
  sort: string;
  onSearchChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onCategoryClick: (cat: string, sub?: string) => void;
  onPageChange: (page: number) => void;
}

export default function BrowsePage({
  filteredListings,
  initialCat,
  initialSub,
  page,
  totalPages,
  search,
  sort,
  onSearchChange,
  onSortChange,
  onCategoryClick,
  onPageChange,
}: BrowsePageProps) {

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4 text-blue-900 border-b pb-2">
                Categories
              </h3>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => onCategoryClick("All")}
                    className={`text-sm font-medium ${initialCat === "All" ? "text-blue-600 font-bold" : "text-gray-600"}`}
                  >
                    All Categories
                  </button>
                </li>
                {CATEGORY_TREE.map((cat) => (
                  <li key={cat.name}>
                    <button
                      onClick={() => onCategoryClick(cat.name)}
                      className={`text-sm font-medium block w-full text-left ${initialCat === cat.name && !initialSub ? "text-blue-600 font-bold" : "text-gray-700"}`}
                    >
                      {cat.name}
                    </button>
                    {/* Subcategories */}
                    <ul className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-2">
                      {cat.sub.map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() => onCategoryClick(cat.name, sub)}
                            className={`text-sm block w-full text-left ${initialSub === sub ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-900"}`}
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="max-w-[200px]"
                />
                <Select value={sort} onValueChange={onSortChange}>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredListings.map((l) => {
                const isNew = isNewProduct(l.createdAt);
                const topBidder =
                  l.bids.length > 0 ? l.bids[0].bidderName : null;

                return (
                  <Link
                    key={l.id}
                    to={`/auction/${l.id}`}
                    className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group ${isNew ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <div
                      className={`h-48 bg-gradient-to-br ${l.imageColor} relative`}
                    >
                      {isNew && (
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          <Zap className="w-3 h-3" /> NEW
                        </span>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {formatAuctionTime(l.endsAt)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold truncate mb-1 group-hover:text-blue-600">
                        {l.title}
                      </h3>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Current Bid</p>
                          <p className="text-xl font-bold text-slate-900">
                            ${l.currentBid.toLocaleString()}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-8">
                <Button
                  variant="outline"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {filteredListings.length === 0 && (
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
