import Header from "../components/Header";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Listing } from "../context/ListingsContext";

interface SalesHistoryPageProps {
  user: any;
  sales: Listing[];
  orderSteps: Record<string, number>;
  onAdvanceOrderStep: (id: string, currentStep: number) => void;
  onCancelTransaction: (id: string) => void;
}

export default function SalesHistoryPage({
  user,
  sales,
  orderSteps,
  onAdvanceOrderStep,
  onCancelTransaction,
}: SalesHistoryPageProps) {
  if (!user || user.type !== "seller") return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
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
                          ${sale.currentBid}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Buyer</p>
                        <p className="font-semibold">{winner}</p>
                      </div>
                    </div>

                    {/* Updated Workflow UI */}
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
                          {currentStep === 0 && (
                            <Button
                              onClick={() => onAdvanceOrderStep(sale.id, 0)}
                            >
                              Confirm Payment
                            </Button>
                          )}
                          {currentStep === 1 && (
                            <Button
                              onClick={() => onAdvanceOrderStep(sale.id, 1)}
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
                            onClick={() => onCancelTransaction(sale.id)}
                          >
                            Cancel & Rate -1 [cite: 243]
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
