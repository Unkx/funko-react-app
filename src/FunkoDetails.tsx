import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { translations } from "./Translations/TranslationsFunkoDetails";

// Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

// Flags
import UKFlag from "/src/assets/flags/uk.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";

// Types
interface FunkoItem {
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

interface FunkoItemWithId extends FunkoItem {
  id: string;
}

const FunkoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [funkoItem, setFunkoItem] = useState<FunkoItemWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCollection, setInCollection] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const t = translations[language] || translations["EN"];

  // Helper functions
  const getStoredItems = (key: string): FunkoItemWithId[] => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  };

  const saveStoredItems = (key: string, items: FunkoItemWithId[]) => {
    localStorage.setItem(key, JSON.stringify(items));
  };

  const isInList = (list: FunkoItemWithId[], itemId: string) => {
    return list.some((item) => item.id === itemId);
  };

  const toggleInList = (key: string, item: FunkoItemWithId) => {
    const list = getStoredItems(key);
    const exists = isInList(list, item.id);

    if (exists) {
      saveStoredItems(key, list.filter((i) => i.id !== item.id));
    } else {
      saveStoredItems(key, [...list, item]);
    }

    // Update UI state
    setInWishlist(isInList(getStoredItems("wishlist"), item.id));
    setInCollection(isInList(getStoredItems("collection"), item.id));
  };

  // Generate ID from title and number
  const generateId = (title: string | undefined, number: string | undefined): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`.replace(/\s+/g, "-");
  };

  // Fetch Funko data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data: FunkoItem[] = await response.json();

        const dataWithIds: FunkoItemWithId[] = data.map((item) => ({
          ...item,
          id: generateId(item.title, item.number),
        }));

        const foundItem = dataWithIds.find((item) => item.id === id);
        if (!foundItem) throw new Error("Funko Pop not found");

        setFunkoItem(foundItem);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Update wishlist/collection status when funkoItem loads
  useEffect(() => {
    if (funkoItem) {
      const wishlist = getStoredItems("wishlist");
      const collection = getStoredItems("collection");
      setInWishlist(isInList(wishlist, funkoItem.id));
      setInCollection(isInList(collection, funkoItem.id));
    }
  }, [funkoItem]);

  // Theme effect
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Language effect
  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // Languages config
  const languages = {
    EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  };

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  const loginButtonTo = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "admin") return "/adminSite";
    if (user?.role === "user") return "/dashboardSite";
    return "/loginSite";
  }, []);

  const loginButtonText = useMemo(() => {
    return localStorage.getItem("user")
      ? t.goToDashboard || "Dashboard"
      : t.goToLoginSite || "Log In";
  }, [t]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-neutral-400"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${isDarkMode ? "border-yellow-500" : "border-green-600"}`}></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
        <div className="text-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className={`px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"}`}
          >
            {t.backButton}
          </button>
        </div>
      </div>
    );
  }

  if (!funkoItem) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
        <p>Error: Funko Pop data not available.</p>
        <button
          onClick={() => navigate(-1)}
          className={`px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"}`}
        >
          {t.backButton}
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 relative">
        <div className="flex-shrink-0">
          <Link to="/" className="no-underline">
            <h1 className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              Pop&Go!
            </h1>
          </Link>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className={`flex-grow max-w-lg w-full md:w-auto mx-auto flex rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-grow px-4 py-2 outline-none ${isDarkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-white text-black"}`}
            aria-label="Search input"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"}`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Theme & Language */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              aria-label="Select language"
              aria-expanded={showLanguageDropdown}
            >
              <GlobeIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{language}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
            </button>
            {showLanguageDropdown && (
              <div
                ref={dropdownRef}
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
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
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <span className="w-5 h-5">{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Login Button */}
        <div>
          <Link
            to={loginButtonTo}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loginButtonText}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"}`}
        >
          {t.backButton}
        </button>

        <a
          href={`https://vinylcave.pl/pl/searchquery/${encodeURIComponent(funkoItem.title)}/1/full/5?url=${encodeURIComponent(funkoItem.title)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.searchOnVinylCave || "Search on VinylCave.pl"}
        </a>

        <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h1 className="text-3xl font-bold mb-2">{funkoItem.title}</h1>

          {/* Wishlist & Collection Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => funkoItem && toggleInList("wishlist", funkoItem)}
              className={`px-4 py-2 rounded flex-1 transition ${
                inWishlist
                  ? isDarkMode
                    ? "bg-red-600 text-white"
                    : "bg-red-500 text-white"
                  : isDarkMode
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {inWishlist ? t.removeFromWishlist || "Remove from Wishlist" : t.addToWishlist || "Add to Wishlist"}
            </button>

            <button
              onClick={() => funkoItem && toggleInList("collection", funkoItem)}
              className={`px-4 py-2 rounded flex-1 transition ${
                inCollection
                  ? isDarkMode
                    ? "bg-green-600 text-white"
                    : "bg-green-500 text-white"
                  : isDarkMode
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {inCollection ? t.removeFromCollection || "Remove from Collection" : t.addToCollection || "Add to Collection"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">{t.details}</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{t.number}:</span> {funkoItem.number || "N/A"}
                </p>
                <p>
                  <span className="font-medium">{t.category}:</span> {funkoItem.category || "N/A"}
                </p>
                <p>
                  <span className="font-medium">{t.series}:</span> {funkoItem.series?.join(", ") || "N/A"}
                </p>
                {funkoItem.exclusive && (
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm ${isDarkMode ? "bg-yellow-600" : "bg-green-600"}`}
                  >
                    {t.exclusive}
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">{t.additionalInformation}</h2>
              <div className={`p-4 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}>
                {funkoItem.imageName ? (
                  <img
                    src={funkoItem.imageName}
                    alt={funkoItem.title}
                    className="rounded w-full h-auto max-h-80 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                      e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <p className="italic">{t.noImageAvailable}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-4 ${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"}`}>
        {t.copyright}
      </footer>
    </div>
  );
};

export default FunkoDetails;