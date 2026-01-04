import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { CheckCircle2, Upload, Truck, CreditCard } from "lucide-react";

interface OrderFulfillmentWizardProps {
  order: any;
  userRole: "bidder" | "seller";
  onUpdate: (orderId: string, status: string, proof?: string) => Promise<void>;
}

export default function OrderFulfillmentWizard({
  order,
  userRole,
  onUpdate,
}: OrderFulfillmentWizardProps) {
  const { toast } = useToast();
  const [proof, setProof] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status flow: paid -> shipped -> delivered -> completed
  const currentStatus = order.status;

  const handleUploadProof = async () => {
    if (!proof) return;
    setIsSubmitting(true);
    try {
      if (userRole === "bidder" && currentStatus === "paid") {
           // Bidder uploads payment proof
           await onUpdate(order.id, "paid", proof);
           toast({ title: "Payment proof uploaded" });
      } else if (userRole === "seller" && currentStatus === "paid") {
           // Seller marks as shipped
           await onUpdate(order.id, "shipped", proof);
           toast({ title: "Shipping info updated" });
      }
      setProof("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className={`flex flex-col items-center gap-1 ${currentStatus === 'paid' ? 'text-rose-600' : 'text-slate-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStatus === 'paid' ? 'border-rose-600 bg-rose-50' : 'border-slate-200'}`}>
             <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Payment</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-200 mx-2" />
        <div className={`flex flex-col items-center gap-1 ${currentStatus === 'shipped' ? 'text-rose-600' : 'text-slate-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStatus === 'shipped' ? 'border-rose-600 bg-rose-50' : 'border-slate-200'}`}>
             <Truck className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Shipping</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-200 mx-2" />
        <div className={`flex flex-col items-center gap-1 ${['delivered', 'completed'].includes(currentStatus) ? 'text-rose-600' : 'text-slate-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['delivered', 'completed'].includes(currentStatus) ? 'border-rose-600 bg-rose-50' : 'border-slate-200'}`}>
             <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Done</span>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-dashed text-center">
        {userRole === "bidder" && currentStatus === "paid" && (
          <div className="space-y-4">
            <h3 className="font-bold">Upload Payment Proof</h3>
            <p className="text-sm text-slate-500">Please provide a URL or description of your transaction.</p>
            <Input 
                placeholder="Transaction ID or URL" 
                value={proof} 
                onChange={(e) => setProof(e.target.value)}
            />
            <Button className="w-full" onClick={handleUploadProof} disabled={!proof || isSubmitting}>
               <Upload className="w-4 h-4 mr-2" /> Submit Payment Proof
            </Button>
          </div>
        )}

        {userRole === "seller" && currentStatus === "paid" && (
          <div className="space-y-4">
            <h3 className="font-bold">Shipping Information</h3>
            <p className="text-sm text-slate-500">Enter tracking number or shipping provider.</p>
            <Input 
                placeholder="Tracking # / Carrier" 
                value={proof} 
                onChange={(e) => setProof(e.target.value)}
            />
            <Button className="w-full" onClick={handleUploadProof} disabled={!proof || isSubmitting}>
               <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
            </Button>
          </div>
        )}

        {currentStatus === "shipped" && userRole === "bidder" && (
             <div className="space-y-4">
                <h3 className="font-bold">Item on the way!</h3>
                <p className="text-sm text-slate-500">The seller has shipped your item. Please confirm once you receive it.</p>
                <Button className="w-full" onClick={() => onUpdate(order.id, "delivered")}>
                    Confirm Receipt
                </Button>
             </div>
        )}

        {((currentStatus === "shipped" && userRole === "seller") || (currentStatus === "delivered")) && (
             <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="font-semibold">Waiting for next step...</p>
             </div>
        )}
      </div>
    </div>
  );
}
