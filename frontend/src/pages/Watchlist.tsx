import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { Listing } from "@/context/ListingsContext";

interface WatchlistPageProps {
  user: any;
  watchlistItems: Listing[];
  onRemove: (itemId: string) => void;
}

export default function WatchlistPage({
  user,
  watchlistItems,
  onRemove,
}: WatchlistPageProps) {
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
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
                        ${item.currentBid}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
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
