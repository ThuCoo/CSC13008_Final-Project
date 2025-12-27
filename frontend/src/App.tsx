import { useState, useMemo } from "react";
import { Route, Routes, useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import BrowsePage from "./pages/Browse";
import AuctionDetailPage from "./pages/AuctionDetail";
import SellerDashboardPage from "./pages/SellerDashboard";
import CreateListingPage from "./pages/CreateListing";
import AdminDashboardPage from "./pages/AdminDashboard";
import AccountSettingsPage from "./pages/AccountSettings";
import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import WatchlistPage from "./pages/Watchlist";
import CategoriesPage from "./pages/Categories";
import SellingPage from "./pages/Selling";
import SupportPage from "./pages/Support";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ContactSellerPage from "./pages/ContactSeller";
import SalesHistoryPage from "./pages/SalesHistory";
import BecomeSellerPage from "./pages/BecomeSeller";
import { UserProvider, useUser, MOCK_USERS } from "./context/UserContext";
import { ListingsProvider, useListings, Listing } from "./context/ListingsContext";
import { SellerRequestsProvider, useSellerRequests } from "./context/SellerRequestsContext";
import { CategoriesProvider, useCategories } from "./context/CategoriesContext";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";

// --- Route Components ---

function HomeRoute() {
  const { getTop5ClosingSoon, getTop5MostBids, getTop5HighestPrice } = useListings();
  const closingSoon = getTop5ClosingSoon();
  const mostBids = getTop5MostBids();
  const highestPrice = getTop5HighestPrice();

  return (
    <HomePage
      closingSoon={closingSoon}
      mostBids={mostBids}
      highestPrice={highestPrice}
    />
  );
}

function BrowseRoute() {
  const { listings, getListingsByCategory } = useListings();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get("cat") || "";
  const initialSub = searchParams.get("sub") || "";
  const initialSearch = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "ending_soon";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  // Derive filtered listings
  const filteredListings = useMemo(() => {
    let result = initialCat ? getListingsByCategory(initialCat) : listings;

    if (initialSub) {
      result = result.filter(l => l.subCategory === initialSub);
    }

    if (search) {
      result = result.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort logic (simplified)
    if (sort === "ending_soon") {
      result = [...result].sort((a, b) => a.endsAt - b.endsAt);
    } else if (sort === "price_low") {
      result = [...result].sort((a, b) => a.currentBid - b.currentBid);
    } else if (sort === "price_high") {
      result = [...result].sort((a, b) => b.currentBid - a.currentBid);
    }

    return result;
  }, [listings, getListingsByCategory, initialCat, initialSub, search, sort]);

  // Pagination (mock)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice((initialPage - 1) * itemsPerPage, initialPage * itemsPerPage);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchParams({ ...Object.fromEntries(searchParams), q: val, page: "1" });
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    setSearchParams({ ...Object.fromEntries(searchParams), sort: val });
  };

  const handleCategoryClick = (cat: string, sub?: string) => {
    const params: any = { cat, page: "1" };
    if (sub) params.sub = sub;
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(page) });
  };

  return (
    <BrowsePage
      filteredListings={paginatedListings}
      initialCat={initialCat}
      initialSub={initialSub}
      page={initialPage}
      totalPages={totalPages}
      search={search}
      sort={sort}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      onCategoryClick={handleCategoryClick}
      onPageChange={handlePageChange}
    />
  );
}

function AuctionDetailRoute() {
  const { id } = useParams();
  const { getListingById, placeBid, getListingsByCategory, addQuestion, answerQuestion, rejectBidder } = useListings();
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  const listing = getListingById(id || "");
  const relatedProducts = listing ? getListingsByCategory(listing.category).filter(l => l.id !== listing.id).slice(0, 5) : [];

  const [bidAmount, setBidAmount] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  if (!listing) return <NotFound />;

  const isSeller = user?.id === listing.sellerId;

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      placeBid(listing.id, user.id, user.name, Number(bidAmount));
      toast({ title: "Bid placed successfully!" });
      setBidAmount("");
    } catch (error: any) {
      toast({ title: "Failed to place bid", description: error.message, variant: "destructive" });
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    addQuestion(listing.id, user.id, user.name, questionText);
    setQuestionText("");
    toast({ title: "Question posted" });
  };

  const handleAnswerQuestion = (qId: string) => {
    answerQuestion(listing.id, qId, answerText);
    setAnswerText("");
    toast({ title: "Answer posted" });
  };

  return (
    <AuctionDetailPage
      listing={listing}
      user={user ? { id: user.id, name: user.name } : null}
      relatedProducts={relatedProducts}
      isSeller={isSeller}
      bidAmount={bidAmount}
      setBidAmount={setBidAmount}
      questionText={questionText}
      setQuestionText={setQuestionText}
      answerText={answerText}
      setAnswerText={setAnswerText}
      onRejectBidder={(bidderId) => {
        rejectBidder(listing.id, bidderId);
        toast({ title: "Bidder rejected" });
      }}
      onPlaceBid={handlePlaceBid}
      onAskQuestion={handleAskQuestion}
      onAnswerQuestion={handleAnswerQuestion}
      onNavigateBack={() => navigate(-1)}
      onNavigateLogin={() => navigate("/login")}
    />
  );
}

function SellerDashboardRoute() {
  const { user } = useUser();
  const { getSellerListings, updateListing } = useListings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appendDesc, setAppendDesc] = useState("");

  if (!user || user.type !== "seller") {
    // Ideally redirect or show auth wrapper logic, but page handles auth check visually too
    return <SellerDashboardPage
      user={user as any}
      activeListings={[]}
      soldListings={[]}
      appendDesc=""
      setAppendDesc={() => {}}
      selectedId={null}
      setSelectedId={() => {}}
      onAppendDescription={() => {}}
      onNavigateSalesHistory={() => navigate("/sales-history")}
      onNavigateCreateListing={() => navigate("/create-listing")}
    />;
  }

  const myListings = getSellerListings(user.id);
  const activeListings = myListings.filter(l => l.status === "active");
  const soldListings = myListings.filter(l => l.status === "sold");

  const handleAppendDescription = () => {
    if (selectedId && appendDesc) {
      const listing = myListings.find(l => l.id === selectedId);
      if (listing) {
        updateListing(selectedId, { description: listing.description + "\n\nUpdate: " + appendDesc });
        setAppendDesc("");
        toast({ title: "Description updated" });
      }
    }
  };

  return (
    <SellerDashboardPage
      user={user}
      activeListings={activeListings}
      soldListings={soldListings}
      appendDesc={appendDesc}
      setAppendDesc={setAppendDesc}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      onAppendDescription={handleAppendDescription}
      onNavigateSalesHistory={() => navigate("/sales-history")}
      onNavigateCreateListing={() => navigate("/create-listing")}
    />
  );
}

function CreateListingRoute() {
  const { user } = useUser();
  const { createListing } = useListings();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startingPrice: "",
    stepPrice: "",
    buyNowPrice: "",
    shippingCost: "",
    autoExtend: false,
  });

  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      createListing({
        sellerId: user.id,
        sellerName: user.name,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startingPrice: Number(formData.startingPrice),
        stepPrice: Number(formData.stepPrice),
        buyNowPrice: formData.buyNowPrice ? Number(formData.buyNowPrice) : undefined,
        shippingCost: Number(formData.shippingCost),
        images: images.length > 0 ? images : ["https://placehold.co/600x400/png"],
        endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        categories: [formData.category],
        condition: "New",
        imageColor: "from-blue-400 to-blue-600",
        returns: "30 days"
      });
      toast({ title: "Listing created!" });
      navigate("/seller-dashboard");
    } catch (err) {
      toast({ title: "Failed to create listing", variant: "destructive" });
    }
  };

  return (
    <CreateListingPage
      formData={formData}
      setFormData={setFormData}
      images={images}
      setImages={setImages}
      categories={categories}
      onSubmit={handleSubmit}
      onAddMockImage={() => setImages([...images, "https://placehold.co/600x400/png"])}
      onNavigateBecomeSeller={() => navigate("/become-seller")}
      isSellerApproved={user?.sellerApproved || false}
    />
  );
}

function AdminDashboardRoute() {
  const { user } = useUser();
  const { requests, approveRequest, rejectRequest } = useSellerRequests();
  const { listings, deleteListing } = useListings();
  const { categories, addCategory, deleteCategory } = useCategories();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <AdminDashboardPage
      user={user ? { id: user.id, type: user.type } : null}
      requests={requests}
      listings={listings}
      categories={categories}
      users={MOCK_USERS}
      onApproveRequest={(id) => { if(user) approveRequest(id, user.id); toast({ title: "Request Approved" }); }}
      onRejectRequest={(id) => { if(user) rejectRequest(id, user.id, "Rejected by Admin"); toast({ title: "Request Rejected" }); }}
      onDeleteListing={(id) => { deleteListing(id); toast({ title: "Listing Deleted" }); }}
      onAddCategory={(name) => { addCategory(name, "Description", "Icon"); toast({ title: "Category Added" }); }}
      onDeleteCategory={(id) => { deleteCategory(id); toast({ title: "Category Deleted" }); }}
      onBanUser={(id) => toast({ title: `User ${id} banned (mock)` })}
      onDeleteUser={(id) => toast({ title: `User ${id} deleted (mock)` })}
      onNavigateHome={() => navigate("/")}
      onNavigateBack={() => navigate(-1)}
    />
  );
}

function AccountSettingsRoute() {
  const { user, updateProfile, changePassword } = useUser();
  const { getActiveBiddingListings } = useListings();
  
  const activeBids = user ? getActiveBiddingListings(user.id) : [];
  const wonItems: Listing[] = [];

  const { toast } = useToast();

  return (
    <AccountSettingsPage
      user={user ? { ...user, positiveReviews: 10, totalReviews: 12 } : null}
      activeBids={activeBids}
      wonItems={wonItems}
      onUpdateProfile={(data) => {
        if (user) updateProfile(user.id, data);
        toast({ title: "Profile updated" });
      }}
      onChangePassword={(curr, newP) => {
        if (user) changePassword(user.id, curr, newP);
        toast({ title: "Password updated" });
      }}
      onRateSeller={() => toast({ title: "Rating submitted" })}
    />
  );
}

function LoginRoute() {
  const { login } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const success = login(formData.email, formData.password);
      setIsLoading(false);
      if (success) {
        toast({ title: "Login successful" });
        navigate("/");
      } else {
        toast({ title: "Invalid credentials", variant: "destructive" });
      }
    }, 1000);
  };

  const handleDemoLogin = (email: string, pass: string) => {
    login(email, pass);
    navigate("/");
  };

  return (
    <LoginPage
      formData={formData}
      isLoading={isLoading}
      onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
      onSubmit={handleSubmit}
      onDemoLogin={handleDemoLogin}
    />
  );
}

function SignUpRoute() {
  const { signup } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      signup({ name: formData.name, email: formData.email, password: formData.password });
      setIsLoading(false);
      toast({ title: "Account created!" });
      navigate("/");
    }, 1000);
  };

  return (
    <SignUpPage
      formData={formData}
      isLoading={isLoading}
      onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
      onSubmit={handleSubmit}
    />
  );
}

function WatchlistRoute() {
  const { user } = useUser();
  const watchlistItems: Listing[] = []; 
  return <WatchlistPage user={user} watchlistItems={watchlistItems} onRemove={() => {}} />;
}

function SellingRoute() {
  const { user } = useUser();
  return <SellingPage user={user} />;
}

// -- New Routes Handlers --

function ForgotPasswordRoute() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    toast({ title: "OTP Sent to " + email });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Password Reset Successfully" });
    navigate("/login");
  };

  return (
    <ForgotPasswordPage
      step={step}
      email={email}
      setEmail={setEmail}
      otp={otp}
      setOtp={setOtp}
      onSendOTP={handleSendOTP}
      onVerifyOTP={handleVerifyOTP}
      onResetPassword={handleResetPassword}
    />
  );
}

function ContactSellerRoute() {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get("listingId") || "";
  const { getListingById } = useListings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const listing = getListingById(listingId);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    toast({ title: "Message sent to seller" });
    navigate(-1);
  };

  return (
    <ContactSellerPage
      listing={listing}
      message={message}
      setMessage={setMessage}
      onSend={handleSend}
    />
  );
}

function SalesHistoryRoute() {
  const { user } = useUser();
  const { getSellerListings } = useListings();
  const myListings = user ? getSellerListings(user.id) : [];
  const sales = myListings.filter(l => l.status === "sold"); // Simplified logic
  const [orderSteps, setOrderSteps] = useState<Record<string, number>>({});

  const handleAdvance = (id: string, step: number) => {
    setOrderSteps(prev => ({ ...prev, [id]: step + 1 }));
  };

  const handleCancel = (id: string) => {
    setOrderSteps(prev => ({ ...prev, [id]: -1 }));
  };

  return (
    <SalesHistoryPage
      user={user}
      sales={sales}
      orderSteps={orderSteps}
      onAdvanceOrderStep={handleAdvance}
      onCancelTransaction={handleCancel}
    />
  );
}

function BecomeSellerRoute() {
  const { user } = useUser();
  const { createSellerRequest, getRequestByUserId } = useSellerRequests();
  const existingRequest = user ? getRequestByUserId(user.id) : null;
  const { toast } = useToast();

  const [formData, setFormData] = useState({ businessName: "", businessDescription: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      createSellerRequest({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
      });
      toast({ title: "Request submitted" });
    }
  };

  return (
    <BecomeSellerPage
      user={user}
      existingRequest={existingRequest}
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
    />
  );
}

// --- Main App Component ---

function App() {
  return (
    <UserProvider>
      <SellerRequestsProvider>
        <ListingsProvider>
          <CategoriesProvider>
            <Header />
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/browse" element={<BrowseRoute />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/auction/:id" element={<AuctionDetailRoute />} />
              <Route path="/selling" element={<SellingRoute />} />
              <Route path="/become-seller" element={<BecomeSellerRoute />} />
              <Route path="/create-listing" element={<CreateListingRoute />} />
              <Route path="/seller-dashboard" element={<SellerDashboardRoute />} />
              <Route path="/admin-dashboard" element={<AdminDashboardRoute />} />
              <Route path="/account-settings" element={<AccountSettingsRoute />} />
              <Route path="/watchlist" element={<WatchlistRoute />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/signup" element={<SignUpRoute />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
              <Route path="/contact-seller" element={<ContactSellerRoute />} />
              <Route path="/sales-history" element={<SalesHistoryRoute />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            <Toaster />
          </CategoriesProvider>
        </ListingsProvider>
      </SellerRequestsProvider>
    </UserProvider>
  );
}

export default App;
