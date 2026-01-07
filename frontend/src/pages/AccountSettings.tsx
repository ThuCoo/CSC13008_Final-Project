import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import apiClient from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import OrderFulfillmentWizard from "../components/OrderFulfillment";
import { formatOrderStatus } from "../lib/utils";
import {
  User,
  Lock,
  Calendar,
  MapPin,
  Star,
  ThumbsUp,
  ThumbsDown,
  Search,
  RefreshCcw,
} from "lucide-react";

type ParticipatingListing = {
  id: string;
  title: string;
  endsAt: number;
  currentBid: number;
  status: string;
  bids?: Array<{ bidderId: string }>;
  [key: string]: unknown;
};

type BidderOrder = {
  id: string;
  status: string;
  listingId?: string;
  listingTitle?: string;
  finalPrice?: number | string;
  sellerId?: string;
  sellerName?: string;
  [key: string]: unknown;
};

type OrderMessage = {
  id: number;
  orderId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  birthday?: string;
  address?: string;
  positiveReviews: number;
  totalReviews: number;
}

export default function AccountSettings() {
  const { user, updateProfile, getUserReviews, rateUser, changePassword } =
    useUser();
  const {
    getBidderOrders,
    updateOrderStatus,
    getOrderMessages,
    sendOrderMessage,
    getListingById,
  } = useListings();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [address, setAddress] = useState(user?.address || "");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [bidSearchTerm, setBidSearchTerm] = useState("");
  const [bidWinFilter, setBidWinFilter] = useState<string>("all");
  const [wonSearchTerm, setWonSearchTerm] = useState("");

  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState<
    Array<{
      rating: number;
      comment: string;
      reviewerId?: number;
      role?: string;
      createdAt?: string;
      [key: string]: unknown;
    }>
  >([]);

  const [participatingListings, setParticipatingListings] = useState<
    ParticipatingListing[]
  >([]);
  const [bidderOrders, setBidderOrders] = useState<BidderOrder[]>([]);

  const [activeTab, setActiveTab] = useState<string>("profile");

  const [wonStatusFilter, setWonStatusFilter] = useState<string>("all");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState<BidderOrder | null>(null);
  const [chatMessages, setChatMessages] = useState<OrderMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    if (user?.id) {
      void getUserReviews(user.id).then(setReviews);
    }
  }, [user, getUserReviews]);

  useEffect(() => {
    if (!user) return;

    void apiClient
      .get("/listings/participating")
      .then(({ data }) =>
        setParticipatingListings(Array.isArray(data) ? data : [])
      )
      .catch(() => setParticipatingListings([]));

    void (async () => {
      try {
        const data = await getBidderOrders();
        setBidderOrders(Array.isArray(data) ? data : []);
      } catch {
        setBidderOrders([]);
      }
    })();
  }, [user, getBidderOrders]);

  const openChatForOrder = async (order: BidderOrder) => {
    setChatOrder(order);
    setChatOpen(true);
    setChatBusy(true);
    try {
      const rows = await getOrderMessages(String(order.id));
      setChatMessages(Array.isArray(rows) ? rows : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const refreshChat = async () => {
    if (!chatOrder) return;
    setChatBusy(true);
    try {
      const rows = await getOrderMessages(String(chatOrder.id));
      setChatMessages(Array.isArray(rows) ? rows : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh messages",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  const sendChat = async () => {
    if (!chatOrder) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;

    setChatBusy(true);
    try {
      await sendOrderMessage(String(chatOrder.id), trimmed);
      setChatText("");
      await refreshChat();
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setChatBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl border shadow-sm max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="mb-6 text-muted-foreground">
            You need to log in to access your account settings.
          </p>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  // Get items user is currently bidding on
  const currentUserId = user?.userId ? String(user.userId) : user?.id || "";
  const myActiveBids = participatingListings.filter(
    (l) => l.status === "active"
  );

  // Filter by search terms + winning/outbid
  const filteredActiveBids = myActiveBids
    .filter((l) => l.title.toLowerCase().includes(bidSearchTerm.toLowerCase()))
    .filter((l) => {
      const isWinning =
        String(l.bids?.[0]?.bidderId || "") === String(currentUserId);
      if (bidWinFilter === "all") return true;
      if (bidWinFilter === "winning") return isWinning;
      if (bidWinFilter === "outbid") return !isWinning;
      return true;
    });

  const filteredWonOrders = bidderOrders
    .filter((o) =>
      String(o.listingTitle || "")
        .toLowerCase()
        .includes(wonSearchTerm.toLowerCase())
    )
    .filter(
      (o) => wonStatusFilter === "all" || String(o.status) === wonStatusFilter
    );

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id) {
      updateProfile(user.id, { name, email, birthday, address });
    }
    toast({ title: "Profile Updated", description: "Information saved." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || newPass.length < 6 || newPass !== confirmPass) {
      toast({
        title: "Error",
        description: "Check password fields.",
        variant: "destructive",
      });
      return;
    }

    if (user?.id) {
      try {
        await changePassword(user.id, currentPass, newPass);
        toast({
          title: "Password Changed",
          description: "Your password has been updated.",
        });
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      } catch {
        toast({
          title: "Failed",
          description: "Could not update password.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRateSeller = async (sellerId: string, rating: 1 | -1) => {
    if (!reviewComment) {
      toast({
        title: "Comment Required",
        description: "Please write a short review.",
        variant: "destructive",
      });
      return;
    }
    await rateUser(sellerId!, rating, reviewComment, "seller");
    toast({
      title: rating === 1 ? "Rated Positive (+1)" : "Rated Negative (-1)",
      description: `Review submitted.`,
    });
    setReviewComment("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Management</h1>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "won") {
              void (async () => {
                try {
                  const data = await getBidderOrders();
                  setBidderOrders(Array.isArray(data) ? data : []);
                } catch {
                  setBidderOrders([]);
                }
              })();
            }
          }}
        >
          <TabsList
            className={`mb-6 grid w-full ${
              user.role === "admin" ? "grid-cols-2" : "grid-cols-5"
            } max-w-3xl`}
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            {user.role !== "admin" && (
              <>
                <TabsTrigger value="bidding">My Bids</TabsTrigger>
                <TabsTrigger value="won">Won items</TabsTrigger>
                <TabsTrigger value="reviews">My Reviews</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* 1. Profile Update */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <User className="w-5 h-5" /> Personal Info
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

              <div className="grid grid-cols-4 gap-2">
                <div className="relative col-span-4 md:col-span-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search active bids..."
                    value={bidSearchTerm}
                    onChange={(e) => setBidSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={bidWinFilter} onValueChange={setBidWinFilter}>
                  <SelectTrigger className="bg-white col-span-4 md:col-span-1">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="winning">Winning</SelectItem>
                    <SelectItem value="outbid">Outbid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredActiveBids.length === 0 ? (
                <p className="text-muted-foreground">
                  {bidSearchTerm
                    ? "No active bids match your search."
                    : "You are not bidding on any active items."}
                </p>
              ) : (
                filteredActiveBids.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4 flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden shrink-0">
                        <img
                          src={
                            (getListingById(l.id)?.images || [])[0] ||
                            "https://placehold.co/200?text=No+Image"
                          }
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold hover:text-rose-600 transition">
                          <Link to={`/auction/${l.id}`}>{l.title}</Link>
                        </h3>
                        <p className="text-sm text-slate-500">
                          Ends: {new Date(l.endsAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">Current Price</p>
                        <p className="text-xl font-bold text-rose-600">
                          {l.currentBid.toLocaleString()}₫
                        </p>
                        {String(l.bids?.[0]?.bidderId || "") ===
                        currentUserId ? (
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
            <h2 className="text-xl font-bold mb-4">Won Items</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="relative flex col-span-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search won items..."
                    className="pl-9 w-full"
                    value={wonSearchTerm}
                    onChange={(e) => setWonSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={wonStatusFilter}
                  onValueChange={setWonStatusFilter}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_payment">
                      Awaiting Payment
                    </SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredWonOrders.length === 0 ? (
                <p className="text-muted-foreground p-4">
                  {wonSearchTerm
                    ? "No won items match your search."
                    : "No won auctions yet."}
                </p>
              ) : (
                filteredWonOrders.map((o) => (
                  <Card key={o.id}>
                    <CardHeader className="bg-slate-50 border-b py-3">
                      <span className="font-bold text-lg">
                        {o.listingTitle}
                      </span>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex justify-between gap-6 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Won Price
                          </p>
                          <p className="text-2xl font-bold text-rose-600">
                            {Number(o.finalPrice ?? 0).toLocaleString()}₫
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Status
                          </p>
                          <p className="font-semibold">
                            {formatOrderStatus(o.status)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Seller
                          </p>
                          <p className="font-semibold">{o.sellerName}</p>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            onClick={() => void openChatForOrder(o)}
                          >
                            Chat
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <OrderFulfillmentWizard
                          order={o}
                          userRole="bidder"
                          showChat={false}
                          onUpdate={async (
                            id: string,
                            status: string,
                            proof?: string,
                            shippingAddress?: string
                          ) => {
                            await updateOrderStatus(
                              id,
                              status,
                              proof,
                              shippingAddress
                            );
                            setBidderOrders((prev) =>
                              prev.map((x) =>
                                x.id === id ? { ...x, status } : x
                              )
                            );
                          }}
                        />

                        <div className="flex justify-end mt-4">
                          {["delivered", "completed"].includes(
                            String(o.status)
                          ) &&
                            o.sellerId && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline">
                                    <Star className="w-4 h-4 mr-2" /> Rate
                                    Seller
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rate Transaction</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <p className="text-sm text-slate-600">
                                      Please rate your experience with{" "}
                                      <strong>{o.sellerName}</strong>.
                                    </p>
                                    <Textarea
                                      placeholder="Write your review here (Required)..."
                                      value={reviewComment}
                                      onChange={(e) =>
                                        setReviewComment(e.target.value)
                                      }
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="destructive"
                                        onClick={() =>
                                          void handleRateSeller(
                                            String(o.sellerId),
                                            -1
                                          )
                                        }
                                      >
                                        <ThumbsDown className="w-4 h-4 mr-2" />
                                        -1 Negative
                                      </Button>
                                      <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() =>
                                          void handleRateSeller(
                                            String(o.sellerId),
                                            1
                                          )
                                        }
                                      >
                                        <ThumbsUp className="w-4 h-4 mr-2" />
                                        +1 Positive
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Sheet
              modal={false}
              open={chatOpen}
              onOpenChange={(open) => {
                setChatOpen(open);
                if (!open) {
                  setChatOrder(null);
                  setChatMessages([]);
                  setChatText("");
                }
              }}
            >
              <SheetContent
                side="right"
                hideOverlay
                className="top-24 right-4 bottom-auto h-auto max-h-168 z-40 flex flex-col rounded-l-2xl"
              >
                <SheetHeader>
                  <SheetTitle className="pr-10 truncate">
                    Chat
                    {chatOrder?.listingTitle
                      ? `: ${chatOrder.listingTitle}`
                      : ""}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 min-h-0 flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      {chatOrder ? `Order #${chatOrder.id}` : ""}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refreshChat()}
                      disabled={!chatOrder || chatBusy}
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <hr />
                  <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-white p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-slate-500">No messages yet.</p>
                    ) : (
                      chatMessages.map((m) => {
                        const mine =
                          Number(m.senderId) ===
                          Number(user?.userId ?? user?.id);
                        return (
                          <div
                            key={m.id}
                            className={mine ? "text-right" : "text-left"}
                          >
                            <div className="text-xs text-primary">
                              {m.senderName}
                            </div>
                            <div
                              className={
                                "inline-block rounded-2xl px-3 py-2 text-sm border " +
                                (mine ? "bg-slate-50" : "bg-white")
                              }
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void sendChat();
                      }}
                    />
                    <Button
                      onClick={() => void sendChat()}
                      disabled={!chatOrder || !chatText.trim() || chatBusy}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </TabsContent>

          {/* 4. My Reviews */}
          <TabsContent value="reviews">
            <h2 className="text-xl font-bold mb-4">My Reviews</h2>
            <div className="space-y-4">
              {/* Rating Summary */}
              {reviews.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Rating Summary</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-rose-600">
                        {Math.round(
                          (reviews.filter((r) => r.rating === 1).length /
                            reviews.length) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-slate-600">
                        <p>
                          <span className="font-semibold">
                            {reviews.filter((r) => r.rating === 1).length}
                          </span>{" "}
                          positive
                        </p>
                        <p>
                          <span className="font-semibold">
                            {reviews.filter((r) => r.rating === -1).length}
                          </span>{" "}
                          negative
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Total: {reviews.length} reviews
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reviews.length === 0 ? (
                <p className="text-muted-foreground p-4">No reviews yet.</p>
              ) : (
                reviews.map((rev, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg">
                            User #{rev.reviewerId}{" "}
                            <span className="text-sm font-normal text-slate-500">
                              ({rev.role})
                            </span>
                          </p>
                          <p className="text-xs text-slate-400">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        {rev.rating === 1 ? (
                          <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-1.5 rounded">
                            <ThumbsUp className="w-4 h-4 mr-1" /> Positive
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 text-sm font-bold bg-red-50 px-3 py-1.5 rounded">
                            <ThumbsDown className="w-4 h-4 mr-1" /> Negative
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700">"{rev.comment}"</p>
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
