import { useState } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function SalesHistory() {
  const { user } = useUser();
  const { getSellerListings } = useListings();
  const { toast } = useToast();

  // Mock State for Order Workflow (1: Pending, 2: Shipped, 3: Rated, -1: Cancelled)
  const [orderSteps, setOrderSteps] = useState<Record<string, number>>({});

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
        description: "Buyer received item.",
      });
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
                          4. Rated
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
                            <span className="text-sm text-amber-600 italic">
                              Waiting for buyer to confirm receipt...
                            </span>
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
