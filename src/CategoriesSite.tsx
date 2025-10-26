import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { translations } from "./Translations/TranslationsWelcomeSite";
import "./WelcomeSite.css";
import { FunkoItems } from "./FunkoItems";

interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

// Predefined Funko categories with descriptions and sample items
const FUNKO_CATEGORIES = [
  {
    id: "tv",
    name: "Funko TV",
    description: "Characters from your favorite TV shows",
    icon: "📺",
    sampleItems: ["Friends", "The Office", "Stranger Things", "Game of Thrones"]
  },
  {
    id: "movies",
    name: "Funko Movies", 
    description: "Iconic characters from blockbuster films",
    icon: "🎬",
    sampleItems: ["Star Wars", "Harry Potter", "Marvel", "DC Comics"]
  },
  {
    id: "wwe",
    name: "Funko WWE",
    description: "Wrestling superstars and legends",
    icon: "💪",
    sampleItems: ["John Cena", "The Rock", "Stone Cold", "Undertaker"]
  },
  {
    id: "games",
    name: "Funko Games",
    description: "Characters from video games",
    icon: "🎮",
    sampleItems: ["Fortnite", "Overwatch", "Halo", "Pokémon"]
  },
  {
    id: "anime",
    name: "Funko Anime",
    description: "Beloved anime and manga characters",
    icon: "🇯🇵",
    sampleItems: ["Dragon Ball Z", "Naruto", "One Piece", "My Hero Academia"]
  },
  {
    id: "music",
    name: "Funko Music",
    description: "Music icons and bands",
    icon: "🎵",
    sampleItems: ["The Beatles", "Michael Jackson", "Queen", "KISS"]
  },
  {
    id: "sports",
    name: "Funko Sports",
    description: "Sports legends and teams",
    icon: "⚽",
    sampleItems: ["NBA Stars", "NFL Legends", "Soccer Icons", "Baseball Heroes"]
  },
  {
    id: "comics",
    name: "Funko Comics",
    description: "Superheroes and comic book characters",
    icon: "💥",
    sampleItems: ["Spider-Man", "Batman", "Superman", "X-Men"]
  },
  {
    id: "disney",
    name: "Funko Disney",
    description: "Disney classics and new favorites",
    icon: "🏰",
    sampleItems: ["Mickey Mouse", "Frozen", "Toy Story", "Marvel"]
  },
  {
    id: "holiday",
    name: "Funko Holiday",
    description: "Seasonal and holiday specials",
    icon: "🎄",
    sampleItems: ["Christmas", "Halloween", "Easter", "Valentine's Day"]
  }
];

const CategoriesSite: React.FC = () => {
  const [isDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });
  
  const [language] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [items, setItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string>("");

  const t = translations[language] || translations["EN"];

  // Fetch items from API
 // Remove the entire useEffect and replace it with this:
useEffect(() => {
  setIsLoading(false);
  setItems(FunkoItems); // <-- Use your hardcoded array with real images!
}, []);

  // Enhanced category matching logic
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    tv: ["tv", "television", "series", "show"],
    movies: ["movies", "movie", "film", "cinema"],
    wwe: ["wwe", "wrestling", "wrestler"],
    games: ["games", "game", "gaming", "video game"],
    anime: ["anime", "manga"],
    music: ["music", "musician", "band", "artist", "rock", "pop"],
    sports: ["sports", "sport", "nba", "nfl", "soccer", "football", "baseball", "hockey"],
    comics: ["comics", "comic", "superhero", "marvel", "dc"],
    disney: ["disney", "pixar"],
    holiday: ["holiday", "christmas", "halloween", "easter", "valentine"]
  };

  // More flexible matching function
// Updated category matching - simpler and more direct
const matchesCategory = (item: FunkoItem, categoryId: string): boolean => {
  if (!item.category) return false;
  
  const categoryLower = item.category.toLowerCase();
  
  // Direct mapping based on exact category names from backend
  const categoryMap: Record<string, string[]> = {
    tv: ["funko tv"],
    movies: ["funko movies"],
    wwe: ["funko wwe"],
    games: ["funko games"],
    anime: ["funko anime"],
    music: ["funko music"],
    sports: ["funko sports"],
    comics: ["funko comics"],
    disney: ["funko disney"],
    holiday: ["funko holiday"]
  };
  
  const targetCategories = categoryMap[categoryId] || [];
  
  // Check if the item's category matches any of the target categories
  return targetCategories.some(target => categoryLower.includes(target));
};


  // Get items for the selected category
  const getCategoryItems = () => {
    if (!selectedCategory) return [];
    return items.filter(item => matchesCategory(item, selectedCategory));
  };

  // Get featured items for category preview
  const getFeaturedItems = (categoryId: string) => {
    return items
      .filter(item => matchesCategory(item, categoryId))
      .slice(0, 4);
  };

  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('funkoVisitUpdated'));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
  };

  const categoryItems = getCategoryItems();
  const filteredItems = categoryItems.filter(item => 
    !searchQuery || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.series && item.series.some(series => 
      series.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading Funko Categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-2 rounded font-bold ${
              isDarkMode 
                ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            Try Again
          </button>
        </div>
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
            className={`px-4 py-2 rounded transition-colors ${
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
          <h1 className="text-4xl font-bold mb-4">Funko Categories</h1>
          <p className="text-lg opacity-80">
            {selectedCategory 
              ? `Exploring ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}`
              : `Browse ${FUNKO_CATEGORIES.length} Funko categories with ${items.length} total items`
            }
          </p>
        </div>

        {/* Search Bar - Only show when category is selected */}
        {selectedCategory && (
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={`Search in ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}...`}
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
        )}

        {/* Content */}
        {!selectedCategory ? (
          /* Categories Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {FUNKO_CATEGORIES.map(category => {
              const featuredItems = getFeaturedItems(category.id);
              const itemCount = items.filter(item => matchesCategory(item, category.id)).length;

              return (
                <div
                  key={category.id}
                  className={`rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 ${
                    isDarkMode ? "bg-gray-700" : "bg-white"
                  }`}
                >
                  <div className="p-6">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{category.icon}</span>
                      <div className="flex-grow">
                        <h2 className="text-xl font-bold">{category.name}</h2>
                        <p className="text-sm opacity-75">{category.description}</p>
                      </div>
                    </div>

                    {/* Sample Items Preview */}
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {featuredItems.slice(0, 4).map(item => (
                          <Link
                            key={item.id}
                            to={`/funko/${item.id}`}
                            onClick={() => handleItemClick(item.id)}
                            className="block"
                          >
                            <img
                              src={item.imageName}
                              alt={item.title}
                              className="w-full h-20 object-contain rounded bg-gray-100 dark:bg-gray-600"
                            />
                          </Link>
                        ))}
                        {/* Placeholder if not enough items */}
                        {featuredItems.length < 4 && 
                          Array.from({ length: 4 - featuredItems.length }).map((_, index) => (
                            <div
                              key={`placeholder-${index}`}
                              className={`w-full h-20 rounded flex items-center justify-center ${
                                isDarkMode ? "bg-gray-600" : "bg-gray-100"
                              }`}
                            >
                              <span className="text-xs opacity-50">Coming Soon</span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Popular Series */}
                      <div className="text-xs opacity-75 mb-2">
                        <strong>Popular: </strong>
                        {category.sampleItems.slice(0, 3).join(", ")}
                      </div>
                    </div>

                    {/* View Category Button */}
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full py-2 rounded font-bold transition-colors ${
                        itemCount > 0
                          ? isDarkMode 
                            ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                            : "bg-green-600 text-white hover:bg-green-700"
                          : isDarkMode
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={itemCount === 0}
                    >
                      {itemCount > 0 
                        ? `View Category (${itemCount})` 
                        : "Coming Soon"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Items List View for Selected Category */
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`p-2 rounded ${
                    isDarkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-2xl font-bold">
                    {FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-sm opacity-75">
                    {FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.description}
                  </p>
                </div>
              </div>
              <div className="text-sm opacity-75">
                {filteredItems.length} items {searchQuery && `(filtered from ${categoryItems.length})`}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-xl mb-4">
                  {searchQuery 
                    ? `No items found matching "${searchQuery}"` 
                    : "No items found in this category yet"}
                </p>
                <p className="mb-6 opacity-75">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : `Check back soon for new ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name} releases!`}
                </p>
                <div className="flex gap-4 justify-center">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`px-6 py-2 rounded font-bold ${
                        isDarkMode 
                          ? "bg-gray-600 hover:bg-gray-500" 
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-6 py-2 rounded font-bold ${
                      isDarkMode 
                        ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    Browse All Categories
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredItems.map(item => (
                  <Link
                    key={item.id}
                    to={`/funko/${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`block p-3 rounded-lg text-center transition-all ${
                      isDarkMode 
                        ? "bg-gray-700 hover:bg-gray-600 hover:shadow-lg" 
                        : "bg-white hover:bg-gray-100 hover:shadow-md"
                    } shadow hover:scale-105`}
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
                    <p className="text-xs opacity-75 mb-1">#{item.number}</p>
                    <p className="text-xs opacity-60 mb-2">{item.category}</p>
                    {item.exclusive && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          isDarkMode ? "bg-yellow-600" : "bg-green-600"
                        } text-white`}
                      >
                        Exclusive
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
      <footer className={`text-center py-4 mt-8 ${
        isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-300 text-gray-700"
      }`}>
        © 2024 Pop&Go! All rights reserved.
      </footer>
    </div>
  );
};

export default CategoriesSite;