
import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import { useCategories } from "../context/CategoriesContext";

export default function Categories() {
  const { categories } = useCategories();

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center text-slate-900">
          All Categories
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{cat.icon || "📦"}</span>
                <h2 className="text-xl font-bold text-slate-800">
                  <Link
                    to={`/browse?cat=${cat.name}`}
                    className="hover:text-rose-600"
                  >
                    {cat.name}
                  </Link>
                </h2>
              </div>
              <ul className="space-y-2">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub) => (
                  <li key={sub}>
                    <Link
                      to={`/browse?cat=${cat.name}&sub=${sub}`}
                      className="text-slate-600 hover:text-rose-600 flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4 text-slate-400" /> {sub}
                    </Link>
                  </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-400 italic">No subcategories</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
