import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border shadow-sm">
         <div className="mb-6">
            <Button asChild variant="ghost" className="pl-0 text-slate-500 hover:text-rose-600">
               <Link to="/"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Link>
            </Button>
         </div>
         <h1 className="text-3xl font-bold mb-6 text-rose-700">Privacy Policy</h1>
         <div className="prose max-w-none text-slate-700 space-y-4">
            <p>your privacy is important to us. This policy explains how we collect and use your data.</p>
            <h3 className="text-lg font-bold">1. Information Collection</h3>
            <p>We collect information you provide when creating an account, such as name, email, and payment details.</p>
            <h3 className="text-lg font-bold">2. Data Usage</h3>
            <p>We use your data to process transactions, improve our services, and communicate with you.</p>
            <h3 className="text-lg font-bold">3. Data Sharing</h3>
            <p>We do not sell your personal data. We may share data with service providers who help us operate our platform.</p>
         </div>
      </div>
    </div>
  );
}
