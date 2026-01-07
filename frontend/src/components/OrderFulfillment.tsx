import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { CheckCircle2, Upload, Truck, CreditCard } from "lucide-react";
import { useListings } from "../context/ListingsContext";
import { useUser } from "../context/UserContext";

interface OrderFulfillmentWizardProps {
  order: any;
  userRole: "bidder" | "seller";
  showChat?: boolean;
  onUpdate: (
    orderId: string,
    status: string,
    proof?: string,
    shippingAddress?: string
  ) => Promise<void>;
}

export default function OrderFulfillmentWizard({
  order,
  userRole,
  showChat = true,
  onUpdate,
}: OrderFulfillmentWizardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { getOrderMessages, sendOrderMessage } = useListings();

  const [paymentProof, setPaymentProof] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingProof, setShippingProof] = useState("");

  const [messages, setMessages] = useState<
    Array<{
      id: number;
      orderId: number;
      senderId: number;
      senderName: string;
      message: string;
      createdAt: string;
    }>
  >([]);
  const [chatText, setChatText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStatus = order.status;

  useEffect(() => {
    if (!showChat) return;
    let mounted = true;
    (async () => {
      const rows = await getOrderMessages(String(order.id));
      if (mounted) setMessages(rows);
    })();
    return () => {
      mounted = false;
    };
  }, [order.id, getOrderMessages, showChat]);

  const refreshMessages = async () => {
    if (!showChat) return;
    const rows = await getOrderMessages(String(order.id));
    setMessages(rows);
  };

  const handleSendMessage = async () => {
    if (!showChat) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await sendOrderMessage(String(order.id), trimmed);
      setChatText("");
      await refreshMessages();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async () => {
    setIsSubmitting(true);
    try {
      if (userRole === "bidder" && currentStatus === "pending_payment") {
        if (!paymentProof.trim() || !shippingAddress.trim()) return;
        await onUpdate(
          order.id,
          "paid",
          paymentProof.trim(),
          shippingAddress.trim()
        );
        toast({ title: "Payment submitted" });
        setPaymentProof("");
        setShippingAddress("");
      } else if (userRole === "seller" && currentStatus === "paid") {
        if (!shippingProof.trim()) return;
        await onUpdate(order.id, "shipped", shippingProof.trim());
        toast({ title: "Marked as shipped" });
        setShippingProof("");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div
          className={`flex flex-col items-center gap-1 ${
            [
              "pending_payment",
              "paid",
              "shipped",
              "delivered",
              "completed",
            ].includes(currentStatus)
              ? "text-rose-600"
              : "text-slate-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              [
                "pending_payment",
                "paid",
                "shipped",
                "delivered",
                "completed",
              ].includes(currentStatus)
                ? "border-rose-600 bg-rose-50"
                : "border-slate-200"
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Payment</span>
        </div>

        <div className="h-0.5 flex-1 bg-slate-200 mx-2" />

        <div
          className={`flex flex-col items-center gap-1 ${
            ["shipped", "delivered", "completed"].includes(currentStatus)
              ? "text-rose-600"
              : "text-slate-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              ["shipped", "delivered", "completed"].includes(currentStatus)
                ? "border-rose-600 bg-rose-50"
                : "border-slate-200"
            }`}
          >
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Shipping</span>
        </div>

        <div className="h-0.5 flex-1 bg-slate-200 mx-2" />

        <div
          className={`flex flex-col items-center gap-1 ${
            ["delivered", "completed"].includes(currentStatus)
              ? "text-rose-600"
              : "text-slate-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              ["delivered", "completed"].includes(currentStatus)
                ? "border-rose-600 bg-rose-50"
                : "border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Received</span>
        </div>

        <div className="h-0.5 flex-1 bg-slate-200 mx-2" />

        <div
          className={`flex flex-col items-center gap-1 ${
            currentStatus === "completed" ? "text-rose-600" : "text-slate-400"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              currentStatus === "completed"
                ? "border-rose-600 bg-rose-50"
                : "border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Rated</span>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-dashed text-center space-y-6">
        {userRole === "bidder" && currentStatus === "pending_payment" && (
          <div className="space-y-4">
            <h3 className="font-bold">Step 1: Payment & Address</h3>
            <p className="text-sm text-slate-500">
              Provide your delivery address and payment invoice/proof.
            </p>
            <Input
              placeholder="Delivery address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
            <Input
              placeholder="Payment proof (transaction ID / URL / notes)"
              value={paymentProof}
              onChange={(e) => setPaymentProof(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleUploadProof}
              disabled={
                !paymentProof.trim() || !shippingAddress.trim() || isSubmitting
              }
            >
              <Upload className="w-4 h-4 mr-2" /> Submit Payment Proof
            </Button>
          </div>
        )}

        {userRole === "seller" && currentStatus === "paid" && (
          <div className="space-y-4">
            <h3 className="font-bold">Step 2: Confirm & Ship</h3>
            <p className="text-sm text-slate-500">
              Enter shipping invoice / tracking info.
            </p>
            <Input
              placeholder="Tracking # / Carrier"
              value={shippingProof}
              onChange={(e) => setShippingProof(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleUploadProof}
              disabled={!shippingProof.trim() || isSubmitting}
            >
              <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
            </Button>
          </div>
        )}

        {currentStatus === "shipped" && userRole === "bidder" && (
          <div className="space-y-4">
            <h3 className="font-bold">Step 3: Confirm Receipt</h3>
            <p className="text-sm text-slate-500">
              Confirm once you receive the goods.
            </p>
            <Button
              className="w-full"
              onClick={() => onUpdate(order.id, "delivered")}
            >
              Confirm Receipt
            </Button>
          </div>
        )}

        {((currentStatus === "shipped" && userRole === "seller") ||
          currentStatus === "delivered" ||
          currentStatus === "completed") && (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold">
              {currentStatus === "completed"
                ? "Order completed."
                : "Waiting for next step..."}
            </p>
          </div>
        )}

        {showChat && (
          <div className="text-left">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Chat</h4>
              <Button variant="outline" size="sm" onClick={refreshMessages}>
                Refresh
              </Button>
            </div>
            <div className="mt-3 max-h-56 overflow-auto rounded-lg border bg-white p-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const mine = Number(m.senderId) === Number(user?.id);
                  return (
                    <div
                      key={m.id}
                      className={mine ? "text-right" : "text-left"}
                    >
                      <div className="text-xs text-slate-500">
                        {m.senderName}
                      </div>
                      <div
                        className={
                          "inline-block rounded-lg px-3 py-2 text-sm border " +
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
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSendMessage();
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatText.trim() || isSubmitting}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
