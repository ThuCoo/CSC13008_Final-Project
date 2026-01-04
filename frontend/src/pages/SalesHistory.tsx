
import { useState, useEffect } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TrendingUp, ThumbsUp, ThumbsDown, Star, ArrowLeft } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import OrderFulfillmentWizard from "../components/OrderFulfillment";

export default function SalesHistory() {
  const { user, rateUser } = useUser();
  const { getSellerOrders, updateOrderStatus } = useListings();
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
      if (user?.role === "seller" || user?.type === "seller") {
          getSellerOrders(user.id).then(setOrders);
      }
  }, [user]);

  if (!user || user.role !== "seller") return null;

  // Helper to map status to step index
  const getStep = (status: string) => {
      switch(status) {
          case 'paid': return 0;
          case 'shipped': return 1;
          case 'delivered': return 2; // Bidder received
          case 'completed': return 4; // Rated
          case 'cancelled': return -1;
          default: return 0;
      }
  };

  const sales = orders || []; // fallback

  const handleCancelTransaction = async (id: string) => {
    await updateOrderStatus(id, "cancelled");
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
    toast({
      title: "Transaction Cancelled",
      description: "Order marked as cancelled.",
      variant: "destructive",
    });
  };


  const handleRateBidder = async (orderId: string, rating: 1 | -1, bidderId?: string) => {
    if (!reviewComment) {
        toast({ title: "Comment Required", description: "Please write a review", variant: "destructive" });
        return;
    }

    if (bidderId) {
        await rateUser(bidderId, rating, reviewComment, "bidder");
    }
    
    await updateOrderStatus(orderId, "completed");
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "completed" } : o));
    toast({ title: "Bidder Rated", description: "Transaction completed." });
    setReviewComment("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-rose-600" /> Sales History & Fulfillment
          </h1>
        </div>

        {sales.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border">
            No sales yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sales.map((sale) => {
              const currentStep = getStep(sale.status);
              const winner = sale.bidderName || "Unknown";

              return (
                <Card key={sale.id}>
                  <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center py-3">
                    <span className="font-bold text-lg">{sale.listingTitle}</span>
                    <Badge
                      variant={currentStep === -1 ? "destructive" : "default"}
                    >
                      {currentStep === -1
                        ? "Cancelled"
                        : currentStep >= 4
                          ? "Completed"
                          : sale.status.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between gap-6 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sold Price
                        </p>
                        <p className="text-2xl font-bold text-rose-600">
                          {Number(sale.finalPrice).toLocaleString()}₫
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bidder</p>
                        <p className="font-semibold">{winner}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <OrderFulfillmentWizard 
                        order={sale}
                        userRole="seller"
                        onUpdate={async (id: string, status: string, proof?: string) => {
                            await updateOrderStatus(id, status, proof);
                            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                        }}
                      />

                      {currentStep !== -1 && currentStep < 4 && (
                        <div className="flex gap-3 justify-end mt-4">
                          {currentStep === 2 && ( // Delivered -> Rate -> Completed
                              <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-rose-600 hover:bg-rose-700">
                                  <Star className="w-4 h-4 mr-2" /> Rate Bidder
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Bidder: {winner}</DialogTitle>
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
                                      onClick={() => handleRateBidder(sale.id, -1, sale.bidderId)}
                                    >
                                      <ThumbsDown className="w-4 h-4 mr-2" /> -1
                                    </Button>
                                    <Button
                                      className="bg-rose-600 hover:bg-rose-700"
                                      onClick={() => handleRateBidder(sale.id, 1, sale.bidderId)}
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
                            Cancel Order
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
