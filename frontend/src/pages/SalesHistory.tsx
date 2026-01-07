import { useState, useEffect } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { TrendingUp, ArrowLeft, RefreshCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import OrderFulfillmentWizard from "../components/OrderFulfillment";
import { formatOrderStatus } from "../lib/utils";
import RateTransactionDialog from "../components/RateTransactionDialog";

type SaleOrder = {
  id: string;
  status: string;
  listingTitle?: string;
  bidderName?: string;
  bidderId?: string;
  finalPrice?: number | string;
  [key: string]: unknown;
};

type OrderMessage = {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
};

export default function SalesHistory() {
  const { user, rateUser } = useUser();
  const {
    getSellerOrders,
    updateOrderStatus,
    getOrderMessages,
    sendOrderMessage,
  } = useListings();
  const { toast } = useToast();

  const [orders, setOrders] = useState<SaleOrder[]>([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState<SaleOrder | null>(null);
  const [chatMessages, setChatMessages] = useState<OrderMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.role === "seller" || user?.type === "seller") {
      void getSellerOrders(user.id).then(setOrders);
    }
  }, [user, getSellerOrders]);

  if (!user || user.role !== "seller") return null;

  // Helper to map status to step index
  const getStep = (status: string) => {
    switch (status) {
      case "pending_payment":
        return 0;
      case "paid":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      case "completed":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const sales = orders || []; // fallback
  const filteredSales = sales.filter(
    (o) => statusFilter === "all" || String(o.status) === statusFilter
  );

  const handleCancelTransaction = async (id: string) => {
    await updateOrderStatus(id, "cancelled");
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
    );
    toast({
      title: "Transaction Cancelled",
      description: "Order marked as cancelled.",
      variant: "destructive",
    });
  };

  const openChatFor = async (order: SaleOrder) => {
    setChatOrder(order);
    setChatOpen(true);
    setChatBusy(true);
    try {
      const rows = await getOrderMessages(String(order.id));
      setChatMessages(rows);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const refreshChat = async () => {
    if (!chatOrder) return;
    setChatBusy(true);
    try {
      const rows = await getOrderMessages(String(chatOrder.id));
      setChatMessages(rows);
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh messages",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const sendChat = async () => {
    if (!chatOrder) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatBusy(true);
    try {
      await sendOrderMessage(String(chatOrder.id), trimmed);
      setChatText("");
      await refreshChat();
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const handleRateBidder = async (
    orderId: string,
    rating: 1 | -1,
    comment: string,
    bidderId?: string
  ) => {
    if (bidderId) {
      await rateUser(bidderId, rating, comment, "bidder");
    }

    await updateOrderStatus(orderId, "completed");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o))
    );
    toast({ title: "Bidder Rated", description: "Transaction completed." });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-rose-600" /> Sales History & Fulfillment
          </h1>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg border">
            No orders.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_payment">
                    Awaiting Payment
                  </SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredSales.map((sale) => {
              const currentStep = getStep(sale.status);
              const winner = sale.bidderName || "Unknown";

              return (
                <Card key={sale.id}>
                  <CardHeader className="bg-slate-50 border-b py-3">
                    <span className="font-bold text-lg">
                      {sale.listingTitle}
                    </span>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex justify-between gap-6 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sold Price
                        </p>
                        <p className="text-2xl font-bold text-rose-600">
                          {Number(sale.finalPrice ?? 0).toLocaleString()}₫
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Status
                        </p>
                        <p className="font-semibold">
                          {formatOrderStatus(sale.status)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bidder</p>
                        <p className="font-semibold">{winner}</p>
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => void openChatFor(sale)}
                        >
                          Chat
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <OrderFulfillmentWizard
                        order={sale}
                        userRole="seller"
                        showChat={false}
                        onUpdate={async (
                          id: string,
                          status: string,
                          proof?: string,
                          shippingAddress?: string
                        ) => {
                          await updateOrderStatus(
                            id,
                            status,
                            proof,
                            shippingAddress
                          );
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === id ? { ...o, status } : o
                            )
                          );
                        }}
                      />

                      {currentStep !== -1 && currentStep < 4 && (
                        <div className="flex gap-3 justify-end mt-4">
                          {["delivered", "completed"].includes(
                            String(sale.status)
                          ) &&
                            sale.bidderId &&
                            String(sale.status) !== "completed" && (
                              <RateTransactionDialog
                                triggerLabel="Rate Bidder"
                                title="Rate Transaction"
                                subjectName={winner}
                                onSubmit={async ({ rating, comment }) => {
                                  await handleRateBidder(
                                    sale.id,
                                    rating,
                                    comment,
                                    sale.bidderId
                                  );
                                }}
                              />
                            )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="ml-auto">
                                Cancel Order
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Cancel this order?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the order as cancelled. This
                                  action can affect ratings and cannot be easily
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    void handleCancelTransaction(sale.id)
                                  }
                                >
                                  Confirm Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Sheet
          modal={false}
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) {
              setChatOrder(null);
              setChatMessages([]);
              setChatText("");
            }
          }}
        >
          <SheetContent
            side="right"
            hideOverlay
            className="top-24 right-4 bottom-auto h-auto max-h-168 z-40 flex flex-col rounded-l-2xl"
          >
            <SheetHeader>
              <SheetTitle className="pr-10 truncate">
                Chat
                {chatOrder?.listingTitle ? `: ${chatOrder.listingTitle}` : ""}
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-1 min-h-0 flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {chatOrder ? `Order #${chatOrder.id}` : ""}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshChat()}
                  disabled={!chatOrder || chatBusy}
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>

              <hr />

              <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-white p-3 space-y-2">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  chatMessages.map((m) => {
                    const mine =
                      Number(m.senderId) === Number(user?.userId ?? user?.id);
                    return (
                      <div
                        key={m.id}
                        className={mine ? "text-right" : "text-left"}
                      >
                        <div className="text-xs text-primary">
                          {m.senderName}
                        </div>
                        <div
                          className={
                            "inline-block rounded-2xl px-3 py-2 text-sm border " +
                            (mine ? "bg-slate-50" : "bg-white")
                          }
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void sendChat();
                  }}
                />
                <Button
                  onClick={() => void sendChat()}
                  disabled={!chatOrder || !chatText.trim() || chatBusy}
                >
                  Send
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
