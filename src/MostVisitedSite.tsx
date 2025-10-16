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
  visits: number;
}

const MostVisitedSite: React.FC = () => {
  const [isDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });
  
  const [language] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [mostVisitedItems, setMostVisitedItems] = useState<FunkoItem[]>([]);
  const [allItems, setAllItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"visits" | "title" | "category">("visits");

  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  // Fetch items and calculate visits
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/items");
        if (!response.ok) throw new Error("Failed to fetch data");
        const items: FunkoItem[] = await response.json();
        
        const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
        
        // Add visit counts to items
        const itemsWithVisits = items.map(item => ({
          ...item,
          visits: visitCount[item.id] || 0
        }));
        
        setAllItems(itemsWithVisits);
        
        // Get most visited (visits > 0)
        const visited = itemsWithVisits
          .filter(item => item.visits > 0)
          .sort((a, b) => b.visits - a.visits);
        
        setMostVisitedItems(visited);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Sort items based on current sort option
  const sortedItems = [...mostVisitedItems].sort((a, b) => {
    switch (sortBy) {
      case "visits":
        return b.visits - a.visits;
      case "title":
        return a.title.localeCompare(b.title);
      case "category":
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    
    // Update local state
    setMostVisitedItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, visits: visitCount[id] } : item
      ).sort((a, b) => b.visits - a.visits)
    );
  };

  const getPopularityBadge = (visits: number) => {
    if (visits >= 20) return { text: "🔥 Very Popular", color: "bg-red-500" };
    if (visits >= 10) return { text: "⭐ Popular", color: "bg-orange-500" };
    if (visits >= 5) return { text: "📈 Trending", color: "bg-blue-500" };
    return { text: "👀 Getting views", color: "bg-green-500" };
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

      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.mostVisited || "Most Visited Items"}</h1>
          <p className="text-lg opacity-80">
            {mostVisitedItems.length === 0 
              ? t.noVisitsYet || "No items have been visited yet. Start browsing!"
              : `Discover the ${mostVisitedItems.length} most popular Funko Pops in the community`
            }
          </p>
        </div>

        {/* Stats */}
        {mostVisitedItems.length > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-white"
          }`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{mostVisitedItems.length}</div>
              <div className="text-sm">{t.totalVisited || "Total Visited Items"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Math.max(...mostVisitedItems.map(item => item.visits))}
              </div>
              <div className="text-sm">{t.mostViews || "Most Views on Single Item"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(mostVisitedItems.reduce((sum, item) => sum + item.visits, 0) / mostVisitedItems.length)}
              </div>
              <div className="text-sm">{t.averageViews || "Average Views per Item"}</div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        {mostVisitedItems.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span>{t.sortBy || "Sort by"}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "visits" | "title" | "category")}
                className={`px-3 py-2 rounded border ${
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-black"
                }`}
              >
                <option value="visits">{t.mostVisited || "Most Visited"}</option>
                <option value="title">{t.title || "Title"}</option>
                <option value="category">{t.category || "Category"}</option>
              </select>
            </div>
            
            <div className="text-sm opacity-75">
              {t.showing || "Showing"} {mostVisitedItems.length} {t.items || "items"}
            </div>
          </div>
        )}

        {/* Items Grid */}
        {mostVisitedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">{t.noVisitsTitle || "No Visits Yet"}</h2>
            <p className="text-lg mb-6 max-w-md mx-auto">
              {t.noVisitsDescription || "Start browsing Funko Pops to build your most visited list. Items you view will appear here!"}
            </p>
            <Link
              to="/categories"
              className={`inline-block px-6 py-3 rounded-lg font-bold ${
                isDarkMode 
                  ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {t.browseCategories || "Browse Categories"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item, index) => {
              const popularity = getPopularityBadge(item.visits);
              return (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg relative ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
                >
                  {/* Rank Badge */}
                  {sortBy === "visits" && index < 3 && (
                    <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? "bg-yellow-500" : 
                      index === 1 ? "bg-gray-400" : 
                      "bg-orange-500"
                    }`}>
                      #{index + 1}
                    </div>
                  )}
                  
                  {/* Popularity Badge */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded text-xs text-white ${popularity.color}`}>
                    {popularity.text}
                  </div>
                  
                  <img
                    src={item.imageName || "/src/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                    }}
                  />
                  
                  <h3 className="font-bold text-lg mb-2 text-center">{item.title}</h3>
                  
                  <div className="text-center mb-2">
                    <span className="text-sm opacity-75">#{item.number}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm opacity-75">{item.category}</span>
                  </div>
                  
                  {item.series.length > 0 && (
                    <p className="text-sm text-center mb-2 opacity-75">
                      {item.series.join(", ")}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">👁️</span>
                      <span className="font-bold">{item.visits}</span>
                      <span className="text-xs opacity-75">{t.views || "views"}</span>
                    </div>
                    
                    {item.exclusive && (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          isDarkMode ? "bg-yellow-600" : "bg-green-600"
                        } text-white`}
                      >
                        {t.exclusive || "Exclusive"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* All Items Link */}
        {mostVisitedItems.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/categories"
              className={`inline-block px-6 py-3 rounded-lg font-bold ${
                isDarkMode 
                  ? "bg-gray-700 hover:bg-gray-600" 
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {t.browseAllItems || "Browse All Items"} ({allItems.length})
            </Link>
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

export default MostVisitedSite;