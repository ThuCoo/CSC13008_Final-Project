import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  User as UserIcon,
  Lock,
  Calendar,
  MapPin,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Listing } from "../context/ListingsContext";

export interface User {
  id: string;
  name: string;
  email: string;
  birthday?: string;
  address?: string;
  positiveReviews: number;
  totalReviews: number;
}

interface AccountSettingsPageProps {
  user: User | null;
  activeBids: Listing[];
  wonItems: Listing[];
  onUpdateProfile: (data: {
    name: string;
    email: string;
    birthday: string;
    address: string;
  }) => void;
  onChangePassword: (
    currentPass: string,
    newPass: string,
    confirmPass: string
  ) => void;
  onRateSeller: (listingId: string, rating: 1 | -1, comment: string) => void;
}

export default function AccountSettingsPage({
  user,
  activeBids,
  wonItems,
  onUpdateProfile,
  onChangePassword,
  onRateSeller,
}: AccountSettingsPageProps) {
  const { toast } = useToast();

  // Profile State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [address, setAddress] = useState(user?.address || "");

  // Password State
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Review State
  const [reviewComment, setReviewComment] = useState("");

  if (!user) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, email, birthday, address });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    onChangePassword(currentPass, newPass, confirmPass);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  const handleRateSellerSubmit = (listingId: string, rating: 1 | -1) => {
    if (!reviewComment) {
      toast({
        title: "Comment Required",
        description: "Please write a short review.",
        variant: "destructive",
      });
      return;
    }
    onRateSeller(listingId, rating, reviewComment);
    setReviewComment("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Management</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6 grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="bidding">My Bids </TabsTrigger>
            <TabsTrigger value="won">Won & Reviews</TabsTrigger>
          </TabsList>

          {/* 1. Profile Update */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <UserIcon className="w-5 h-5" /> Personal Info
                </CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          className="pl-9"
                          type="date"
                          value={birthday}
                          onChange={(e) => setBirthday(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          className="pl-9"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street, City..."
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit">Save Profile</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Password Change */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <Lock className="w-5 h-5" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 max-w-md"
                >
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Bids */}
          <TabsContent value="bidding">
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Active Biddings</h2>
              {activeBids.length === 0 ? (
                <p className="text-muted-foreground">
                  You are not bidding on any active items.
                </p>
              ) : (
                activeBids.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{l.title}</h3>
                        <p className="text-sm text-slate-500">
                          Ends: {new Date(l.endsAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Current Price</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${l.currentBid}
                        </p>
                        {l.bids[0]?.bidderId === user?.id ? (
                          <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">
                            You are winning
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-1 rounded">
                            Outbid
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          {/* 3. Won Items & Reviews */}
          <TabsContent value="won">
            <div className="space-y-4">
              {wonItems.length === 0 ? (
                <p className="text-muted-foreground p-4">
                  No won auctions yet.
                </p>
              ) : (
                wonItems.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{l.title}</h3>
                        <p className="text-green-600 font-bold">
                          Won at ${l.currentBid}
                        </p>
                        <p className="text-sm text-slate-500">
                          Seller: {l.sellerName}
                        </p>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Star className="w-4 h-4 mr-2" /> Rate Seller
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate Transaction</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-slate-600">
                              Please rate your experience with{" "}
                              <strong>{l.sellerName}</strong>.
                            </p>
                            <Textarea
                              placeholder="Write your review here (Required)..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleRateSellerSubmit(l.id, -1)
                                }
                              >
                                <ThumbsDown className="w-4 h-4 mr-2" /> -1
                                Negative
                              </Button>
                              <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  handleRateSellerSubmit(l.id, 1)
                                }
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" /> +1
                                Positive
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
