import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations } from "./Translations/TranslationsDashboard";

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

const languages = {
  EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
};

const Admin: React.FC = () => {
  // Load theme from localStorage using "preferredTheme"
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });

  const [name, setName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [user, setUser] = useState<{ name: string; surname:string; email: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const t = translations[language] || translations["EN"];

  // Apply theme to document and save to localStorage
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load user data, preferred language, popup settings
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/LoginSite"); // Redirect if not logged in
    }

    const savedLang = localStorage.getItem("preferredLanguage");
    if (savedLang && languages[savedLang as keyof typeof languages]) {
      setLanguage(savedLang);
    }

    const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
    if (!hasSeenPopup) {
      setShouldShowPopup(true);
      localStorage.setItem("hasSeenLanguagePopup", "true");
    }

    // Click outside handler for language dropdown
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown, navigate]);

  // Change language
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  // Toggle theme
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Toggle language dropdown
  const toggleLanguageDropdown = () =>
    setShowLanguageDropdown((prev) => !prev);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/LoginSite");
  };

  return (
    <div
      className={`welcome-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* Header */}
      <header className="py-4 px-8 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 relative">
        <div className="flex-shrink-0">
          <Link to="/" className="no-underline">
            <h1
              className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
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
          className={`flex-grow max-w-lg mx-auto flex rounded-lg overflow-hidden ${
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

        {/* Theme & Language Toggle */}
        <div className="flex-shrink-0 flex gap-4">
          {/* Language Dropdown */}
          <div className="relative">
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
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                  isDarkMode ? "bg-gray-700" : "bg-white"
                }`}
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
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main content - Dashboard */}
      <main className="flex-grow p-8 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">{t.welcome} {user?.name || ""}</h3>
        <h2
          className={`text-3xl font-bold mb-6 ${
            isDarkMode ? "text-yellow-400" : "text-green-600"
          }`}
        >
          {t.dashboardWelcome} 
        </h2>

        <div
          className={`max-w-2xl w-full bg-opacity-50 p-6 rounded-lg shadow-lg ${
            isDarkMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <h3 className="text-xl font-semibold mb-4">{t.welcome} {user?.name || ""} {user?.surname || ""}</h3>
          <ul className="space-y-2">
            <li>
              <strong>{t.name}:</strong> {user?.name || "N/A"}
            </li>
            <li>
              <strong>{t.surname}:</strong> {user?.surname || "N/A"}
            </li>
            <li>
              <strong>{t.email}:</strong> {user?.email || "N/A"}
            </li>
          </ul>
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              {t.logout}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`text-center py-4 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"
        }`}
      >
        {t.copyright}
      </footer>
    </div>
  );
};

export default Admin;