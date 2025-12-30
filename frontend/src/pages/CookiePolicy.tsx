import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl border shadow-sm">
         <div className="mb-6">
            <Button asChild variant="ghost" className="pl-0 text-slate-500 hover:text-rose-600">
               <Link to="/"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Home</Link>
            </Button>
         </div>
         <h1 className="text-3xl font-bold mb-6 text-rose-700">Cookie Policy</h1>
         <div className="prose max-w-none text-slate-700 space-y-4">
            <p>We use cookies to enhance your experience on eBid.</p>
            <h3 className="text-lg font-bold">1. What are Cookies?</h3>
            <p>Cookies are small text files stored on your device that help us remember your preferences.</p>
            <h3 className="text-lg font-bold">2. Types of Cookies</h3>
            <p>We use essential cookies for site functionality and analytics cookies to understand how you use our site.</p>
            <h3 className="text-lg font-bold">3. Managing Cookies</h3>
            <p>You can control cookies through your browser settings. Disabling cookies may affect site functionality.</p>
         </div>
      </div>
    </div>
  );
}
