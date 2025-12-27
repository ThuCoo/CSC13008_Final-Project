import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, DollarSign, Image as ImageIcon, Type } from "lucide-react";
import { Category } from "@/context/CategoriesContext";

interface CreateListingPageProps {
  formData: {
    title: string;
    description: string;
    category: string;
    startingPrice: string;
    stepPrice: string;
    buyNowPrice: string;
    shippingCost: string;
    autoExtend: boolean;
  };
  setFormData: (data: CreateListingPageProps["formData"]) => void;
  images: string[];
  setImages: (images: string[]) => void;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onAddMockImage: () => void;
  onNavigateBecomeSeller: () => void;
  isSellerApproved: boolean;
}

export default function CreateListingPage({
  formData,
  setFormData,
  images,
  setImages,
  categories,
  onSubmit,
  onAddMockImage,
  onNavigateBecomeSeller,
  isSellerApproved,
}: CreateListingPageProps) {
  if (!isSellerApproved) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Seller Access Required</h2>
          <p className="text-muted-foreground mb-6">
            You must be an approved seller to create listings.
          </p>
          <Button onClick={onNavigateBecomeSeller}>
            Become a Seller
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

        <form
          onSubmit={onSubmit}
          className="bg-white p-8 rounded-xl border shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <Label>Product Name [cite: 230]</Label>
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
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Starting Price ($) [cite: 232]</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="number"
                  className="pl-9"
                  required
                  min="0"
                  step="0.01"
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
              <Label>Step Price ($) [cite: 233]</Label>
              <Input
                type="number"
                required
                min="1"
                value={formData.stepPrice}
                onChange={(e) =>
                  setFormData({ ...formData, stepPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Buy Now Price ($) (Optional) [cite: 234]</Label>
              <Input
                type="number"
                min="0"
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
              onCheckedChange={(c: boolean | "indeterminate") =>
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
            <Label>Description (WYSIWYG Supported) </Label>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddMockImage}
              >
                <Upload className="w-4 h-4 mr-2" /> Add Image
              </Button>
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
    </div>
  );
}
