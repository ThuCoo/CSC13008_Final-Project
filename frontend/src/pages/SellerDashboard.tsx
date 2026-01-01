import { useState } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Gavel, DollarSign, Plus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

export default function SellerDashboard() {
  const { user } = useUser();
  const { getSellerListings, updateListing } = useListings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appendDesc, setAppendDesc] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!user || user.type !== "seller") {
    return (
      <div className="min-h-screen bg-slate-50">
         {/* Dialog for Seller Access */}
         <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">Seller Access Required</h2>
              <p className="text-muted-foreground">
                You must be logged in as a seller to view this dashboard.
              </p>
              <div className="flex justify-center gap-4">
                 <Button variant="outline" onClick={() => navigate("/")}>
                   Back to Home
                 </Button>
                 <Button onClick={() => navigate("/become-seller")}>
                   Become a Seller
                 </Button>
              </div>
            </div>
         </div>
      </div>
    );
  }

  const myListings = getSellerListings(user.id);
  const activeListings = myListings.filter((l) => l.status === "active");
  const soldListings = myListings.filter((l) => l.status === "sold");

  const handleAppendDescription = () => {
    if (selectedId && appendDesc) {
      const listing = myListings.find((l) => l.id === selectedId);
      if (listing) {
        const timestamp = new Date().toLocaleString();
        const newDescription = `${listing.description}<br /><br />[Update ${timestamp}]: ${appendDesc}`;
        updateListing(selectedId, { description: newDescription });
        toast({
          title: "Description Updated",
          description: "New information appended successfully.",
        });
        setAppendDesc("");
        setSelectedId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/sales-history")}
            >
              View Sales History
            </Button>
            <Button
              onClick={() => navigate("/create-listing")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Listing
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sold Items
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{soldListings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Auctions
              </CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeListings.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Listings</TabsTrigger>
            <TabsTrigger value="ended">Ended/Unsold</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-4">
            {activeListings.map((l) => (
              <div
                key={l.id}
                className="bg-white p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div 
                  className="flex gap-4 items-center flex-1 cursor-pointer group"
                  onClick={() => navigate(`/auction/${l.id}`)}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    {l.images[0] && (
                      <img
                        src={l.images[0]}
                        alt={l.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-rose-600 transition">{l.title}</h3>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>
                        Current Bid:{" "}
                        <span className="text-primary font-semibold">
                          {l.currentBid.toLocaleString()}₫
                        </span>
                      </span>
                      <span>Bids: {l.bids.length}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(l.id); }}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Append Desc
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Append Description
                        </DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Add new details. Old description cannot be changed.
                      </p>
                      <Textarea
                        value={appendDesc}
                        onChange={(e) => setAppendDesc(e.target.value)}
                        placeholder="Enter new details..."
                      />
                      <DialogFooter>
                        <Button onClick={handleAppendDescription}>
                          Save Update
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
