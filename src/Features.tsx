// src/pages/FeaturesSite.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

import { translations } from "./Translations/TranslationFeatures";
// Feature categories data
const featureCategories = [
  {
    titleKey: "collectionManagement",
    features: [
      { emoji: "📚", titleKey: "feature1Title", descKey: "feature1Desc" },
      { emoji: "⭐", titleKey: "feature2Title", descKey: "feature2Desc" },
      { emoji: "🏷️", titleKey: "feature11Title", descKey: "feature11Desc" },
      { emoji: "⚡", titleKey: "feature12Title", descKey: "feature12Desc" },
    ],
    color: "from-blue-500 to-blue-600",
    darkColor: "from-blue-600 to-blue-700",
  },
  {
    titleKey: "discoveryTools",
    features: [
      { emoji: "🔍", titleKey: "feature3Title", descKey: "feature3Desc" },
      { emoji: "📊", titleKey: "feature4Title", descKey: "feature4Desc" },
      { emoji: "🤖", titleKey: "feature5Title", descKey: "feature5Desc" },
      { emoji: "📈", titleKey: "feature10Title", descKey: "feature10Desc" },
    ],
    color: "from-green-500 to-green-600",
    darkColor: "from-green-600 to-green-700",
  },
  {
    titleKey: "communityFeatures",
    features: [
      { emoji: "👥", titleKey: "feature8Title", descKey: "feature8Desc" },
      { emoji: "📤", titleKey: "feature7Title", descKey: "feature7Desc" },
      { emoji: "🌐", titleKey: "feature6Title", descKey: "feature6Desc" },
      { emoji: "🌙", titleKey: "feature9Title", descKey: "feature9Desc" },
    ],
    color: "from-purple-500 to-purple-600",
    darkColor: "from-purple-600 to-purple-700",
  },
];

// Steps data
const steps = [
  { number: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { number: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { number: "03", titleKey: "step3Title", descKey: "step3Desc" },
];

// Stats data
const stats = [
  { value: "5,000+", labelKey: "activeUsers" },
  { value: "170,000+", labelKey: "itemsTracked" },
  { value: "1,200+", labelKey: "collections" },
  { value: "50+", labelKey: "categories" },
];

// 🌐 Languages for dropdown
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

const FeaturesSite: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("preferredTheme");
    return saved ? saved === "dark" : true;
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const navigate = useNavigate();

  const t = translations[language as keyof typeof translations] || translations.EN;

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000);
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

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-blue-50 to-green-50 text-gray-800"}`}>
      {/* Header */}
      <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
          <Link to="/" className="no-underline">
            <h1 className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
              isDarkMode ? "text-yellow-400" : "text-blue-600"
            }`}>
              Pop&Go!
            </h1>
          </Link>
        </div>

        {/* 🔍 Search */}
        <form
          onSubmit={handleSearch}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-white shadow-md"
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

        {/* 🌐 Language, 🌙 Theme, 🔐 Dashboard */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0 min-w-0 items-center">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`p-2 rounded-full flex items-center gap-1 min-w-0 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-white hover:bg-gray-100 shadow-sm"
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
                className={`absolute mt-2 z-50 lang-dropdown variant-b rounded-lg shadow-xl py-1 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
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
                          ? "bg-yellow-500 text-black"
                          : "bg-blue-600 text-white"
                        : isDarkMode
                        ? "hover:bg-gray-700"
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
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100 shadow-sm"
            }`}
            aria-label={isDarkMode ? t.switchToLight : t.switchToDark}
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
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }`}
          >
            {t.goToDashboard}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 dark:from-blue-900/20 dark:to-green-900/20"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 dark:from-yellow-400 dark:to-green-400 bg-clip-text text-transparent">
              {t.pageTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {t.heroTitle}
            </p>
            <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto">
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-8 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">{t.statsTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-2xl transition-transform hover:scale-105 ${
                  isDarkMode ? "bg-gray-700" : "bg-gradient-to-br from-blue-50 to-green-50 shadow-lg"
                }`}
              >
                <div className={`text-3xl md:text-4xl font-bold mb-2 ${
                  index === 0 ? "text-yellow-500" :
                  index === 1 ? "text-blue-500" :
                  index === 2 ? "text-green-500" : "text-purple-500"
                }`}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium">{t[stat.labelKey as keyof typeof t]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16 last:mb-0">
              <h2 className={`text-2xl font-bold mb-8 inline-block px-6 py-2 rounded-full ${
                isDarkMode 
                  ? `bg-gradient-to-r ${category.darkColor} text-white`
                  : `bg-gradient-to-r ${category.color} text-white`
              }`}>
                {t[category.titleKey as keyof typeof t]}
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className={`p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      isDarkMode 
                        ? "bg-gray-800 hover:bg-gray-700" 
                        : "bg-white hover:shadow-xl border border-gray-100"
                    }`}
                  >
                    <div className={`text-3xl mb-4 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
                      {feature.emoji}
                    </div>
                    <h3 className="text-xl font-bold mb-3">
                      {t[feature.titleKey as keyof typeof t]}
                    </h3>
                    <p className="opacity-90 text-sm">
                      {t[feature.descKey as keyof typeof t]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-800" : "bg-gradient-to-br from-blue-50 to-green-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
              >
                <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl z-10 ${
                  index === 0 ? "bg-blue-500" :
                  index === 1 ? "bg-green-500" : "bg-purple-500"
                }`}>
                  {step.number}
                </div>
                <div className={`p-6 pt-10 rounded-2xl relative ${
                  isDarkMode ? "bg-gray-700" : "bg-white shadow-lg"
                }`}>
                  <h3 className="text-xl font-bold mb-3">
                    {t[step.titleKey as keyof typeof t]}
                  </h3>
                  <p className="opacity-90">
                    {t[step.descKey as keyof typeof t]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className={`max-w-4xl mx-auto p-8 rounded-3xl ${
            isDarkMode 
              ? "bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700" 
              : "bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 shadow-2xl"
          }`}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Experience Pop&Go!</h3>
                <p className="mb-6 opacity-90">
                  See how our features work together to create the perfect collection management experience.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                    }`}>
                      ✓
                    </div>
                    <span>Easy item cataloging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                    }`}>
                      ✓
                    </div>
                    <span>Smart wishlist management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                    }`}>
                      ✓
                    </div>
                    <span>Community features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                    }`}>
                      ✓
                    </div>
                    <span>AI-powered tools</span>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-2xl ${
                isDarkMode ? "bg-gray-800" : "bg-white shadow-inner"
              }`}>
                <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-400/20 to-green-400/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl mb-4 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
                      🎯
                    </div>
                    <p className="font-bold">All Features Included</p>
                    <p className="text-sm opacity-75 mt-2">No premium tiers, no hidden costs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-gradient-to-r from-blue-600 to-green-600"}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            {t.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-white opacity-90 max-w-2xl mx-auto">
            {t.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/loginregistersite"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                isDarkMode
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
              }`}
            >
              {t.startFreeButton}
            </Link>
            <Link
              to="/mostvisited"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                  : "bg-transparent text-white border-2 border-white hover:bg-white/10"
              }`}
            >
              {t.exploreDemoButton}
            </Link>
            <Link
              to="/categories"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                isDarkMode
                  ? "bg-transparent text-white border-2 border-white hover:bg-white/10"
                  : "bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg"
              }`}
            >
              {t.seeCollectionsButton}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 ${isDarkMode ? "bg-gray-950 text-gray-400" : "bg-white text-gray-600"}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link to="/" className="no-underline">
                <h2 className={`text-2xl font-bold font-[Special_Gothic_Expanded_One] ${
                  isDarkMode ? "text-yellow-400" : "text-blue-600"
                }`}>
                  Pop&Go!
                </h2>
              </Link>
              <p className="mt-2">{t.copyright}</p>
            </div>
            <div className="flex gap-6">
              <Link to="/features" className="hover:underline font-semibold">{t.pageTitle}</Link>
              <Link to="/about" className="hover:underline">About Us</Link>
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesSite;
