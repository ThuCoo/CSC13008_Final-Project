import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useWatchlist } from "../context/WatchlistContext";
import { useListings } from "../context/ListingsContext";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Heart, Trash2, Search } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";

export default function Watchlist() {
  const { user } = useUser();
  const { getUserWatchlist, removeFromWatchlist } = useWatchlist();
  const { getListingById } = useListings();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl border shadow-sm max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="mb-6 text-muted-foreground">
            You need to log in to view your watchlist.
          </p>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  const watchlistItems = getUserWatchlist(user.id)
    .map((id) => getListingById(id))
    .filter(Boolean);

  const filteredItems = watchlistItems
    .filter(
      (item) =>
        item && item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => {
      if (!item) return false;
      return statusFilter === "all" || item.status === statusFilter;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Heart className="text-red-500 fill-current" /> My Watchlist
        </h1>

        <div className="mb-4 grid grid-cols-4 gap-2">
          <div className="relative col-span-4 md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search watchlist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white col-span-4 md:col-span-1">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map(
              (item) =>
                item && (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden shrink-0">
                        <img
                          src={
                            item.images && item.images.length > 0
                              ? item.images[0]
                              : "https://placehold.co/200?text=No+Image"
                          }
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/auction/${item.id}`}
                          className="font-bold hover:underline text-primary"
                        >
                          {item.title}
                        </Link>
                        <p className="text-sm text-slate-500">
                          Ends: {new Date(item.endsAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">Current Price</p>
                        <p className="text-lg font-bold text-rose-600">
                          {item.currentBid.toLocaleString()}₫
                        </p>
                        <div className="mt-2 flex justify-end">
                          <Badge variant="secondary" className="capitalize">
                            {item.status}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeFromWatchlist(item.id, user.id);
                          toast({ title: "Removed from watchlist" });
                        }}
                        aria-label="Remove from watchlist"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                )
            )
          ) : (
            <div className="text-center py-12">
              {searchTerm
                ? "No matching items found."
                : "Your watchlist is empty."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
