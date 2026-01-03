
import { useUser } from "../context/UserContext";
import { useWatchlist } from "../context/WatchlistContext";
import { useListings } from "../context/ListingsContext";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Watchlist() {
  const { user } = useUser();
  const { getUserWatchlist, removeFromWatchlist } = useWatchlist();
  const { getListingById } = useListings();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Heart className="text-red-500 fill-current" /> My Watchlist
        </h1>

        <div className="space-y-4">
          {watchlistItems.length > 0 ? (
            watchlistItems.map(
              (item) =>
                item && (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg border flex gap-4 items-center"
                  >
                    <div className="w-24 h-24 rounded-md bg-gray-200 overflow-hidden shrink-0">
                       <img 
                          src={item.images && item.images.length > 0 ? item.images[0] : "https://placehold.co/200?text=No+Image"} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/auction/${item.id}`}
                        className="font-bold text-lg hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-primary font-bold">
                        {item.currentBid.toLocaleString()}₫
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeFromWatchlist(item.id, user.id);
                        toast({ title: "Removed from watchlist" });
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ),
            )
          ) : (
            <div className="text-center py-12">Your watchlist is empty.</div>
          )}
        </div>
      </div>
    </div>
  );
}
