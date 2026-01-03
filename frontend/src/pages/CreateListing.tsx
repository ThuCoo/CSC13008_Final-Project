import { useState, useEffect } from "react";

import { useUser } from "../context/UserContext";
import { useListings } from "../context/ListingsContext";
import { useCategories } from "../context/CategoriesContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Upload, DollarSign, Image as ImageIcon, Type, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export default function CreateListing() {
  const { user } = useUser();
  const { createListing } = useListings();
  const { categories, loadCategories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    startingPrice: "0",
    stepPrice: "50",
    buyNowPrice: "",
    shippingCost: "0",
    autoExtend: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const hasAccess = user && user.role === "seller" && user.sellerApproved === true;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50">
         {/* Dialog for Seller Access */}
         <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">Seller Access Required</h2>
              <p className="text-muted-foreground">
                You must be an approved seller to create listings.
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const promises = files.map(file => {
          return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      });

      Promise.all(promises).then(base64Images => {
          setImages([...images, ...base64Images]);
      }).catch(() => toast({ title: "Error uploading images", description: "Could not process files", variant: "destructive" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please upload at least 3 images for your product.",
        variant: "destructive",
      });
      return;
    }

    try {
      createListing({
        sellerId: user.id || "0",
        sellerName: user.name,
        title: formData.title,
        description: formData.description,
        categoryId: parseInt(formData.category),
        subcategoryId: formData.subCategory ? parseInt(formData.subCategory) : undefined,
        category: "Dummy",
        categories: [],
        startingPrice: parseFloat(formData.startingPrice),
        shippingCost: parseFloat(formData.shippingCost),
        itemCondition: "New",
        returnPolicy: "No Returns",
        images: images,
        condition: "New",
        returns: "No Returns",
        endsAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        stepPrice: parseFloat(formData.stepPrice),
        buyNowPrice: formData.buyNowPrice
          ? parseFloat(formData.buyNowPrice)
          : undefined,

      });

      toast({
        title: "Success",
        description: "Auction listing published successfully!",
      });
      navigate("/seller-dashboard");
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to create listing",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    const isDirty = 
      formData.title || 
      formData.description || 
      formData.startingPrice !== "0" || 
      images.length > 0;
      
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Create New Listing</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl border shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <Label>Product Name</Label>
            <Input
              required
              placeholder="e.g. Vintage Camera Lens"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
                <Select
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory (Optional)</Label>
                <Select
                  disabled={!formData.category} // Disable if no main cat selected
                  value={formData.subCategory}
                  onValueChange={(v) =>
                    setFormData({ ...formData, subCategory: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.category ? "Select Subcategory" : "Select Category First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .find((c) => c.id === formData.category)
                      ?.subcategories?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      )) || <SelectItem value="none" disabled>No subcategories</SelectItem>}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label>Starting Price (₫)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
                <Input
                  type="number"
                  className="pl-9"
                  required
                  min="0"
                  step="1000"
                  value={formData.startingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, startingPrice: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Step Price (₫)</Label>
              <Input
                type="number"
                required
                min="1000"
                step="1000"
                value={formData.stepPrice}
                onChange={(e) =>
                  setFormData({ ...formData, stepPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Buy Now Price (₫) (Optional)</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={formData.buyNowPrice}
                onChange={(e) =>
                  setFormData({ ...formData, buyNowPrice: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 border p-4 rounded-md bg-slate-50">
            <Checkbox
              id="autoExtend"
              checked={formData.autoExtend}
              onCheckedChange={(c) =>
                setFormData({ ...formData, autoExtend: c as boolean })
              }
            />
            <label
              htmlFor="autoExtend"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable Auto-extension?
              <span className="block text-xs text-muted-foreground mt-1">
                If a bid occurs in the last 5 minutes, extend by 10 minutes.
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <div className="border rounded-md">
              <div className="flex gap-2 p-2 border-b bg-slate-50">
                <Button type="button" variant="ghost" size="sm">
                  <Type className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <b>B</b>
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  <i>I</i>
                </Button>
              </div>
              <Textarea
                className="h-40 border-0 focus-visible:ring-0"
                placeholder="Detailed product description..."
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Product Images (Min. 3) </Label>
              <div className="flex gap-2">
                 <Input
                   type="file"
                   id="image-upload"
                   multiple
                   accept="image/*"
                   className="hidden"
                   onChange={handleImageUpload}
                 />
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => document.getElementById('image-upload')?.click()}
                 >
                   <Upload className="w-4 h-4 mr-2" /> Upload Images
                 </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 border-2 border-dashed rounded-lg bg-slate-50 min-h-[120px]">
              {images.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p>No images uploaded</p>
                </div>
              ) : (
                images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video bg-gray-100 rounded overflow-hidden border"
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <span className="sr-only">Remove</span>X
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full text-lg">
            Publish Listing
          </Button>
        </form>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(-1)} className="bg-rose-600 hover:bg-rose-700">
              Discard & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
