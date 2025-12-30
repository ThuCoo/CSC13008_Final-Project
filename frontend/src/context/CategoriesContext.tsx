import React, { createContext, useContext, useState } from "react";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories?: string[];
  createdAt: number;
}

interface CategoriesContextType {
  categories: Category[];
  addCategory: (name: string, description: string, icon: string, subcategories?: string[]) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Electronics",
    description: "Phones, computers, tablets, and more",
    icon: "📱",
    subcategories: ["Mobile Phones", "Laptops", "Tablets", "Accessories"],
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    name: "Collectibles",
    description: "Rare and vintage collectible items",
    icon: "🏛️",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    name: "Jewelry",
    description: "Watches, rings, necklaces, and accessories",
    icon: "💎",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: "4",
    name: "Home & Garden",
    description: "Furniture, decor, and garden items",
    icon: "🏡",
    subcategories: ["Furniture", "Decor", "Garden", "Kitchen"],
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: "5",
    name: "Sports & Outdoors",
    description: "Equipment, gear, and sports items",
    icon: "⚽",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: "6",
    name: "Art & Antiques",
    description: "Original artwork and antique pieces",
    icon: "🎨",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
];

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem("auctionhub_categories");
    if (!stored) return INITIAL_CATEGORIES;
    return JSON.parse(stored);
  });

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem("auctionhub_categories", JSON.stringify(newCategories));
  };

  const addCategory = (
    name: string,
    description: string,
    icon: string,
    subcategories: string[] = []
  ): Category => {
    if (getCategoryByName(name)) {
      throw new Error("Category already exists");
    }

    const newCategory: Category = {
      id: String(Date.now()),
      name,
      description,
      icon,
      subcategories,
      createdAt: Date.now(),
    };

    saveCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, ...data } : cat
    );
    saveCategories(updated);
  };

  const deleteCategory = (id: string) => {
    const filtered = categories.filter((cat) => cat.id !== id);
    saveCategories(filtered);
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((cat) => cat.id === id);
  };

  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        getCategoryByName,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
}
