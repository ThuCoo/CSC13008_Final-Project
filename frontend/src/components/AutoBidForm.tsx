import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useToast } from "../hooks/use-toast";
import { useListings } from "../context/ListingsContext";

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
  const { placeBid } = useListings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enabled) {
        toast({ title: "Auto-Bid Disabled" });
        return;
    }
    
    try {
        placeBid(listingId, userId, "Bidder", minBid, undefined, Number(maxBid));
        toast({
            title: "Auto-Bid Enabled",
            description: `Max limit set to ${Number(maxBid).toLocaleString()}₫`,
        });
    } catch (err: any) {
        console.error(err);
        toast({ title: "Failed to set auto-bid", variant: "destructive" });
    }
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
