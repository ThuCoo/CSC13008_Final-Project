import { useState, useEffect } from "react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Clock, Ban, MessageCircle, ArrowLeft, Heart, Star } from "lucide-react";
import { maskBidderName, formatAuctionTime } from "../lib/utils";
import AutoBidForm from "../components/AutoBidForm";
import { useListings } from "../context/ListingsContext";
import { useWatchlist } from "../context/WatchlistContext";
import { useUser } from "../context/UserContext";
import { useToast } from "../hooks/use-toast";
import NotFound from "./NotFound";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { listings, isLoading, getListingById, placeBid, getListingsByCategory, addQuestion, answerQuestion, rejectBidder } = useListings();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { user, getUserReviews } = useUser();

  const listing = getListingById(id || "");
  const [bidAmount, setBidAmount] = useState(listing ? (listing.currentBid + listing.stepPrice).toString() : "");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  
  // Image Gallery State
  const [selectedImage, setSelectedImage] = useState("");
  const [bidderToReject, setBidderToReject] = useState<string | null>(null);

  // Seller Rating State
  const [sellerRating, setSellerRating] = useState<number | null>(null);

  useEffect(() => {
      if (listing?.sellerId) {
          getUserReviews(listing.sellerId).then(reviews => {
              if (reviews.length > 0) {
                  const positive = reviews.filter((r: any) => r.rating === 1).length;
                  setSellerRating(Math.round((positive / reviews.length) * 100));
              } else {
                  setSellerRating(null); // No rating
              }
          });
      }
  }, [listing?.sellerId]);
  
  // Update state when listing changes
  if (listing && listing.images.length > 0 && (!selectedImage || !listing.images.includes(selectedImage))) {
      setSelectedImage(listing.images[0]);
  }
  // Reset when ID changes
  if (listing && selectedImage && !listing.images.includes(selectedImage)) {
      setSelectedImage(listing.images[0] || "");
  }

  // Reactive Bid Update: Update input when current bid changes
  const [lastBidId, setLastBidId] = useState(listing?.currentBid || 0);
  if (listing && listing.currentBid !== lastBidId) {
      setLastBidId(listing.currentBid);
      setBidAmount((listing.currentBid + listing.stepPrice).toString());
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner text="Loading auction details..." size="lg" />
      </div>
    );
  }

  if (!listing) return <NotFound />;

  const isSeller = user?.id === listing.sellerId;
  const relatedProducts = listing ? getListingsByCategory(listing.category).filter(l => l.id !== listing.id).slice(0, 5) : [];

  const handleToggleWatchlist = () => {
    if (!user) return navigate("/login");
    if (isInWatchlist(listing.id, user.id)) {
      removeFromWatchlist(listing.id, user.id);
      toast({ title: "Removed from watchlist" });
    } else {
      addToWatchlist(listing.id, user.id);
      toast({ title: "Added to watchlist" });
    }
  };

  const isInWatchlistState = user ? isInWatchlist(listing.id, user.id) : false;

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      placeBid(listing.id, user.id, user.name, Number(bidAmount));
      toast({ title: "Bid placed successfully!" });
      setBidAmount("");
    } catch (error: any) {
      toast({ title: "Failed to place bid", description: error.message, variant: "destructive" });
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    addQuestion(listing.id, user.id, user.name, questionText);
    setQuestionText("");
    toast({ title: "Question posted" });
  };

  const handleAnswerQuestion = (qId: string) => {
    answerQuestion(listing.id, qId, answerText);
    setAnswerText("");
    toast({ title: "Answer posted" });
  };

  const onNavigateBack = () => navigate(-1);

  const handleRejectBidder = (bidderId: string) => {
    setBidderToReject(bidderId);
  };

  const confirmRejectBidder = () => {
    if (bidderToReject) {
      rejectBidder(listing.id, bidderToReject);
      toast({ title: "Bidder rejected" });
      setBidderToReject(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4 pl-0 hover:bg-transparent hover:text-rose-600"
          onClick={onNavigateBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to listings
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Main Info */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex flex-col gap-4 mb-6">
                  {/* Main Image */}
                  <div className="h-96 rounded-xl bg-gray-200 overflow-hidden border">
                    <img
                       src={selectedImage || "https://placehold.co/800x600?text=No+Image"}
                       alt={listing.title}
                       className="w-full h-full object-contain bg-white"
                    />
                  </div>
                  {/* Sub Images */}
                  {listing.images && listing.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          {listing.images.map((img, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setSelectedImage(img)}
                                className={`w-20 h-20 rounded-md overflow-hidden border-2 shrink-0 transition ${selectedImage === img ? 'border-rose-600' : 'border-transparent'}`}
                              >
                                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{listing.title}</h1>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={handleToggleWatchlist}
                  title={isInWatchlistState ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Heart className={`w-5 h-5 ${isInWatchlistState ? "fill-current text-red-500" : "text-slate-400"}`} />
                </Button>
              </div>
              
              {/* Seller Info */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold">
                      {listing.sellerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                      <p className="font-medium text-sm">Seller: <span className="text-slate-900 font-bold">{listing.sellerName}</span></p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{sellerRating !== null ? `${sellerRating}% Positive Feedback` : "No ratings yet"}</span>
                      </div>
                  </div>
              </div>

              <p className="text-slate-500 flex gap-2 items-center mb-6">
                <Clock className="w-4 h-4" />{" "}
                {formatAuctionTime(listing.endsAt)}
              </p>
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: listing.description }}
              />
            </div>

            {/* Q&A Section */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold mb-4 flex gap-2 items-center">
                <MessageCircle className="w-5 h-5" /> Q&A History
              </h2>

              {!isSeller && (
                <form onSubmit={handleAskQuestion} className="flex gap-2 mb-6">
                  <Input
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ask the seller a question..."
                    required
                  />
                  <Button type="submit">Ask</Button>
                </form>
              )}

              <div className="space-y-4">
                {(listing.questions || []).map((q) => (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-sm mb-1">
                      {maskBidderName(q.userName)} asked:
                    </p>
                    <p className="text-slate-700 mb-2">{q.question}</p>

                    {q.answer ? (
                      <div className="ml-4 pl-4 border-l-2 border-rose-200">
                        <p className="font-semibold text-sm text-rose-700">
                          Seller answered:
                        </p>
                        <p className="text-slate-600">{q.answer}</p>
                      </div>
                    ) : isSeller ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          placeholder="Reply..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAnswerQuestion(q.id)}
                        >
                          Reply
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Waiting for answer...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <p className="text-sm text-slate-500">Current Bid</p>
              <p className="text-4xl font-bold text-rose-600 mb-4">
                {listing.currentBid.toLocaleString()}₫
              </p>

              {!isSeller && (
                <div className="space-y-6">
                  {/* Standard Bid */}
                  <form onSubmit={handlePlaceBid}>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="number"
                        placeholder={`Min ${(listing.currentBid + listing.stepPrice).toLocaleString()}₫`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" type="submit">
                      Place Direct Bid
                    </Button>
                  </form>

                  {/* Auto Bid System */}
                  <div className="border-t pt-6">
                    <p className="font-bold mb-2 text-sm">Auto-Bidding</p>
                    {user && (
                      <AutoBidForm
                        listingId={listing.id}
                        userId={user.id}
                        currentBid={listing.currentBid}
                        minBid={listing.currentBid + listing.stepPrice}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Bid History */}
              <div className="mt-8 border-t pt-4">
                <h3 className="font-bold mb-4">Bid History</h3>
                <div className="space-y-3">
                  {listing.bids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium">
                            {maskBidderName(bid.bidderName)}
                            </p>
                           {/*  Removed Bidder Rating for now to avoid complexity */}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {bid.amount.toLocaleString()}₫
                        </span>
                        {isSeller && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-50"
                            onClick={() => handleRejectBidder(bid.bidderId)}
                            title="Ban Bidder"
                          >
                            <Ban className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 mt-12">
            <h3 className="text-2xl font-bold mb-6">Related Products </h3>
            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {relatedProducts.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/auction/${rel.id}`}
                    className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition"
                  >
                    <div className="h-32 bg-gray-200 relative">
                       <img
                         src={rel.images && rel.images.length > 0 ? rel.images[0] : "https://placehold.co/400x300?text=No+Image"}
                         alt={rel.title}
                         className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold truncate text-sm">
                        {rel.title}
                      </h4>
                      <p className="text-rose-600 font-bold text-sm">
                        {rel.currentBid.toLocaleString()}₫
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No related products found.</p>
            )}
        </div>
        </div>
      </div>

      <AlertDialog open={!!bidderToReject} onOpenChange={(open) => !open && setBidderToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Bidder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove their bids and ban them from bidding on this item again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRejectBidder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Bidder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
