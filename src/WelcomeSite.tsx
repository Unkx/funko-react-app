import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations } from "./Translations/TranslationsWelcomeSite";
import "./WelcomeSite.css";

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
  series: string[];
  exclusive: boolean;
  imageName: string;
}

interface FunkoItemWithId extends FunkoItem {
  id: string;
}

const languages = {
  EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
};

// Helper to generate consistent IDs
const generateId = (title: string | undefined, number: string | undefined): string => {
  const safeTitle = title ? title.trim() : "";
  const safeNumber = number ? number.trim() : "";
  return `${safeTitle}-${safeNumber}`.replace(/\s+/g, "-");
};

const WelcomeSite: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [funkoData, setFunkoData] = useState<FunkoItemWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load preferences on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("preferredLanguage");
    if (savedLang && languages[savedLang as keyof typeof languages]) {
      setLanguage(savedLang);
    }

    const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
    if (!hasSeenPopup) {
      setShouldShowPopup(true);
      localStorage.setItem("hasSeenLanguagePopup", "true");
    }

    // Load theme
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Save theme
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageDropdown]);

  // Fetch Funko data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        const rawData: FunkoItem[] = await response.json();

        const dataWithIds = rawData.map((item) => ({
          ...item,
          id: generateId(item.title, item.number),
        }));

        setFunkoData(dataWithIds);
      } catch (err) {
        console.error("Error loading Funko data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get 3 random items
  const getRandomItems = (): FunkoItemWithId[] => {
    if (funkoData.length === 0) return [];
    const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // Get 3 most visited items
  const getMostVisitedItems = (): FunkoItemWithId[] => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    const sorted = [...funkoData]
      .map((item) => ({
        ...item,
        visits: visitCount[item.id] || 0,
      }))
      .sort((a, b) => b.visits - a.visits)
      .filter((item) => item.visits > 0);
    return sorted.slice(0, 3);
  };

  const randomItems = getRandomItems();
  const mostVisitedItems = getMostVisitedItems();

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  const handleItemClick = (id: string) => {
    // Increment visit count
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
  };

  return (
    <div
      className={`welcome-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* Header */}
      <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
          <Link to="/" className="no-underline">
            <h1
              className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
                isDarkMode ? "text-yellow-400" : "text-green-600"
              }`}
            >
              Pop&Go!
            </h1>
          </Link>
          {shouldShowPopup && (
            <LanguageSelectorPopup onClose={() => setShouldShowPopup(false)} />
          )}
        </div>

        {/* Search Form */}
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
                : "bg-white text-black"
            }`}
            aria-label="Search input"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Theme & Language Toggle + Login Button */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
          <div className="relative inline-block">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`language-toggle-button p-2 rounded-full flex items-center gap-1 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
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
                ref={dropdownRef}
                className={`language-dropdown-container absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
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

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              if (user.role === "admin") {
                navigate("/adminSite");
              } else if (user.role === "user") {
                navigate("/dashboardSite");
              } else {
                navigate("/loginSite");
              }
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

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center">
        {/* Random Items */}
        <section className="w-full max-w-4xl mb-10">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.randomItems || "Random Funko Pops"}</h2>
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {randomItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                  <img
                    src={item.imageName || "/src/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                    }}
                  />
                  <h3 className="font-bold text-center">{item.title}</h3>
                  <p className="text-sm text-center">
                    #{item.number} • {item.series.join(", ")}
                  </p>
                  {item.exclusive && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-yellow-600" : "bg-green-600"
                      }`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}

              <Link 
              to="/caterogies"
              className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                <h2 className="text-2xl font-bold mb-4 text-center">{t.goToCategories || "Go to Catergories"}</h2>
              </Link>

            </div>
          )}
        </section>

        {/* Most Visited Items */}
        <section className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.mostVisited || "Most Visited Funko Pops"}</h2>
          {mostVisitedItems.length === 0 ? (
            <p className="text-center text-gray-500">{t.noVisitsYet || "No items visited yet."}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {mostVisitedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                  <img
                    src={item.imageName || "/src/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                    }}
                  />
                  <h3 className="font-bold text-center">{item.title}</h3>
                  <p className="text-sm text-center">
                    #{item.number} • {item.series.join(", ")}
                  </p>
                  {item.exclusive && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-yellow-600" : "bg-green-600"
                      }`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}

              <Link 
              to="/mostVisited"
              className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                <h2 className="text-2xl font-bold mb-4 text-center">{t.goToMostVisited || "Go to Most Visited"}</h2>
              </Link>

            </div>
            
          )}
        </section>

        {/* CTA Button */}
        {/* <div className="mt-12">
          <Link
            to="/searchsite"
            className={`px-6 py-3 rounded-lg font-bold ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            } transition-colors`}
          >
            {t.goToSearch}
          </Link>
        </div> */}
      </main>

      {/* Footer */}
      <footer
        className={`text-center py-4 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-300 text-gray-700"
        }`}
      >
        {t.copyright}
      </footer>
    </div>
  );
};

export default WelcomeSite;