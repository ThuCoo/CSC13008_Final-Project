
import { useState } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TrendingUp, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

export default function SalesHistory() {
  const { user } = useUser();
  const { getSellerListings } = useListings();
  const { toast } = useToast();

  // Mock State for Order Workflow
  const [orderSteps, setOrderSteps] = useState<Record<string, number>>({});
  const [reviewComment, setReviewComment] = useState("");

  if (!user || user.type !== "seller") return null;

  const sales = getSellerListings(user.id).filter((l) => l.status === "sold");

  const handleCancelTransaction = (id: string) => {
    setOrderSteps((prev) => ({ ...prev, [id]: -1 }));
    toast({
      title: "Transaction Cancelled",
      description: "Buyer has been automatically rated -1. ",
      variant: "destructive",
    });
  };

  const advanceOrderStep = (id: string, currentStep: number) => {
    setOrderSteps((prev) => ({ ...prev, [id]: currentStep + 1 }));

    if (currentStep === 0)
      toast({
        title: "Payment Confirmed",
        description: "Invoice sent to buyer.",
      });
    if (currentStep === 1)
      toast({
        title: "Item Shipped",
        description: "Waiting for buyer receipt.",
      });
    if (currentStep === 2)
      toast({
        title: "Delivery Confirmed",
        description: "Buyer received item. You can now leave feedback.",
      });
  };

  const handleRateBuyer = (id: string, _rating: 1 | -1) => {
    if (!reviewComment) {
        toast({ title: "Comment Required", description: "Please write a review", variant: "destructive" });
        return;
    }
    setOrderSteps(prev => ({ ...prev, [id]: 4 })); // Move to Completed
    toast({ title: "Buyer Rated", description: "Transaction completed." });
    setReviewComment("");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="text-green-600" /> Sales History & Fulfillment
        </h1>

        {sales.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border">
            No sales yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sales.map((sale) => {
              const currentStep = orderSteps[sale.id] || 0;
              const winner = sale.bids[0]?.bidderName || "Unknown";

              return (
                <Card key={sale.id}>
                  <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center py-3">
                    <span className="font-bold text-lg">{sale.title}</span>
                    <Badge
                      variant={currentStep === -1 ? "destructive" : "default"}
                    >
                      {currentStep === -1
                        ? "Cancelled"
                        : currentStep >= 4
                          ? "Completed"
                          : "In Progress"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between gap-6 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Winning Bid
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {sale.currentBid.toLocaleString()}₫
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Buyer</p>
                        <p className="font-semibold">{winner}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                        <span
                          className={
                            currentStep >= 1
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          1. Paid
                        </span>{" "}
                        &rarr;
                        <span
                          className={
                            currentStep >= 2
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          2. Shipped
                        </span>{" "}
                        &rarr;
                        <span
                          className={
                            currentStep >= 3
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          3. Received
                        </span>{" "}
                        &rarr;
                        <span
                          className={
                            currentStep >= 4
                              ? "text-green-600"
                              : "text-gray-400"
                          }
                        >
                          4. Rated (Done)
                        </span>
                      </div>

                      {currentStep !== -1 && currentStep < 4 && (
                        <div className="flex gap-3">
                          {/* Only show buttons relevant to Seller actions */}
                          {currentStep === 0 && (
                            <Button
                              onClick={() => advanceOrderStep(sale.id, 0)}
                            >
                              Confirm Payment
                            </Button>
                          )}
                          {currentStep === 1 && (
                            <Button
                              onClick={() => advanceOrderStep(sale.id, 1)}
                            >
                              Mark Shipped
                            </Button>
                          )}
                          {currentStep === 2 && (
                            <div className="flex gap-2 items-center">
                                <span className="text-sm text-amber-600 italic mr-2">
                                  Waiting for buyer confirmation... 
                                </span>
                                {/* Mocking Buyer Confirmation for demo purposes */}
                                <Button variant="outline" size="sm" onClick={() => advanceOrderStep(sale.id, 2)}>
                                    (Mock) Buyer Confirms
                                </Button>
                            </div>
                          )}
                          {currentStep === 3 && (
                              <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                  <Star className="w-4 h-4 mr-2" /> Rate Buyer
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Buyer: {winner}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Textarea
                                    placeholder="How was the transaction?"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleRateBuyer(sale.id, -1)}
                                    >
                                      <ThumbsDown className="w-4 h-4 mr-2" /> -1
                                    </Button>
                                    <Button
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleRateBuyer(sale.id, 1)}
                                    >
                                      <ThumbsUp className="w-4 h-4 mr-2" /> +1
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <Button
                            variant="destructive"
                            className="ml-auto"
                            onClick={() => handleCancelTransaction(sale.id)}
                          >
                            Cancel & Rate -1
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
