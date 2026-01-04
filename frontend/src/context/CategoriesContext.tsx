/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import apiClient from "../lib/api-client";

export interface Category {
  id: string;
  categoryId?: number;
  name: string;
  description: string;
  icon: string;
  subcategories?: { id: string; name: string }[];
  createdAt: number;
}

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  loadCategories: () => Promise<void>;
  addCategory: (
    name: string,
    description: string,
    icon: string,
    subcategories?: { id: string; name: string }[]
  ) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // useEffect(() => {
  //   loadCategories();
  // }, []);

  const loadCategories = async () => {
    // Simple cache: don't refetch if data was fetched less than 5 minutes ago
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    if (categories.length > 0 && now - lastFetch < CACHE_DURATION) {
      console.log("Using cached categories");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/categories?limit=100");
      if (data && Array.isArray(data)) {
        const mapped = data.map(
          (c: {
            categoryId: number;
            name: string;
            description: string;
            icon: string;
            subcategories?: { id: string; name: string }[];
            createdAt: number;
          }) => ({
            ...c,
            id: String(c.categoryId),
            subcategories: c.subcategories || [],
          })
        );
        setCategories(mapped);
        setLastFetch(now);
      }
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (
    name: string,
    description: string,
    icon: string
  ): Promise<Category> => {
    try {
      const { data } = await apiClient.post("/categories", {
        name,
        description,
        icon,
      });
      const newCat = {
        ...data,
        id: String(data.categoryId),
        subcategories: [],
      };
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    } catch (error) {
      console.error("Failed to add category", error);
      throw error;
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      await apiClient.put(`/categories/${id}`, data);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    } catch (error) {
      console.error("Failed to update category", error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category", error);
      throw error;
    }
  };

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((cat) => cat.id === id);
  };

  const getCategoryByName = (name: string): Category | undefined => {
    return categories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        loadCategories,
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
