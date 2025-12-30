import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";

interface AutoBidFormProps {
  listingId: string;
  userId: string;
  currentBid: number;
  minBid: number;
}

export default function AutoBidForm({
  listingId,
  userId,
  currentBid: _currentBid,
  minBid,
}: AutoBidFormProps) {
  const [maxBid, setMaxBid] = useState(minBid.toString());
  const [enabled, setEnabled] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Future: call an API/Context to set auto-bid
    console.log("Set auto-bid:", { listingId, userId, maxBid, enabled });
    toast({
        title: enabled ? "Auto-Bid Enabled" : "Auto-Bid Disabled",
        description: enabled ? `Max limit set to ${Number(maxBid).toLocaleString()}₫` : "Auto-bidding turned off.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="auto-bid-toggle" className="font-medium text-slate-700">
          Enable Auto-Bid
        </Label>
        <Switch
          id="auto-bid-toggle"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabled && (
        <div className="space-y-2">
          <Label htmlFor="max-bid">Maximum Bid Limit</Label>
          <div className="flex gap-2">
            <Input
              id="max-bid"
              type="number"
              placeholder={`Max Limit > ${minBid.toLocaleString()}₫`}
              value={maxBid}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxBid(e.target.value)}
              min={minBid}
              required={enabled}
            />
            <Button type="submit" variant="secondary">
              Set
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            System will bid for you up to this amount.
          </p>
        </div>
      )}
    </form>
  );
}
