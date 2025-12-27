import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Trash2,
  Shield,
  Plus,
  ArrowLeft,
  User as UserIcon,
} from "lucide-react";
import { Listing } from "../context/ListingsContext";
import { SellerRequest } from "../context/SellerRequestsContext";
import { Category } from "../context/CategoriesContext";

interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  status?: string;
}

interface AdminDashboardPageProps {
  user: { type: string; id: string } | null;
  requests: SellerRequest[];
  listings: Listing[];
  categories: Category[];
  users: User[];
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onDeleteListing: (id: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
  onBanUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onNavigateHome: () => void;
  onNavigateBack: () => void;
}

export default function AdminDashboardPage({
  user,
  requests,
  listings,
  categories,
  users,
  onApproveRequest,
  onRejectRequest,
  onDeleteListing,
  onAddCategory,
  onDeleteCategory,
  onBanUser,
  onDeleteUser,
  onNavigateHome,
  onNavigateBack,
}: AdminDashboardPageProps) {
  const [newCatName, setNewCatName] = useState("");

  if (!user || user.type !== "admin") {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <Button onClick={onNavigateHome}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onNavigateBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" /> Admin Dashboard
          </h1>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="requests">Seller Requests</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>{" "}
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          {/* Seller Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-slate-50 font-medium">
                Pending Approvals
              </div>
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No pending requests.
                </div>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-4 flex items-center justify-between border-b last:border-0"
                    >
                      <div>
                        <p className="font-bold">{req.businessName}</p>
                        <p className="text-sm text-slate-500">
                          User: {req.userName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600"
                          onClick={() => onApproveRequest(req.id)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRejectRequest(req.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </TabsContent>
          {/* User Management Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-slate-50 font-medium flex justify-between">
                <span>System Users</span>
                <span className="text-xs text-slate-500 self-center">
                  Total: {users.length}
                </span>
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {u.name}{" "}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border">
                          {u.type}
                        </span>
                      </p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.status === "banned" ? (
                      <span className="text-red-600 font-bold text-sm mr-2">
                        BANNED
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBanUser(u.id)}
                      >
                        Ban
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => onDeleteUser(u.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm divide-y">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 flex justify-between items-center"
                >
                  <span className="font-medium">
                    {l.title} (Seller: {l.sellerName})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => onDeleteListing(l.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="New Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Button
                  onClick={() => {
                    onAddCategory(newCatName);
                    setNewCatName("");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 border rounded"
                  >
                    <span>{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteCategory(cat.id, cat.name)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
