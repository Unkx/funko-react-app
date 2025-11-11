// src/pages/MostVisitedSite.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate} from "react-router-dom";
import { translations } from "./Translations/TranslationsMostVisitedSite";
import "./WelcomeSite.css";
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

// Flags
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import CanadaFlag from "/src/assets/flags/canada.svg?react";

// Match your backend item shape (without visits)
interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

// Extended with visits (client-only)
interface FunkoItemWithVisits extends FunkoItem {
  visits: number;
}

// 🌐 Languages for dropdown (with flag)
const languages = {
  US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
  EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
  CA: { name: "Canada", flag: <CanadaFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
};

const MostVisitedSite: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("preferredTheme");
    return saved ? saved === "dark" : true;
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [allItems, setAllItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"visits" | "title" | "category">("visits");
  const [visitCountVersion, setVisitCountVersion] = useState(0);

  const t = translations[language] || translations["EN"];

  const navigate = useNavigate();
  
  // Fetch all items from your backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json");
        if (!response.ok) throw new Error("Failed to fetch items");
        const items: FunkoItem[] = await response.json();
        
        // Generate IDs for items (same logic as WelcomeSite)
        const itemsWithIds = items.map(item => ({
          ...item,
          id: `${item.title?.trim() || ""}-${item.number?.trim() || ""}`.replace(/\s+/g, "-")
        }));
        
        setAllItems(itemsWithIds);
      } catch (err) {
        console.error("Error loading items:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Track localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setVisitCountVersion(prev => prev + 1);
    };
  
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom funkoVisitUpdated event (from same tab)
    window.addEventListener('funkoVisitUpdated', handleStorageChange);

    // Also refresh on focus (when user returns to this tab)
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('funkoVisitUpdated', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);
  
  // Auto-logout after 10 minutes of inactivity — only if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Only activate auto-logout if user is authenticated
    if (!token || !user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000); // 10 minutes
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate]);

  // Theme sync
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  // ✅ Compute visited items from localStorage
  const mostVisitedItems = useMemo(() => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    return allItems
      .map(item => ({
        ...item,
        visits: visitCount[item.id] || 0,
      }))
      .filter((item): item is FunkoItemWithVisits => item.visits > 0);
  }, [allItems, visitCountVersion]);

  const sortedItems = useMemo(() => {
    return [...mostVisitedItems].sort((a, b) => {
      switch (sortBy) {
        case "visits": return b.visits - a.visits;
        case "title": return a.title.localeCompare(b.title);
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
  }, [mostVisitedItems, sortBy]);

  // Get translated popularity badges
  const getPopularityBadge = (visits: number) => {
    if (visits >= 20) return { text: t.veryPopular || "🔥 Very Popular", color: "bg-red-500" };
    if (visits >= 10) return { text: t.popular || "⭐ Popular", color: "bg-orange-500" };
    if (visits >= 5) return { text: t.trending || "📈 Trending", color: "bg-blue-500" };
    return { text: t.gettingViews || "👀 Getting views", color: "bg-green-500" };
  };

  // Track item clicks on this page too
  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('funkoVisitUpdated'));
  };

  // 🌙 Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("preferredTheme", newTheme ? "dark" : "light");
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Select language
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  // 🔍 Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
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
      <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
          <Link to="/" className="no-underline">
            <h1 className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
              isDarkMode ? "text-yellow-400" : "text-green-600"
            }`}>
              Pop&Go!
            </h1>
          </Link>
        </div>

        {/* 🔍 Search */}
        <form
          onSubmit={handleSearch}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-grow px-4 py-2 outline-none ${
              isDarkMode
                ? "bg-gray-700 text-white placeholder-gray-400"
                : "bg-white text-black placeholder-gray-500"
            }`}
            aria-label="Search for Funko Pops"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* 🌐 Language, 🌙 Theme, 🔐 Dashboard */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`p-2 rounded-full flex items-center gap-1 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-neutral-600"
              }`}
              aria-label="Select language"
              aria-expanded={showLanguageDropdown}
            >
              <GlobeIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{language}</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${
                  showLanguageDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showLanguageDropdown && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                  isDarkMode ? "bg-gray-700" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                      language === code
                        ? isDarkMode
                          ? "bg-yellow-500 text-black"
                          : "bg-green-600 text-white"
                        : isDarkMode
                        ? "hover:bg-gray-600"
                        : "hover:bg-neutral-500"
                    }`}
                  >
                    <span className="w-5 h-5">{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 🌙 Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-600"
            }`}
            aria-label={isDarkMode ? t.switchToLight || "Switch to light mode" : t.switchToDark || "Switch to dark mode"}
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          {/* 🔐 Dashboard/Login */}
          <button
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              navigate(user.role === "admin" ? "/adminSite" : user.role === "user" ? "/dashboardSite" : "/loginRegisterSite");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {t.goToDashboard || "Dashboard"}
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.mostVisited || "Most Visited Items"}</h1>
          <p className="text-lg opacity-80">
            {mostVisitedItems.length === 0 
              ? t.noVisitsYet || "No items have been visited yet. Start browsing!"
              : t.discoverPopularItems?.replace("{count}", mostVisitedItems.length.toString()) || `Discover the ${mostVisitedItems.length} most popular Funko Pops in the community`
            }
          </p>
        </div>

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
              </select>
            </div>
            <div className="text-sm opacity-75">
              {t.showing?.replace("{count}", mostVisitedItems.length.toString()) || `Showing ${mostVisitedItems.length} items`}
            </div>
          </div>
        )}

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
                  {sortBy === "visits" && index < 3 && (
                    <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? "bg-yellow-500" : 
                      index === 1 ? "bg-gray-400" : 
                      "bg-orange-500"
                    }`}>
                      #{index + 1}
                    </div>
                  )}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded text-xs text-white ${popularity.color}`}>
                    {popularity.text}
                  </div>
                  
                  <img
                    src={item.imageName || "/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/placeholder.png";
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
                      <span className={`px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-yellow-600" : "bg-green-600"
                      } text-white`}>
                        {t.exclusive || "Exclusive"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

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
              {t.browseAllItems?.replace("{count}", allItems.length.toString()) || `Browse All Items (${allItems.length})`}
            </Link>
          </div>
        )}
      </main>

      <footer className={`text-center py-4 ${
        isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-300 text-gray-700"
      }`}>
        {t.copyright || "© 2024 Pop&Go! All rights reserved."}
      </footer>
    </div>
  );
};

export default MostVisitedSite;