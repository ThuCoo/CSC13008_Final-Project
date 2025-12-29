
import { useUser } from "../context/UserContext";
import { useWatchlist } from "../context/WatchlistContext";
import { useListings } from "../context/ListingsContext";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Heart, Trash2 } from "lucide-react";

export default function Watchlist() {
  const { user } = useUser();
  const { getUserWatchlist, removeFromWatchlist } = useWatchlist();
  const { getListingById } = useListings();

  if (!user) return null;

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
                    <div
                      className={`w-24 h-24 rounded-md bg-gradient-to-br ${item.imageColor}`}
                    />
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
                      onClick={() => removeFromWatchlist(item.id, user.id)}
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
