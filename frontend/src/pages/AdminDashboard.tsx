import { useState, useEffect } from "react";

import { useSellerRequests } from "../context/SellerRequestsContext";
import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { useCategories } from "../context/CategoriesContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Check,
  X,
  Trash2,
  Shield,
  Plus,
  ArrowLeft,
  User as UserIcon,
  Pencil,
  Search,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Category } from "../context/CategoriesContext";

export default function AdminDashboard() {
  const { user, getAllUsers, banUser, unbanUser, deleteUser } = useUser();
  const { requests, loadRequests, approveRequest, rejectRequest } =
    useSellerRequests();
  const { listings, deleteListing } = useListings();
  const {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    loadCategories,
  } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newCatName, setNewCatName] = useState("");
  const [newCatSubs, setNewCatSubs] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      role: string;
      status: string;
      name: string;
      email: string;
      userId?: number;
      [key: string]: unknown;
    }>
  >([]);

  // Search States
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [catSearch, setCatSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("requests");

  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === "requests" && !requestsLoaded) {
      void loadRequests();
      setRequestsLoaded(true);
    }
  }, [activeTab, requestsLoaded, loadRequests]);

  useEffect(() => {
    if (activeTab === "categories" && !categoriesLoaded) {
      void loadCategories();
      setCategoriesLoaded(true);
    }
  }, [activeTab, categoriesLoaded, loadCategories]);

  useEffect(() => {
    if (user?.role === "admin") {
      void getAllUsers().then((data) => {
        const mapped = data.map((u) => ({
          ...u,
          id: String(u.userId),
          role: u.role,
          status: u.status || "active",
        }));
        setUsers(mapped);
      });
    }
  }, [user, getAllUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredListings = listings
    .filter(
      (l) =>
        l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.sellerName.toLowerCase().includes(listingSearch.toLowerCase())
    )
    .filter(
      (l) => listingStatusFilter === "all" || l.status === listingStatusFilter
    );

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
      (c.subcategories || []).some((sub) =>
        sub.name.toLowerCase().includes(catSearch.toLowerCase())
      )
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  const handleDeleteCategory = (id: string, name: string) => {
    const hasProducts = listings.some(
      (l) => l.category === name || l.categories.includes(name)
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

  const handleBanUser = async (userId: string) => {
    await banUser(userId);
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: "banned" } : u))
    );
    toast({ title: "User Banned", description: "User access restricted" });
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
    );
    toast({ title: "User Unbanned", description: "User access restored" });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    setUsers(users.filter((u) => u.id !== userId));
    toast({
      title: "User Deleted",
      description: "Account removed permanently",
    });
  };

  const EditCategoryDialog = ({
    category,
    trigger,
  }: {
    category: Category;
    trigger?: React.ReactNode;
  }) => {
    const [name, setName] = useState(category.name);
    const [subcats, setSubcats] = useState(
      (category.subcategories || []).map((s) => s.name).join(", ")
    );
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
      const subList = subcats
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      updateCategory(category.id, {
        name,
        subcategories: subList.map((s, i) => ({ id: `temp-${i}`, name: s })),
      });
      setIsOpen(false);
      toast({ title: "Category Updated" });
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4 text-slate-400" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subcategories (seperate by comma)</Label>
              <Input
                value={subcats}
                onChange={(e) => setSubcats(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const UserDetailDialog = ({
    user,
  }: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      [key: string]: unknown;
    };
  }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded transition-colors group">
          <p className="font-medium group-hover:underline text-rose-600">
            {user.name}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 border text-slate-900 no-underline inline-block">
              {user.role}
            </span>
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground">User ID</Label>
            <div className="font-mono text-sm">{user.id}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground">Name</Label>
            <div>{user.name}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground">Email</Label>
            <div>{user.email}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground">Account Role</Label>
            <div className="capitalize">{user.role}</div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground">Status</Label>
            <div>
              <Badge
                variant={user.status === "banned" ? "destructive" : "outline"}
              >
                {user.status}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-rose-600" /> Admin Dashboard
          </h1>
        </div>

        <Tabs
          defaultValue="requests"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full h-full grid-cols-2 md:grid-cols-4 max-w-2xl">
            <TabsTrigger value="requests">Seller Requests</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>{" "}
            <TabsTrigger value="listings">Manage Listings</TabsTrigger>
            <TabsTrigger value="categories">Manage Categories</TabsTrigger>
          </TabsList>
          {/* Seller Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Seller Requests</h2>
            <div className="space-y-4">
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <p className="text-muted-foreground p-4">
                  No pending requests.
                </p>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <Card key={req.id}>
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <p className="font-bold">{req.businessName}</p>
                          <p className="text-sm text-slate-500">
                            User: {req.userName || "Unknown"}
                          </p>
                          {req.businessDescription && (
                            <p className="text-sm text-slate-600 mt-1">
                              {req.businessDescription}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:cursor-pointer"
                            onClick={async () => {
                              try {
                                await approveRequest(req.id, user.id);
                                toast({
                                  title: "Approved",
                                  description: "User is now a seller",
                                });
                              } catch {
                                toast({
                                  title: "Error",
                                  description: "Failed to approve request",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="hover:cursor-pointer"
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Reject Seller Request?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reject the user's application to
                                  become a seller.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={async () => {
                                    try {
                                      await rejectRequest(
                                        req.id,
                                        user.id,
                                        "Admin Rejected"
                                      );
                                      toast({
                                        title: "Rejected",
                                        description:
                                          "Seller request has been rejected",
                                        variant: "destructive",
                                      });
                                    } catch {
                                      toast({
                                        title: "Error",
                                        description: "Failed to reject request",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
          {/* User Management Tab */}
          <TabsContent value="users" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Manage Users</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="relative flex col-span-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9 w-full"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={userRoleFilter}
                  onValueChange={setUserRoleFilter}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="bidder">Bidder</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground p-4">
                  {userSearch
                    ? "No users match your search."
                    : "No users found."}
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <UserDetailDialog user={u} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.status === "banned" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="bg-green-50 hover:bg-green-100 text-green-700"
                                size="sm"
                              >
                                Unban
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unban User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will restore the user's access to the
                                  platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUnbanUser(u.id)}
                                >
                                  Unban User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="hover:text-primary hover:bg-rose-50"
                                size="sm"
                              >
                                Ban
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ban User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This user will be unable to log in or perform
                                  actions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleBanUser(u.id)}
                                >
                                  Ban User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The user account
                                will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Manage Listings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="relative col-span-4 md:col-span-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search listings..."
                    className="pl-9"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={listingStatusFilter}
                  onValueChange={setListingStatusFilter}
                >
                  <SelectTrigger className="bg-white col-span-4 md:col-span-1">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filteredListings.length === 0 ? (
                <p className="text-muted-foreground p-4">
                  {listingSearch
                    ? "No listings match your search."
                    : "No listings found."}
                </p>
              ) : (
                filteredListings.map((l) => (
                  <Card key={l.id}>
                    <CardContent className="p-4 flex gap-4 items-center">
                      <div
                        className="w-20 h-20 rounded-md bg-gray-200 overflow-hidden shrink-0 cursor-pointer"
                        onClick={() => navigate(`/auction/${l.id}`)}
                      >
                        <img
                          src={
                            l.images && l.images.length > 0
                              ? l.images[0]
                              : "https://placehold.co/200?text=No+Image"
                          }
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/auction/${l.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-rose-600 hover:underline">
                            {l.title}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {l.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Seller: {l.sellerName}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          Current: {Number(l.currentBid || 0).toLocaleString()}₫
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the listing permanently from the
                              platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                deleteListing(l.id);
                                toast({ title: "Listing Removed" });
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Input
                      placeholder="New Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <Input
                      placeholder="Icon (emoji or text)"
                      className="w-24 md:w-32"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                    />
                    <Input
                      placeholder="Subcategories (seperate by comma)"
                      value={newCatSubs}
                      onChange={(e) => setNewCatSubs(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        const subs = newCatSubs
                          .split(",")
                          .map((Is) => Is.trim())
                          .filter(Boolean);
                        addCategory(
                          newCatName,
                          "Desc",
                          newCatIcon || "📦",
                          subs.map((s) => ({ id: "0", name: s }))
                        );
                        setNewCatName("");
                        setNewCatSubs("");
                        setNewCatIcon("");
                        toast({ title: "Category Added" });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  className="pl-9"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                />
              </div>
              {filteredCategories.length === 0 ? (
                <p className="text-muted-foreground p-4">
                  {catSearch
                    ? "No categories match your search."
                    : "No categories found."}
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredCategories.map((cat) => (
                    <Card key={cat.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex flex-col">
                          <EditCategoryDialog
                            category={cat}
                            trigger={
                              <span className="font-medium cursor-pointer hover:underline text-rose-600 w-fit">
                                {cat.name}
                              </span>
                            }
                          />
                          {cat.subcategories &&
                            cat.subcategories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cat.subcategories.map((sub) => (
                                  <Badge
                                    key={sub.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {sub.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <EditCategoryDialog category={cat} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-slate-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              {listings.some(
                                (l) =>
                                  l.category === cat.name ||
                                  l.categories.includes(cat.name)
                              ) ? (
                                <>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Cannot Delete Category
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This category contains active products.
                                      Please remove the products first.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </>
                              ) : (
                                <>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Category?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete{" "}
                                      <strong>{cat.name}</strong>?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() =>
                                        handleDeleteCategory(cat.id, cat.name)
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </>
                              )}
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
