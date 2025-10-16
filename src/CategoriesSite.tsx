import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsWelcomeSite";
import "./WelcomeSite.css";

interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

const CategoriesSite: React.FC = () => {
  const [isDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });
  
  const [language] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [items, setItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  // Fetch categories and items
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/items");
        if (!response.ok) throw new Error("Failed to fetch data");
        const data: FunkoItem[] = await response.json();
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
          .filter(category => category) // Remove empty categories
          .sort();
        
        setCategories(uniqueCategories);
        setItems(data);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter items by selected category and search query
  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.series.some(series => series.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Get items by category for the category grid
  const getItemsByCategory = (category: string, limit: number = 4) => {
    return items
      .filter(item => item.category === category)
      .slice(0, limit);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled in the filter above
  };

  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-4 md:px-8 flex justify-between items-center">
        <Link to="/" className="no-underline">
          <h1 className={`text-2xl font-bold font-[Special_Gothic_Expanded_One] ${
            isDarkMode ? "text-yellow-400" : "text-green-600"
          }`}>
            Pop&Go!
          </h1>
        </Link>
        
        <div className="flex gap-4">
          <Link 
            to="/"
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t.backToHome || "Back to Home"}
          </Link>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.categories || "Categories"}</h1>
          <p className="text-lg opacity-80">
            {selectedCategory 
              ? `Showing ${filteredItems.length} items in ${selectedCategory}`
              : `Browse ${categories.length} categories and ${items.length} items`
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Search items..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-grow px-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black placeholder-gray-500"
              }`}
            />
            <button
              type="button"
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              {t.clear || "Clear"}
            </button>
          </form>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              !selectedCategory
                ? isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                : isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t.allCategories || "All Categories"}
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === category
                  ? isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                  : isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Content */}
        {!selectedCategory ? (
          /* Categories Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => {
              const categoryItems = getItemsByCategory(category);
              return (
                <div
                  key={category}
                  className={`rounded-lg overflow-hidden shadow-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-white"
                  }`}
                >
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">{category}</h2>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {categoryItems.map(item => (
                        <Link
                          key={item.id}
                          to={`/funko/${item.id}`}
                          onClick={() => handleItemClick(item.id)}
                          className="block"
                        >
                          <img
                            src={item.imageName || "/src/assets/placeholder.png"}
                            alt={item.title}
                            className="w-full h-20 object-contain rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/src/assets/placeholder.png";
                            }}
                          />
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full py-2 rounded ${
                        isDarkMode 
                          ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {t.viewAll || "View All"} {items.filter(item => item.category === category).length} items
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Items List View for Selected Category */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedCategory}</h2>
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-2 rounded ${
                  isDarkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                {t.backToCategories || "Back to Categories"}
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl mb-4">{t.noItemsFound || "No items found"}</p>
                <button
                  onClick={clearFilters}
                  className={`px-6 py-2 rounded ${
                    isDarkMode 
                      ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {t.clearFilters || "Clear Filters"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredItems.map(item => (
                  <Link
                    key={item.id}
                    to={`/funko/${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`block p-3 rounded-lg text-center ${
                      isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                    } shadow transition-transform hover:scale-105`}
                  >
                    <img
                      src={item.imageName || "/src/assets/placeholder.png"}
                      alt={item.title}
                      className="w-full h-32 object-contain rounded mb-2"
                      onError={(e) => {
                        e.currentTarget.src = "/src/assets/placeholder.png";
                      }}
                    />
                    <h3 className="font-bold text-sm mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">#{item.number}</p>
                    {item.exclusive && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          isDarkMode ? "bg-yellow-600" : "bg-green-600"
                        } text-white`}
                      >
                        {t.exclusive || "Exclusive"}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`text-center py-4 ${
        isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-300 text-gray-700"
      }`}>
        {t.copyright || "© 2024 Pop&Go! All rights reserved."}
      </footer>
    </div>
  );
};

export default CategoriesSite;