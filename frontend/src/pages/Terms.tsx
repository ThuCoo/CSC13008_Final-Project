import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border shadow-sm">
         <div className="mb-6">
            <Button asChild variant="ghost" className="pl-0 text-slate-500 hover:text-rose-600">
               <Link to="/"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Link>
            </Button>
         </div>
         <h1 className="text-3xl font-bold mb-6 text-rose-700">Terms of Service</h1>
         <div className="prose max-w-none text-slate-700 space-y-4">
            <p>Welcome to eBid. By accessing our website, you agree to these terms.</p>
            <h3 className="text-lg font-bold">1. Account Use</h3>
            <p>You must be 18 years or older to use our services. You are responsible for maintaining the confidentiality of your account.</p>
            <h3 className="text-lg font-bold">2. Bidding and Selling</h3>
            <p>Bids are binding contracts. Sellers must provide accurate descriptions of items. eBid is not responsible for the quality of items sold.</p>
            <h3 className="text-lg font-bold">3. Fees</h3>
            <p>Sellers may be charged fees for listing items. All fees are non-refundable.</p>
         </div>
      </div>
    </div>
  );
}
