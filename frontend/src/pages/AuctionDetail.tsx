import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  Clock,
  Ban,
  MessageCircle,
  ArrowLeft,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isLoading,
    fetchListingById,
    getListingById,
    placeBid,
    getListingsByCategory,
    addQuestion,
    answerQuestion,
    rejectBidder,
  } = useListings();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { user, getUserReviews } = useUser();

  const listing = getListingById(id || "");
  const safeDescriptionHtml = useMemo(() => {
    return DOMPurify.sanitize(listing?.description || "");
  }, [listing?.description]);
  const [detailLoading, setDetailLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState(
    listing ? (listing.currentBid + listing.stepPrice).toString() : ""
  );
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  const [selectedImage, setSelectedImage] = useState("");
  const [bidderToReject, setBidderToReject] = useState<string | null>(null);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);

  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [sellerReviews, setSellerReviews] = useState<
    Array<{
      rating: number;
      comment: string;
      reviewerId?: number;
      role?: string;
      createdAt?: string;
      [key: string]: unknown;
    }>
  >([]);
  const [bidderReviews, setBidderReviews] = useState<
    Record<
      string,
      Array<{
        rating: number;
        comment: string;
        reviewerId?: number;
        role?: string;
        createdAt?: string;
        [key: string]: unknown;
      }>
    >
  >({});

  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    void fetchListingById(id).finally(() => setDetailLoading(false));
  }, [id, fetchListingById]);

  useEffect(() => {
    if (listing?.sellerId) {
      void getUserReviews(listing.sellerId).then((reviews) => {
        setSellerReviews(reviews);
        if (reviews.length > 0) {
          const positive = reviews.filter(
            (r: { rating: number }) => r.rating === 1
          ).length;
          setSellerRating(Math.round((positive / reviews.length) * 100));
        } else {
          setSellerRating(null);
        }
      });
    }
  }, [listing?.sellerId, getUserReviews]);

  if (
    listing &&
    listing.images.length > 0 &&
    (!selectedImage || !listing.images.includes(selectedImage))
  ) {
    setSelectedImage(listing.images[0]);
  }
  if (listing && selectedImage && !listing.images.includes(selectedImage)) {
    setSelectedImage(listing.images[0] || "");
  }

  const [lastBidId, setLastBidId] = useState(listing?.currentBid || 0);
  if (listing && listing.currentBid !== lastBidId) {
    setLastBidId(listing.currentBid);
    setBidAmount((listing.currentBid + listing.stepPrice).toString());
  }

  if (isLoading || detailLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner text="Loading auction details..." size="lg" />
      </div>
    );
  }

  if (!listing) return <NotFound />;

  const isSeller = user?.id === listing.sellerId;
  const relatedProducts = listing
    ? getListingsByCategory(listing.category)
        .filter((l) => l.id !== listing.id)
        .slice(0, 5)
    : [];

  const handleToggleWatchlist = () => {
    if (!user) return navigate("/login");
    const userId = user.userId ? String(user.userId) : user.id;
    if (isInWatchlist(listing.id, userId)) {
      removeFromWatchlist(listing.id, userId);
      toast({ title: "Removed from watchlist" });
    } else {
      addToWatchlist(listing.id, userId);
      toast({ title: "Added to watchlist" });
    }
  };

  const isInWatchlistState = user
    ? isInWatchlist(listing.id, user.userId ? String(user.userId) : user.id)
    : false;

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    const amount = Number(bidAmount);
    if (amount < listing.currentBid + listing.stepPrice) {
      toast({
        title: "Invalid bid amount",
        description: `Minimum bid is ${(
          listing.currentBid + listing.stepPrice
        ).toLocaleString()}₫`,
        variant: "destructive",
      });
      return;
    }
    setPendingBidAmount(amount);
  };

  const confirmPlaceBid = async () => {
    if (!user || !pendingBidAmount) return;
    try {
      const userId = user.userId ? String(user.userId) : user.id;
      await placeBid(listing.id, userId, user.name, pendingBidAmount);
      toast({ title: "Bid placed successfully!" });
      setBidAmount("");
      setPendingBidAmount(null);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to place bid";
      toast({
        title: "Failed to place bid",
        description: message,
        variant: "destructive",
      });
      setPendingBidAmount(null);
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    const userId = user.userId ? String(user.userId) : user.id;
    addQuestion(listing.id, questionText, userId);
    setQuestionText("");
    toast({ title: "Question posted" });
  };

  const handleAnswerQuestion = (qId: string) => {
    answerQuestion(qId, answerText);
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

  const handleViewBidderRating = async (bidderId: string) => {
    if (!bidderReviews[bidderId]) {
      const reviews = await getUserReviews(bidderId);
      setBidderReviews((prev) => ({ ...prev, [bidderId]: reviews }));
    }
  };

  const isHighBidder =
    user &&
    listing.bids.length > 0 &&
    listing.bids[0].bidderId === (user.userId ? String(user.userId) : user.id);

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
                    src={
                      selectedImage ||
                      "https://placehold.co/800x600?text=No+Image"
                    }
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
                        className={`w-20 h-20 rounded-md overflow-hidden border-2 shrink-0 transition ${
                          selectedImage === img
                            ? "border-rose-600"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{listing.title}</h1>
                {user?.role !== "admin" && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full shrink-0"
                    onClick={handleToggleWatchlist}
                    title={
                      isInWatchlistState
                        ? "Remove from watchlist"
                        : "Add to watchlist"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isInWatchlistState
                          ? "fill-current text-red-500"
                          : "text-slate-400"
                      }`}
                    />
                  </Button>
                )}
              </div>

              {/* Seller Info */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-bold">
                      {listing.sellerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Seller:{" "}
                        <span className="text-slate-900 font-bold hover:text-rose-600 transition">
                          {listing.sellerName}
                        </span>
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>
                          {sellerRating !== null
                            ? `${sellerRating}% Positive Feedback`
                            : "No ratings yet"}
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Seller: {listing.sellerName}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {/* Rating Summary */}
                    {sellerReviews.length > 0 && (
                      <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                        <h3 className="font-bold text-lg mb-2">
                          Rating Summary
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-rose-600">
                            {sellerRating}%
                          </div>
                          <div className="text-sm text-slate-600">
                            <p>
                              <span className="font-semibold">
                                {
                                  sellerReviews.filter((r) => r.rating === 1)
                                    .length
                                }
                              </span>{" "}
                              positive
                            </p>
                            <p>
                              <span className="font-semibold">
                                {
                                  sellerReviews.filter((r) => r.rating === -1)
                                    .length
                                }
                              </span>{" "}
                              negative
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Total: {sellerReviews.length} reviews
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-md mb-3">Reviews:</h3>
                      {sellerReviews.length === 0 ? (
                        <p className="text-slate-500 text-sm">
                          No reviews yet.
                        </p>
                      ) : (
                        sellerReviews.map((rev, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-3 bg-white"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-bold text-sm">
                                  User #{rev.reviewerId}{" "}
                                  <span className="text-xs font-normal text-slate-500">
                                    ({rev.role})
                                  </span>
                                </p>
                                <p className="text-xs text-slate-400">
                                  {rev.createdAt
                                    ? new Date(
                                        rev.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                              {rev.rating === 1 ? (
                                <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                                  <ThumbsUp className="w-3 h-3 mr-1" /> Positive
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">
                                  <ThumbsDown className="w-3 h-3 mr-1" />{" "}
                                  Negative
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 text-sm">
                              "{rev.comment}"
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="text-slate-500 flex gap-2 items-center mb-6">
                <Clock className="w-4 h-4" />{" "}
                {formatAuctionTime(listing.endsAt)}
              </div>
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
              />
            </div>

            {/* Q&A Section */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-xl font-bold mb-4 flex gap-2 items-center">
                <MessageCircle className="w-5 h-5" /> Q&A History
              </h2>

              {!isSeller && user?.role !== "admin" && (
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
                      {isSeller || user?.role === "admin"
                        ? q.userName
                        : maskBidderName(q.userName)}{" "}
                      asked:
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

              {!isSeller && user?.role !== "admin" && (
                <div className="space-y-6">
                  {isHighBidder ? (
                    <div className="bg-primary border rounded-3xl p-4 text-center">
                      <p className="text-sm text-white">
                        You are currently the highest bidder on this item.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Standard Bid */}
                      <form onSubmit={handlePlaceBid}>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="number"
                            placeholder={`Min ${(
                              listing.currentBid + listing.stepPrice
                            ).toLocaleString()}₫`}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            step={1000}
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
                            userId={user.userId ? String(user.userId) : user.id}
                            minBid={listing.currentBid + listing.stepPrice}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Bid History */}
              <div className="mt-8 border-t pt-4">
                <h3 className="font-bold mb-4">Bid History</h3>
                <div className="space-y-3">
                  {listing.bids.map((bid) => {
                    const currentUserId = user?.userId
                      ? String(user.userId)
                      : user?.id;
                    const isOwnBid = currentUserId === bid.bidderId;

                    return (
                      <div
                        key={bid.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {isSeller || user?.role === "admin" ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    onClick={() =>
                                      handleViewBidderRating(bid.bidderId)
                                    }
                                    className="font-medium hover:text-primary hover:font-bold cursor-pointer"
                                  >
                                    {isOwnBid ? user?.name : bid.bidderName}
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Bidder: {bid.bidderName}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    {bidderReviews[bid.bidderId] && (
                                      <>
                                        {bidderReviews[bid.bidderId].length >
                                          0 && (
                                          <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                                            <h3 className="font-bold text-lg mb-2">
                                              Rating Summary
                                            </h3>
                                            <div className="flex items-center gap-4">
                                              <div className="text-4xl font-bold text-rose-600">
                                                {Math.round(
                                                  (bidderReviews[
                                                    bid.bidderId
                                                  ].filter(
                                                    (r) => r.rating === 1
                                                  ).length /
                                                    bidderReviews[bid.bidderId]
                                                      .length) *
                                                    100
                                                )}
                                                %
                                              </div>
                                              <div className="text-sm text-slate-600">
                                                <p>
                                                  <span className="font-semibold">
                                                    {
                                                      bidderReviews[
                                                        bid.bidderId
                                                      ].filter(
                                                        (r) => r.rating === 1
                                                      ).length
                                                    }
                                                  </span>{" "}
                                                  positive
                                                </p>
                                                <p>
                                                  <span className="font-semibold">
                                                    {
                                                      bidderReviews[
                                                        bid.bidderId
                                                      ].filter(
                                                        (r) => r.rating === -1
                                                      ).length
                                                    }
                                                  </span>{" "}
                                                  negative
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                  Total:{" "}
                                                  {
                                                    bidderReviews[bid.bidderId]
                                                      .length
                                                  }{" "}
                                                  reviews
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <div className="space-y-3">
                                          <h3 className="font-bold text-md mb-3">
                                            Reviews:
                                          </h3>
                                          {bidderReviews[bid.bidderId]
                                            .length === 0 ? (
                                            <p className="text-slate-500 text-sm">
                                              No reviews yet.
                                            </p>
                                          ) : (
                                            bidderReviews[bid.bidderId].map(
                                              (rev, i) => (
                                                <div
                                                  key={i}
                                                  className="border rounded-lg p-3 bg-white"
                                                >
                                                  <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                      <p className="font-bold text-sm">
                                                        User #{rev.reviewerId}{" "}
                                                        <span className="text-xs font-normal text-slate-500">
                                                          ({rev.role})
                                                        </span>
                                                      </p>
                                                      <p className="text-xs text-slate-400">
                                                        {rev.createdAt
                                                          ? new Date(
                                                              rev.createdAt
                                                            ).toLocaleDateString()
                                                          : "N/A"}
                                                      </p>
                                                    </div>
                                                    {rev.rating === 1 ? (
                                                      <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                                                        <ThumbsUp className="w-3 h-3 mr-1" />{" "}
                                                        Positive
                                                      </span>
                                                    ) : (
                                                      <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">
                                                        <ThumbsDown className="w-3 h-3 mr-1" />{" "}
                                                        Negative
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-slate-700 text-sm">
                                                    "{rev.comment}"
                                                  </p>
                                                </div>
                                              )
                                            )
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <p
                                className={`font-medium ${
                                  isOwnBid ? "text-primary" : ""
                                }`}
                              >
                                {isOwnBid ? user?.name : bid.bidderName}
                              </p>
                            )}
                            {bid.bidderRating !== undefined && (
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-slate-600">
                                  {bid.bidderRating}%
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(bid.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {bid.amount.toLocaleString()}₫
                          </span>
                          {(isSeller || user?.role === "admin") && (
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 mt-12">
            <h3 className="text-2xl font-bold mb-6">Related Products </h3>
            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {relatedProducts.map((rel) => {
                  const bidCount =
                    typeof rel.bidCount === "number"
                      ? rel.bidCount
                      : rel.bids?.length || 0;
                  const topBidder =
                    rel.topBidderName ||
                    (rel.bids && rel.bids.length > 0
                      ? rel.bids[0].bidderName
                      : null);
                  const createdTime = new Date(rel.createdAt).getTime();
                  const thirtyMinutesAgo =
                    new Date().getTime() - 30 * 60 * 1000;
                  const isNew = createdTime > thirtyMinutesAgo;

                  return (
                    <Link
                      key={rel.id}
                      to={`/auction/${rel.id}`}
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group"
                    >
                      <div className="h-40 relative bg-gray-200">
                        <img
                          src={
                            rel.images && rel.images.length > 0
                              ? rel.images[0]
                              : "https://placehold.co/400x300?text=No+Image"
                          }
                          alt={rel.title}
                          className="w-full h-full object-cover"
                        />
                        {isNew && (
                          <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            New
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />{" "}
                          {formatAuctionTime(rel.endsAt)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold truncate mb-1 group-hover:text-rose-600">
                          {rel.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {rel.category}
                        </p>

                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-xs text-gray-500">Current Bid</p>
                            <p className="text-lg font-bold text-rose-900">
                              {rel.currentBid.toLocaleString()}₫
                            </p>
                            {rel.buyNowPrice && (
                              <>
                                <p className="text-xs text-gray-500 mt-1">
                                  Buy Now
                                </p>
                                <p className="text-sm font-semibold">
                                  {rel.buyNowPrice.toLocaleString()}₫
                                </p>
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Bids</p>
                            <p className="font-medium">{bidCount}</p>
                          </div>
                        </div>

                        {topBidder && (
                          <p className="text-xs text-gray-500 pt-2 border-t mt-2">
                            Top Bidder:{" "}
                            <span className="font-medium text-gray-700">
                              {user?.role === "admin"
                                ? topBidder
                                : maskBidderName(topBidder)}
                            </span>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500">No related products found.</p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!pendingBidAmount}
        onOpenChange={(open) => !open && setPendingBidAmount(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Bid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to place a bid of{" "}
              <span className="font-bold text-rose-600">
                {pendingBidAmount?.toLocaleString()}₫
              </span>{" "}
              on "{listing.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPlaceBid}>
              Confirm Bid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!bidderToReject}
        onOpenChange={(open) => !open && setBidderToReject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Bidder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove their bids and ban them from bidding on this item
              again.
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
