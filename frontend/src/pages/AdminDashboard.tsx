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

// Mock Users
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
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newCatName, setNewCatName] = useState("");
  const [newCatSubs, setNewCatSubs] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [users, setUsers] = useState(MOCK_ALL_USERS);

  // Search States
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(listingSearch.toLowerCase()) || 
    l.sellerName.toLowerCase().includes(listingSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(catSearch.toLowerCase()) || 
    (c.subcategories || []).some(sub => sub.toLowerCase().includes(catSearch.toLowerCase()))
  );

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
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, status: "banned" } : u)),
    );
    toast({ title: "User Banned", description: "User access restricted" });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast({
      title: "User Deleted",
      description: "Account removed permanently",
    });
  };

  const EditCategoryDialog = ({ category, trigger }: { category: Category, trigger?: React.ReactNode }) => {
    const [name, setName] = useState(category.name);
    const [subcats, setSubcats] = useState(
      (category.subcategories || []).join(", ")
    );
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
       const subList = subcats.split(",").map(s => s.trim()).filter(Boolean);
       updateCategory(category.id, { name, subcategories: subList });
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
               <Input value={name} onChange={e => setName(e.target.value)} />
             </div>
             <div className="space-y-2">
               <Label>Subcategories (seperate by comma)</Label>
               <Input value={subcats} onChange={e => setSubcats(e.target.value)} />
             </div>
          </div>
          <DialogFooter>
             <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const UserDetailDialog = ({ user }: { user: typeof MOCK_ALL_USERS[0] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded transition-colors group">
          <p className="font-medium group-hover:underline text-rose-600">
            {user.name}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 border text-slate-900 no-underline inline-block">
              {user.type}
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
             <Label className="text-muted-foreground">Account Type</Label>
             <div className="capitalize">{user.type}</div>
          </div>
          <div className="flex flex-col gap-1">
             <Label className="text-muted-foreground">Status</Label>
             <div>
               <Badge variant={user.status === "banned" ? "destructive" : "outline"}>
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

        <Tabs defaultValue="requests">
          <TabsList className="grid w-full h-full grid-cols-2 md:grid-cols-4 max-w-2xl">
            <TabsTrigger value="requests">Seller Requests</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>{" "}
            <TabsTrigger value="listings">Manage Listings</TabsTrigger>
            <TabsTrigger value="categories">Manage Categories</TabsTrigger>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Seller Request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will reject the user's application to become a seller.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => rejectRequest(req.id, user.id, "Admin Rejected")}
                              >
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                  Total: {filteredUsers.length}
                </span>
              </div>
              <div className="p-4 border-b bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Search users by name or email..." 
                    className="pl-9 bg-white"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex items-center justify-between border-b last:border-0"
                >
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
                      <span className="text-rose-600 font-bold text-sm mr-2">
                        BANNED
                      </span>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ban
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ban User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This user will be unable to log in or perform actions.
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
                          className="text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The user account will be permanently removed.
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
                </div>
              ))}
            </div>
          </TabsContent>
          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm divide-y">
              <div className="p-4 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Search listings by title or seller..." 
                    className="pl-9 bg-white"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                  />
                </div>
              </div>
              {filteredListings.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">No listings found.</div>
              ) : (
              filteredListings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div 
                    className="flex flex-col cursor-pointer" 
                    onClick={() => navigate(`/auction/${l.id}`)}
                  >
                    <span className="font-medium text-rose-600 hover:underline">
                      {l.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Seller: {l.sellerName}
                    </span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the listing permanently from the platform.
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
                </div>
              )))}
            </div>
          </TabsContent>
          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                    const subs = newCatSubs.split(",").map(Is => Is.trim()).filter(Boolean);
                    addCategory(newCatName, "Desc", newCatIcon || "📦", subs);
                    setNewCatName("");
                    setNewCatSubs("");
                    setNewCatIcon("");
                    toast({ title: "Category Added" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <div className="mb-4 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Search categories..." 
                    className="pl-9 bg-white"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                  />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 border rounded"
                  >
                    <div className="flex flex-col">
                      <EditCategoryDialog 
                        category={cat} 
                        trigger={
                          <span className="font-medium cursor-pointer hover:underline text-rose-600 w-fit">
                            {cat.name}
                          </span>
                        }
                      />
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                           {cat.subcategories.map(sub => (
                             <Badge key={sub} variant="secondary" className="text-xs">
                               {sub}
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
                        {listings.some(l => l.category === cat.name || l.categories.includes(cat.name)) ? (
                            <>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cannot Delete Category</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This category contains active products. Please remove the products first.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                            </>
                        ) : (
                            <>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{cat.name}</strong>?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                >
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </>
                        )}
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
