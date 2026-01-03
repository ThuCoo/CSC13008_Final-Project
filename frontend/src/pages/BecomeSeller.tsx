import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useSellerRequests } from "../context/SellerRequestsContext";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function BecomeSeller() {
  const { user } = useUser();
  const { createSellerRequest, getRequestByUserId } = useSellerRequests();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
  });

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8 bg-white rounded-xl border shadow-sm max-w-md">
                <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
                <p className="mb-6 text-muted-foreground">You need to log in to apply as a seller.</p>
                <Button asChild>
                    <a href="/login">Go to Login</a>
                </Button>
            </div>
        </div>
    );
  }

  const existingRequest = getRequestByUserId(user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user.id || isNaN(Number(user.id))) {
      toast({ 
        title: "Error", 
        description: "Invalid user session. Please log out and log in again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createSellerRequest({
        userId: user.id,
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
      });
      toast({ title: "Request Submitted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Seller Application</h1>
          </div>

          {existingRequest ? (
            <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-bold capitalize mb-1">
                Status: {existingRequest.status}
              </h3>
              <p className="text-sm">
                Note: Seller privileges valid for 7 days upon approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md flex gap-3 text-sm text-blue-800">
                <AlertCircle className="w-5 h-5" />
                <p>
                  <strong>Note:</strong> Privileges expire after 7 days.
                </p>
              </div>
              <div className="space-y-2">
                <label>Business Name</label>
                <Input
                  required
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label>Description</label>
                <Textarea
                  required
                  className="h-32"
                  value={formData.businessDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDescription: e.target.value,
                    })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
