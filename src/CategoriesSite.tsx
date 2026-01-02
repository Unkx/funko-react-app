import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsCategoriesSite";
import useBreakpoints from "./useBreakpoints";
import "./WelcomeSite.css";
import { FunkoItems } from "./FunkoItems";

// Icon imports
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

// Flag imports
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import CanadaFlag from "/src/assets/flags/canada.svg?react";

interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

// 📚 Language display names
const languageNames = {
  EN: "English",
  PL: "Polski",
  RU: "Русский",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
};

const CategoriesSite: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [items, setItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  // Predefined Funko categories with descriptions and sample items - MOVED INSIDE COMPONENT
  const FUNKO_CATEGORIES = [
    {
      id: "tv",
      name: t.funkoTV || "Funko TV",
      description: t.tvDescription || "Characters from your favorite TV shows",
      icon: "📺",
      sampleItems: ["Friends", "The Office", "Stranger Things", "Game of Thrones"]
    },
    {
      id: "movies",
      name: t.funkoMovies || "Funko Movies", 
      description: t.moviesDescription || "Iconic characters from blockbuster films",
      icon: "🎬",
      sampleItems: ["Star Wars", "Harry Potter", "Marvel", "DC Comics"]
    },
    {
      id: "wwe",
      name: t.funkoWWE || "Funko WWE",
      description: t.wweDescription || "Wrestling superstars and legends",
      icon: "💪",
      sampleItems: ["John Cena", "The Rock", "Stone Cold", "Undertaker"]
    },
    {
      id: "games",
      name: t.funkoGames || "Funko Games",
      description: t.gamesDescription || "Characters from video games",
      icon: "🎮",
      sampleItems: ["Fortnite", "Overwatch", "Halo", "Pokémon"]
    },
    {
      id: "anime",
      name: t.funkoAnime || "Funko Anime",
      description: t.animeDescription || "Beloved anime and manga characters",
      icon: "🇯🇵",
      sampleItems: ["Dragon Ball Z", "Naruto", "One Piece", "My Hero Academia"]
    },
    {
      id: "music",
      name: t.funkoMusic || "Funko Music",
      description: t.musicDescription || "Music icons and bands",
      icon: "🎵",
      sampleItems: ["The Beatles", "Michael Jackson", "Queen", "KISS"]
    },
    {
      id: "sports",
      name: t.funkoSports || "Funko Sports",
      description: t.sportsDescription || "Sports legends and teams",
      icon: "⚽",
      sampleItems: ["NBA Stars", "NFL Legends", "Soccer Icons", "Baseball Heroes"]
    },
    {
      id: "comics",
      name: t.funkoComics || "Funko Comics",
      description: t.comicsDescription || "Superheroes and comic book characters",
      icon: "💥",
      sampleItems: ["Spider-Man", "Batman", "Superman", "X-Men"]
    },
    {
      id: "disney",
      name: t.funkoDisney || "Funko Disney",
      description: t.disneyDescription || "Disney classics and new favorites",
      icon: "🏰",
      sampleItems: ["Mickey Mouse", "Frozen", "Toy Story", "Marvel"]
    },
    {
      id: "holiday",
      name: t.funkoHoliday || "Funko Holiday",
      description: t.holidayDescription || "Seasonal and holiday specials",
      icon: "🎄",
      sampleItems: ["Christmas", "Halloween", "Easter", "Valentine's Day"]
    }
  ];

  // Refs for dropdowns
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // 🌍 Languages for dropdown (with flag)
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

  // Toggle language dropdown
  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prev) => !prev);
  };

  // Select language
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  // 🌙 Toggle theme
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("preferredTheme", newDarkMode ? "dark" : "light");
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 🔍 Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // Perform logout
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000); // 10 minutes = 600,000 ms
    };

    // Initial setup
    resetTimer();

    // List of events to consider as "user activity"
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate]);

  // Fetch items from API
  useEffect(() => {
    setIsLoading(false);
    setItems(FunkoItems);
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
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-800"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">{t.loading || "Loading Funko Categories..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-800"
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-2 rounded font-bold border ${
              isDarkMode 
                ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" 
                : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            }`}
          >
            {t.tryAgain || "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-gray-800"}`}>
      {/* 🔝 Header */}
      <header className={`py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4 ${isDarkMode ? "bg-gray-800" : "bg-blue-100"}`}>
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
          <Link to="/" className="no-underline">
            <h1
              className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
                isDarkMode ? "text-yellow-400" : "text-blue-600"
              }`}
            >
              Pop&Go!
            </h1>
          </Link>
        </div>

        {/* 🔍 Search */}
        <form
          onSubmit={handleSearch}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden border border-gray-300 ${
            isDarkMode ? "bg-gray-700" : "bg-white"
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
                : "bg-white text-gray-800 placeholder-gray-500"
            }`}
            aria-label="Search for Funkos"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* 🌐 Language, 🌙 Theme, 🔐 Login */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0 min-w-0 items-center">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              ref={languageButtonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 min-w-0 border border-gray-300 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-white hover:bg-gray-100"
              }`}
              aria-label="Select language"
              aria-expanded={showLanguageDropdown}
            >
              <GlobeIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">{language}</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${
                  showLanguageDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

                                {showLanguageDropdown && (
                          <div
                            ref={languageDropdownRef}
                            className={`absolute mt-2 z-50 lang-dropdown variant-b rounded-lg shadow-xl py-2 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto ${
                              isDarkMode 
                                ? 'border-yellow-500 bg-gray-800' 
                                : 'border-blue-500 bg-white'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`lang-item w-full text-left px-4 py-2 flex items-center gap-2 whitespace-nowrap ${
                      language === code
                        ? isDarkMode
                          ? "bg-yellow-500 text-white"
                          : "bg-blue-600 text-white"
                        : isDarkMode
                        ? "hover:bg-gray-600"
                        : "hover:bg-gray-100"
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
            className={`p-2 rounded-full border border-gray-300 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
            }`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          {/* 🔐 Dashboard/Login */}
          <button
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              navigate(user.role === "admin" ? "/adminSite" : user.role === "user" ? "/dashboardSite" : "/loginRegisterSite");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded border ${
              isDarkMode
                ? "bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500"
                : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            }`}
          >
            {t.goToDashboard || "Dashboard"}
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.funkoCategories || "Funko Categories"}</h1>
          <p className="text-lg opacity-80">
            {selectedCategory 
              ? `${t.exploringCategory || "Exploring"} ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}`
              : `${t.browseCategories || "Browse categories with"} ${FUNKO_CATEGORIES.length} ${t.totalItems || "total items"}`
            }
          </p>
        </div>

        {/* Search Bar - Only show when category is selected */}
        {selectedCategory && (
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={`${t.searchInCategory || "Search in"} ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-grow px-4 py-2 rounded-lg border border-gray-300 ${
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                }`}
              />
              <button
                type="button"
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? "bg-gray-600 hover:bg-gray-500 border-gray-600" : "bg-gray-300 hover:bg-gray-400 border-gray-400"
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
                  className={`rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 border border-gray-200 ${
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
                              className="w-full h-20 object-contain rounded bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600"
                            />
                          </Link>
                        ))}
                        {/* Placeholder if not enough items */}
                        {featuredItems.length < 4 && 
                          Array.from({ length: 4 - featuredItems.length }).map((_, index) => (
                            <div
                              key={`placeholder-${index}`}
                              className={`w-full h-20 rounded flex items-center justify-center border border-gray-200 ${
                                isDarkMode ? "bg-gray-600" : "bg-gray-100"
                              }`}
                            >
                              <span className="text-xs opacity-50">{t.comingSoon || "Coming Soon"}</span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Popular Series */}
                      <div className="text-xs opacity-75 mb-2">
                        <strong>{t.popular || "Popular"}: </strong>
                        {category.sampleItems.slice(0, 3).join(", ")}
                      </div>
                    </div>

                    {/* View Category Button */}
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full py-2 rounded font-bold transition-colors border ${
                        itemCount > 0
                          ? isDarkMode 
                            ? "bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500" 
                            : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          : isDarkMode
                            ? "bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                      }`}
                      disabled={itemCount === 0}
                    >
                      {itemCount > 0 
                        ? `${t.viewCategory || "View Category"} (${itemCount})` 
                        : t.comingSoon || "Coming Soon"}
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
                  className={`p-2 rounded border ${
                    isDarkMode ? "bg-gray-600 hover:bg-gray-500 border-gray-600" : "bg-gray-300 hover:bg-gray-400 border-gray-400"
                  }`}
                >
                  ← {t.back || "Back"}
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
                {filteredItems.length} {t.items || "items"} {searchQuery && `(${t.filteredFrom || "filtered from"} ${categoryItems.length})`}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-xl mb-4">
                  {searchQuery 
                    ? `${t.noItemsFound || "No items found"} matching "${searchQuery}"` 
                    : t.noItemsInCategory || "No items found in this category yet"}
                </p>
                <p className="mb-6 opacity-75">
                  {searchQuery 
                    ? t.tryAdjustingSearch || "Try adjusting your search terms" 
                    : `${t.checkBackSoon || "Check back soon for new"} ${FUNKO_CATEGORIES.find(cat => cat.id === selectedCategory)?.name} ${t.releases || "releases"}!`}
                </p>
                <div className="flex gap-4 justify-center">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`px-6 py-2 rounded font-bold border ${
                        isDarkMode 
                          ? "bg-gray-600 hover:bg-gray-500 border-gray-600" 
                          : "bg-gray-300 hover:bg-gray-400 border-gray-400"
                      }`}
                    >
                      {t.clearSearch || "Clear Search"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-6 py-2 rounded font-bold border ${
                      isDarkMode 
                        ? "bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500" 
                        : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                    }`}
                  >
                    {t.browseAllCategories || "Browse All Categories"}
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
                    className={`block p-3 rounded-lg text-center transition-all border border-gray-200 ${
                      isDarkMode 
                        ? "bg-gray-700 hover:bg-gray-600 hover:shadow-lg" 
                        : "bg-white hover:bg-gray-50 hover:shadow-md"
                    } shadow hover:scale-105`}
                  >
                    <img
                      src={item.imageName || "/src/assets/placeholder.png"}
                      alt={item.title}
                      className="w-full h-32 object-contain rounded mb-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = "/src/assets/placeholder.png";
                      }}
                    />
                    <h3 className="font-bold text-sm mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs opacity-75 mb-1">#{item.number}</p>
                    <p className="text-xs opacity-60 mb-2">{item.category}</p>
                    {item.exclusive && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs border ${
                          isDarkMode ? "bg-blue-600 border-blue-600" : "bg-blue-600 border-blue-600"
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
      <footer className={`text-center py-4 mt-8 border-t border-gray-200 ${
        isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-700"
      }`}>
        © 2024 Pop&Go! All rights reserved.
      </footer>
    </div>
  );
};

export default CategoriesSite;