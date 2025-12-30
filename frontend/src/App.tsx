import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context Providers
import { UserProvider } from "./context/UserContext";
import { ListingsProvider } from "./context/ListingsContext";
import { SellerRequestsProvider } from "./context/SellerRequestsContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { AutoBidsProvider } from "./context/AutoBidsContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { BiddingRulesProvider } from "./context/BiddingRulesContext";

// Global Layout Components
import Footer from "./components/Footer";
import Header from "./components/Header";

// Pages (The UI Layer)
import HomePage from "./pages/HomePage";
import Browse from "./pages/Browse";
import Categories from "./pages/Categories";
import AuctionDetail from "./pages/AuctionDetail";
import Selling from "./pages/Selling";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import CreateListing from "./pages/CreateListing";
import SellerDashboard from "./pages/SellerDashboard";
import SalesHistory from "./pages/SalesHistory";
import ContactSeller from "./pages/ContactSeller";
import Support from "./pages/Support";
import AccountSettings from "./pages/AccountSettings";
import AdminDashboard from "./pages/AdminDashboard";
import BecomeSeller from "./pages/BecomeSeller";
import Watchlist from "./pages/Watchlist";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CategoriesProvider>
          <BiddingRulesProvider>
            <ListingsProvider>
              <SellerRequestsProvider>
                <WatchlistProvider>
                  <AutoBidsProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                      <Header/>
                        <div className="flex flex-col min-h-screen">
                          <div className="flex-grow">
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/" element={<HomePage />} />
                              <Route path="/browse" element={<Browse />} />
                              <Route
                                path="/categories"
                                element={<Categories />}
                              />
                              <Route
                                path="/auction/:id"
                                element={<AuctionDetail />}
                              />
                              <Route path="/selling" element={<Selling />} />
                              <Route path="/support" element={<Support />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/cookie-policy" element={<CookiePolicy />} />

                              {/* Auth Routes */}
                              <Route path="/login" element={<Login />} />
                              <Route path="/signup" element={<SignUp />} />
                              <Route
                                path="/forgot-password"
                                element={<ForgotPassword />}
                              />

                              {/* Protected / User Routes */}
                              <Route
                                path="/account-settings"
                                element={<AccountSettings />}
                              />
                              <Route
                                path="/watchlist"
                                element={<Watchlist />}
                              />
                              <Route
                                path="/contact-seller/:id"
                                element={<ContactSeller />}
                              />
                              <Route
                                path="/become-seller"
                                element={<BecomeSeller />}
                              />

                              {/* Seller Routes */}
                              <Route
                                path="/create-listing"
                                element={<CreateListing />}
                              />
                              <Route
                                path="/seller-dashboard"
                                element={<SellerDashboard />}
                              />
                              <Route
                                path="/sales-history"
                                element={<SalesHistory />}
                              />

                              {/* Admin Routes */}
                              <Route
                                path="/admin-dashboard"
                                element={<AdminDashboard />}
                              />

                              {/* 404 */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </div>
                          <Footer />
                        </div>
                      </BrowserRouter>
                    </TooltipProvider>
                  </AutoBidsProvider>
                </WatchlistProvider>
              </SellerRequestsProvider>
            </ListingsProvider>
          </BiddingRulesProvider>
        </CategoriesProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
