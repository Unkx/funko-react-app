import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsWelcomeSite";
import { useMemo } from "react";

import "./WelcomeSite.css";
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import WorldMap from "./Maps/WorldMap"; // ✅ Import map

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

// 📚 Language display names
const languageNames = {
  EN: "English",
  PL: "Polski",
  RU: "Русский",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
};

// 🔢 Generate unique ID for Funko items
const generateId = (title: string, number: string): string => {
  const safeTitle = title?.trim() || "";
  const safeNumber = number?.trim() || "";
  return `${safeTitle}-${safeNumber}`.replace(/\s+/g, "-");
};

const WelcomeSite: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("preferredTheme");
    return saved ? saved === "dark" : true;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("USA");

  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("preferredLanguage");
    return saved || "EN";
  });

  const [region, setRegion] = useState<string>("North America");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false); // Optional: remove if unused
  const [funkoData, setFunkoData] = useState<FunkoItemWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorldMapFirstTime, setShowWorldMapFirstTime] = useState(false);

  const navigate = useNavigate();
  const t = useMemo(() => translations[language] || translations["EN"], [language]);  

  // Refs for dropdowns
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // Toggle language dropdown
  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prev) => !prev);
  };

  // 🌐 Centralized country configuration
  const countries = {
    USA: {
      name: "USA",
      flag: <USAFlag className="w-5 h-5" />,
      region: "North America",
      language: "EN",
    },
    UK: {
      name: "UK",
      flag: <UKFlag className="w-5 h-5" />,
      region: "Europe",
      language: "EN",
    },
    PL: {
      name: "Poland",
      flag: <PolandFlag className="w-5 h-5" />,
      region: "Europe",
      language: "PL",
    },
    RU: {
      name: "Russia",
      flag: <RussiaFlag className="w-5 h-5" />,
      region: "Europe",
      language: "RU",
    },
    FR: {
      name: "France",
      flag: <FranceFlag className="w-5 h-5" />,
      region: "Europe",
      language: "FR",
    },
    DE: {
      name: "Germany",
      flag: <GermanyFlag className="w-5 h-5" />,
      region: "Europe",
      language: "DE",
    },
    ES: {
      name: "Spain",
      flag: <SpainFlag className="w-5 h-5" />,
      region: "Europe",
      language: "ES",
    },
  };

  // 🌍 Languages for dropdown (with flag)
  const languages = {
    US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
    EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
  };

  // 🌐 Detect country from browser language
  const detectCountryFromLocale = (locale: string): string | null => {
    const map: Record<string, string> = {
      us: "USA",
      "en-US": "USA",
      en:"UK",
      "en-GB": "UK",
      pl: "PL",
      "pl-PL": "PL",
      ru: "RU",
      "ru-RU": "RU",
      fr: "FR",
      "fr-FR": "FR",
      de: "DE",
      "de-DE": "DE",
      es: "ES",
      "es-ES": "ES",
    };
    return map[locale] || map[locale.split("-")[0]] || null;
  };

  // 🧩 Initial setup: load preferences or detect locale
  useEffect(() => {
    const savedCountry = localStorage.getItem("preferredCountry");
    const countryData = savedCountry && countries[savedCountry as keyof typeof countries]
      ? countries[savedCountry as keyof typeof countries]
      : null;

    if (countryData && savedCountry) {
      setSelectedCountry(savedCountry);
      setLanguage(countryData.language);
      setRegion(countryData.region);
    } else {
      const detected = detectCountryFromLocale(navigator.language);
      const detectedData = detected ? countries[detected as keyof typeof countries] : null;
      if (detectedData && detected) {
        setSelectedCountry(detected);
        setLanguage(detectedData.language);
        setRegion(detectedData.region);
      }
    }

    const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
    if (!hasSeenPopup) {
      setShouldShowPopup(true);
      localStorage.setItem("hasSeenLanguagePopup", "true");
    }

    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // Check if user has seen world map
    const hasSeenMap = localStorage.getItem("hasSeenWorldMap");
    if (!hasSeenMap) {
      setShowWorldMapFirstTime(true);
      localStorage.setItem("hasSeenWorldMap", "true");
    }
  }, [isDarkMode]);

  // 🌙 Theme sync
  useEffect(() => {
      localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
  }, [isDarkMode]);

  // 🧩 Initial setup: load preferences or detect locale
  useEffect(() => {
      const savedCountry = localStorage.getItem("preferredCountry");
      const savedLanguage = localStorage.getItem("preferredLanguage");
      const hasSeenMap = localStorage.getItem("hasSeenWorldMap");

      // Load saved language first
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }

      // Then load country data if available
      if (savedCountry) {
          const countryData = countries[savedCountry as keyof typeof countries];
          if (countryData) {
              setSelectedCountry(savedCountry);
              setRegion(countryData.region);
          }
      } else {
        // Detect from browser if no country saved
        const detected = detectCountryFromLocale(navigator.language);
        const detectedData = detected ? countries[detected as keyof typeof countries] : null;
        if (detectedData && detected) {
          setSelectedCountry(detected);
          setLanguage(detectedData.language);
          setRegion(detectedData.region);
        }
      }

      // Check if user has seen world map
      if (!hasSeenMap) {
        setShowWorldMapFirstTime(true);
        localStorage.setItem("hasSeenWorldMap", "true");
      }
  }, []); // <-- Empty dependency array. This ensures it runs only once.
  // 📥 Fetch Funko data
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

  // 🎲 Get 3 random items
  const getRandomItems = (): FunkoItemWithId[] => {
    if (funkoData.length === 0) return [];
    const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // 🔥 Get most visited items
  const getMostVisitedItems = (): FunkoItemWithId[] => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    return [...funkoData]
      .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
      .sort((a, b) => b.visits - a.visits)
      .filter((item) => item.visits > 0)
      .slice(0, 3);
  };

  // 🌍 Handle country selection
  const handleCountryChange = (countryCode: string) => {
    const countryData = countries[countryCode as keyof typeof countries];
    if (countryData) {
      setSelectedCountry(countryCode);
      setLanguage(countryData.language);
      setRegion(countryData.region);
      localStorage.setItem("preferredCountry", countryCode);
      localStorage.setItem("preferredLanguage", countryData.language);
      setShowCountryDropdown(false);
    }
  };

  // 🗺️ Handle map click
  const handleMapCountryClick = (mapCode: string) => {
    const codeMap: Record<string, string> = {
      US: "USA",
      GB: "UK",
      DE: "DE",
      FR: "FR",
      PL: "PL",
      RU: "RU",
      ES: "ES",
      CA: "USA", // Canada → North America
    };
    const appCode = codeMap[mapCode];
    if (appCode) handleCountryChange(appCode);
  };

  // 🔍 Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // 👁️ Track item visits
  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
  };

  // 🌙 Toggle theme
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Select language
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

// Memoize random items — only change when funkoData changes
const randomItems = useMemo(() => {
  if (funkoData.length === 0) return [];
  const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}, [funkoData]); // Only recompute when funkoData changes

// Memoize most visited items — recompute when funkoData or visit counts change
const mostVisitedItems = useMemo(() => {
  const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
  return [...funkoData]
    .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
    .sort((a, b) => b.visits - a.visits)
    .filter((item) => item.visits > 0)
    .slice(0, 3);
}, [funkoData]); // Note: localStorage isn't reactive, so this won't auto-update on visit

  return (
    <div
      className={`welcome-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* 🌍 First-Time World Map Popup */}
      {showWorldMapFirstTime && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full">
            <button
              onClick={() => setShowWorldMapFirstTime(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
              aria-label="Close map"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              {t.regionMapTitle || "Explore by Region"}
            </h2>
            <WorldMap
              onSelectCountry={(code) => {
                handleMapCountryClick(code);
                setShowWorldMapFirstTime(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 🔝 Header */}
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

        {/* 🌐 Country, 🌙 Theme, 🔐 Login */}
                <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
                  {/* Language Dropdown */}
                  <div className="relative">
                    <button
                      ref={languageButtonRef}
                      onClick={toggleLanguageDropdown}
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
                        ref={languageDropdownRef}
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

      {/* 🧭 Main Content */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center">
        {/* 📍 Current language & region */}
        <div className={`mb-6 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          <p className="text-sm">
            {languageNames[language] || "Unknown"} • {region}
          </p>
        </div>

        {/* 🎲 Random Items */}
        <section className="w-full max-w-4xl mt-10 mb-10">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.randomItems || "Random Items"}</h2>
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
                      } text-white`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                to="/categories"
                className={`block p-4 rounded-lg flex items-center justify-center h-full ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                } shadow transition-transform hover:scale-105`}
              >
                <h2 className="text-xl font-bold">{t.goToCategories || "Browse Categories"}</h2>
              </Link>
            </div>
          )}
        </section>

        {/* 🔥 Most Visited */}
        <section className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.mostVisited || "Most Visited"}</h2>
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
                      } text-white`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                to="/mostVisited"
                className={`block p-4 rounded-lg flex items-center justify-center h-full ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                } shadow transition-transform hover:scale-105`}
              >
                <h2 className="text-xl font-bold">{t.goToMostVisited || "View All Popular"}</h2>
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* 📝 Footer */}
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
