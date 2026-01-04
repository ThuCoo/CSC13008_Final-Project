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
    startingPrice: "1000",
    stepPrice: "1000",
    buyNowPrice: "",
    shippingCost: "0",
    duration: "3",
    condition: "New",
    autoExtend: true,
  });

  const [images, setImages] = useState<string[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.subCategory) {
      newErrors.subCategory = "Please select a subcategory";
    }

    const startPrice = parseFloat(formData.startingPrice);
    if (!formData.startingPrice || isNaN(startPrice) || startPrice < 1000) {
      newErrors.startingPrice = "Starting price must be at least 1,000₫";
    }

    const stepPrice = parseFloat(formData.stepPrice);
    if (!formData.stepPrice || isNaN(stepPrice) || stepPrice < 1000) {
      newErrors.stepPrice = "Step price must be at least 1,000₫";
    }

    if (formData.buyNowPrice) {
      const buyPrice = parseFloat(formData.buyNowPrice);
      if (isNaN(buyPrice) || buyPrice < 1000) {
        newErrors.buyNowPrice = "Buy now price must be at least 1,000₫";
      } else if (buyPrice <= startPrice) {
        newErrors.buyNowPrice = "Buy now price must be greater than starting price";
      }
    }

    if (images.length < 3) {
      newErrors.images = "Please upload at least 3 images";
    }

    const shipping = parseFloat(formData.shippingCost);
    if (!formData.shippingCost || isNaN(shipping) || shipping < 0) {
      newErrors.shippingCost = "Shipping cost must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
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
        itemCondition: formData.condition,
        returnPolicy: "No Returns",
        images: images,
        condition: formData.condition,
        returns: "No Returns",
        endsAt: Date.now() + parseInt(formData.duration) * 24 * 60 * 60 * 1000,
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
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category</Label>
                <Select
                  onValueChange={(v) => {
                    setFormData({ ...formData, category: v, subCategory: "" });
                    if (errors.category) {
                      const newErrors = { ...errors };
                      delete newErrors.category;
                      setErrors(newErrors);
                    }
                  }}
                  required
                >
                  <SelectTrigger className={errors.category ? "border-red-500 focus:ring-red-500" : ""}>
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
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Subcategory (Optional)</Label>
                <Select
                  disabled={!formData.category} // Disable if no main category selected
                  onValueChange={(v) => {
                    setFormData({ ...formData, subCategory: v });
                    if (errors.subCategory) {
                      const newErrors = { ...errors };
                      delete newErrors.subCategory;
                      setErrors(newErrors);
                    }
                  }}
                >
                  <SelectTrigger className={errors.subCategory ? "border-red-500 focus:ring-red-500" : ""}>
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
                {errors.subCategory && (
                  <p className="text-sm text-red-500">{errors.subCategory}</p>
                )}
            </div>
            <div className="space-y-2">
              <Label>Starting Price (₫)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
                <Input
                  type="number"
                  className={`pl-9 ${errors.startingPrice ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  required
                  min="0"
                  step="1000"
                  value={formData.startingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, startingPrice: e.target.value })
                  }
                />
              </div>
              {errors.startingPrice && (
                <p className="text-sm text-red-500">{errors.startingPrice}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Auction Duration (Days)</Label>
              <Select
                value={formData.duration}
                onValueChange={(v) => {
                  setFormData({ ...formData, duration: v });
                  if (errors.duration) {
                    const newErrors = { ...errors };
                    delete newErrors.duration;
                    setErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={errors.duration ? "border-red-500 focus:ring-red-500" : ""}>
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="10">10 Days</SelectItem>
                </SelectContent>
              </Select>
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration}</p>
              )}
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
                className={errors.stepPrice ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.stepPrice && (
                <p className="text-sm text-red-500">{errors.stepPrice}</p>
              )}
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
                className={errors.buyNowPrice ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.buyNowPrice && (
                <p className="text-sm text-red-500">{errors.buyNowPrice}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Shipping Cost (₫)</Label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₫</span>
                 <Input
                   type="number"
                   className={`pl-9 ${errors.shippingCost ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                   value={formData.shippingCost}
                   onChange={(e) =>
                     setFormData({ ...formData, shippingCost: e.target.value })
                   }
                   min="0"
                   step="1000"
                 />
              </div>
              {errors.shippingCost && (
                <p className="text-sm text-red-500">{errors.shippingCost}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Item Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(v) => {
                  setFormData({ ...formData, condition: v });
                  if (errors.condition) {
                    const newErrors = { ...errors };
                    delete newErrors.condition;
                    setErrors(newErrors);
                  }
                }}
              >
                <SelectTrigger className={errors.condition ? "border-red-500 focus:ring-red-500" : ""}>
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Like New">Like New</SelectItem>
                  <SelectItem value="Used - Excellent">Used - Excellent</SelectItem>
                  <SelectItem value="Used - Good">Used - Good</SelectItem>
                  <SelectItem value="Used - Fair">Used - Fair</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-sm text-red-500">{errors.condition}</p>
              )}
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
            <div className={`border rounded-md ${errors.description ? "border-red-500" : ""}`}>
              <div className={`flex gap-2 p-2 border-b bg-slate-50 ${errors.description ? "border-red-500" : ""}`}>
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
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
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

            <div className={`grid grid-cols-3 gap-4 p-4 border-2 border-dashed rounded-lg bg-slate-50 min-h-[120px] ${errors.images ? "border-red-500 bg-red-50/10" : ""}`}>
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
            {errors.images && (
              <p className="text-sm text-red-500 mt-2">{errors.images}</p>
            )}
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
