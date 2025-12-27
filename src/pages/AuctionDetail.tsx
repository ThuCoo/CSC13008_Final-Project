import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Ban,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { Listing, Question, Bid } from "../context/ListingsContext";
import { formatAuctionTime, maskBidderName } from "../lib/utils";
import AutoBidForm from "@/components/AutoBidForm";

// Define props for the Pure UI component
interface AuctionDetailPageProps {
  listing: Listing | undefined;
  user: { id: string; name: string } | null;
  relatedProducts: Listing[];
  isSeller: boolean;
  bidAmount: string;
  setBidAmount: (val: string) => void;
  questionText: string;
  setQuestionText: (val: string) => void;
  answerText: string;
  setAnswerText: (val: string) => void;
  onRejectBidder: (bidderId: string) => void;
  onPlaceBid: (e: React.FormEvent) => void;
  onAskQuestion: (e: React.FormEvent) => void;
  onAnswerQuestion: (qId: string) => void;
  onNavigateBack: () => void;
  onNavigateLogin: () => void;
}

export default function AuctionDetailPage({
  listing,
  user,
  relatedProducts,
  isSeller,
  bidAmount,
  setBidAmount,
  questionText,
  setQuestionText,
  answerText,
  setAnswerText,
  onRejectBidder,
  onPlaceBid,
  onAskQuestion,
  onAnswerQuestion,
  onNavigateBack,
  // onNavigateLogin,
}: AuctionDetailPageProps) {
  if (!listing) return <div>Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Go Back Button */}
        <Button
          variant="ghost"
          className="mb-4 pl-0 hover:bg-transparent hover:text-blue-600"
          onClick={onNavigateBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to listings
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Main Info */}
            <div className="bg-white rounded-xl border p-6">
              <div
                className={`h-96 rounded-xl bg-gradient-to-br ${listing.imageColor} mb-6`}
              ></div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
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
                <form onSubmit={onAskQuestion} className="flex gap-2 mb-6">
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
                {(listing.questions || []).map((q: Question) => (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-sm mb-1">
                      {maskBidderName(q.userName)} asked:
                    </p>
                    <p className="text-slate-700 mb-2">{q.question}</p>

                    {q.answer ? (
                      <div className="ml-4 pl-4 border-l-2 border-blue-200">
                        <p className="font-semibold text-sm text-blue-700">
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
                          onClick={() => onAnswerQuestion(q.id)}
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
              <p className="text-4xl font-bold text-blue-600 mb-4">
                ${listing.currentBid.toLocaleString()}
              </p>

              {/* Logic: Only show bid forms if user is not the seller */}
              {!isSeller && (
                <div className="space-y-6">
                  <form onSubmit={onPlaceBid}>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="number"
                        placeholder={`Min $${listing.currentBid + listing.stepPrice}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" type="submit">
                      Place Direct Bid
                    </Button>
                  </form>

                  {/* Auto Bid System (Preserved) */}
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
                  {listing.bids.map((bid: Bid) => (
                    <div
                      key={bid.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {maskBidderName(bid.bidderName)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          ${bid.amount.toLocaleString()}
                        </span>
                        {isSeller && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-50"
                            onClick={() => onRejectBidder(bid.bidderId)}
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
                {relatedProducts.map((rel: Listing) => (
                  <div
                    key={rel.id}
                    onClick={() => { }}
                    className="cursor-pointer block"
                  >
                    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
                        <div
                          className={`h-32 bg-gradient-to-br ${rel.imageColor}`}
                        />
                        <div className="p-3">
                          <h4 className="font-bold truncate text-sm">
                            {rel.title}
                          </h4>
                          <p className="text-blue-600 font-bold text-sm">
                            ${rel.currentBid.toLocaleString()}
                          </p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No related products found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
