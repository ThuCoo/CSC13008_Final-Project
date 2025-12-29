import { useState } from "react";

import { useSellerRequests } from "../context/SellerRequestsContext";
import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { useCategories } from "../context/CategoriesContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Check,
  X,
  Trash2,
  Shield,
  Plus,
  ArrowLeft,
  User as UserIcon,
} from "lucide-react"; // Added ArrowLeft, UserIcon
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Mock Users for Admin Management (Since UserContext doesn't hold all users)
const MOCK_ALL_USERS = [
  {
    id: "1",
    name: "John Buyer",
    email: "buyer..example.com",
    type: "buyer",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Seller",
    email: "seller..example.com",
    type: "seller",
    status: "active",
  },
  {
    id: "3",
    name: "Bad Actor",
    email: "bad..example.com",
    type: "buyer",
    status: "banned",
  },
];

export default function AdminDashboard() {
  const { user } = useUser();
  const { requests, approveRequest, rejectRequest } = useSellerRequests();
  const { listings, deleteListing } = useListings();
  const { categories, addCategory, deleteCategory } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newCatName, setNewCatName] = useState("");
  const [users, setUsers] = useState(MOCK_ALL_USERS); // Local state for demo

  if (!user || user.type !== "admin") {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  const handleDeleteCategory = (id: string, name: string) => {
    const hasProducts = listings.some(
      (l) => l.category === name || l.categories.includes(name),
    );
    if (hasProducts) {
      toast({
        title: "Deletion Blocked",
        description: "Cannot delete category containing active products",
        variant: "destructive",
      });
      return;
    }
    deleteCategory(id);
    toast({ title: "Category Deleted" });
  };

  const handleBanUser = (userId: string) => {
    // Future: call API to ban the user
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: "banned" } : u)),
    );
    toast({ title: "User Banned", description: "User access restricted" });
  };

  const handleDeleteUser = (userId: string) => {
    // Future: Remove user
    setUsers(users.filter((u) => u.id !== userId));
    toast({
      title: "User Deleted",
      description: "Account removed permanently",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
                          onClick={() => {
                            approveRequest(req.id, user.id);
                            toast({
                              title: "Approved",
                              description: "User is now a seller",
                            });
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            rejectRequest(req.id, user.id, "Admin Rejected")
                          }
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
                        onClick={() => handleBanUser(u.id)}
                      >
                        Ban
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteUser(u.id)}
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
                    onClick={() => {
                      deleteListing(l.id);
                      toast({ title: "Listing Removed" });
                    }}
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
                    addCategory(newCatName, "Desc", "📦");
                    setNewCatName("");
                    toast({ title: "Category Added" });
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
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
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
