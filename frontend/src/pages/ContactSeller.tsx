import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { useListings } from "../context/ListingsContext";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { Mail } from "lucide-react";

export default function ContactSeller() {
  const { id } = useParams();
  const { getListingById, fetchListingById } = useListings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const listing = getListingById(id || "");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    void fetchListingById(id).finally(() => setIsLoading(false));
  }, [id, fetchListingById]);

  const handleSend = () => {
    if (!message) return;
    toast({
      title: "Question Sent",
      description: `Email sent to ${listing?.sellerName} with a link to reply.`,
    });
    setMessage("");
    setTimeout(() => navigate(-1), 1500);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!listing) return <div className="p-8">Listing not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
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
          <Button onClick={handleSend} className="w-full">
            Send Question
          </Button>
        </div>
      </div>
    </div>
  );
}
