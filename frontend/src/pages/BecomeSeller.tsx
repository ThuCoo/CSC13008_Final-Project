// import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface BecomeSellerPageProps {
  user: any;
  existingRequest: any;
  formData: { businessName: string; businessDescription: string };
  setFormData: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BecomeSellerPage({
  user,
  existingRequest,
  formData,
  setFormData,
  onSubmit,
}: BecomeSellerPageProps) {
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
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
            <form onSubmit={onSubmit} className="space-y-6">
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
