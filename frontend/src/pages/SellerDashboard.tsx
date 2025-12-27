// import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, DollarSign, Plus, Eye, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Listing } from "../context/ListingsContext";
import { User } from "../context/user";

interface SellerDashboardPageProps {
  user: User;
  activeListings: Listing[];
  soldListings: Listing[];
  appendDesc: string;
  setAppendDesc: (val: string) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onAppendDescription: () => void;
  onNavigateSalesHistory: () => void;
  onNavigateCreateListing: () => void;
}

export default function SellerDashboardPage({
  user,
  activeListings,
  soldListings,
  appendDesc,
  setAppendDesc,
  selectedId: _selectedId,
  setSelectedId,
  onAppendDescription,
  onNavigateSalesHistory,
  onNavigateCreateListing,
}: SellerDashboardPageProps) {
  if (!user || user.type !== "seller") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="p-12 text-center">Seller access required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onNavigateSalesHistory}
            >
              View Sales History
            </Button>
            <Button
              onClick={onNavigateCreateListing}
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
                className="bg-white p-4 rounded-lg border flex flex-col md:flex-row justify-between items-center gap-4"
              >
                <div className="flex gap-4 items-center flex-1">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    {l.images[0] && (
                      <img
                        src={l.images[0]}
                        alt={l.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{l.title}</h3>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>
                        Current Bid:{" "}
                        <span className="text-primary font-semibold">
                          ${l.currentBid}
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
                        onClick={() => setSelectedId(l.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Append Desc
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Append Description [cite: 247]
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
                        <Button onClick={onAppendDescription}>
                          Save Update
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/auction/${l.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
