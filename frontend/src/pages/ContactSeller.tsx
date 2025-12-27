import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Mail } from "lucide-react";
import { Listing } from "../context/ListingsContext";

interface ContactSellerPageProps {
  listing: Listing | undefined;
  message: string;
  setMessage: (val: string) => void;
  onSend: () => void;
}

export default function ContactSellerPage({
  listing,
  message,
  setMessage,
  onSend,
}: ContactSellerPageProps) {
  if (!listing) return <div className="p-8">Listing not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-xl border shadow-sm">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-6 h-6" /> Ask Seller
          </h1>
          <p className="mb-2">
            Item: <strong>{listing.title}</strong>
          </p>
          <Textarea
            placeholder="Type your question..."
            className="h-40 mb-4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={onSend} className="w-full">
            Send Question
          </Button>
        </div>
      </div>
    </div>
  );
}
