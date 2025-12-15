// src/pages/AboutUsSite.tsx
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

import TeamMember1 from "/src/assets/avatars/boy.png";
import TeamMember2 from "/src/assets/avatars/woman.png";
import TeamMember3 from "/src/assets/avatars/man.png";
import { translations } from "./Translations/TranslationAboutUs";
// Team members data
const teamMembers = [
  {
    name: "Alex Johnson",
    role: "Founder & Collector",
    bio: "Funko collector since 2010 with over 1500 items. Created Pop&Go! to solve collection management challenges.",
    image: TeamMember1,
  },
  {
    name: "Maria Chen",
    role: "UI/UX Designer",
    bio: "Design enthusiast and anime collector. Focuses on creating intuitive and beautiful collection interfaces.",
    image: TeamMember2,
  },
  {
    name: "David Wilson",
    role: "Lead Developer",
    bio: "Tech wizard and Marvel collector. Built the entire platform with collectors' needs in mind.",
    image: TeamMember3,
  },
];

// Features data
const features = [
  { emoji: "📚", titleKey: "feature1Title", descKey: "feature1Desc" },
  { emoji: "⭐", titleKey: "feature2Title", descKey: "feature2Desc" },
  { emoji: "📊", titleKey: "feature3Title", descKey: "feature3Desc" },
  { emoji: "👥", titleKey: "feature4Title", descKey: "feature4Desc" },
  { emoji: "🤖", titleKey: "feature5Title", descKey: "feature5Desc" },
  { emoji: "🌐", titleKey: "feature6Title", descKey: "feature6Desc" },
];

// Testimonials data
const testimonials = [
  { textKey: "testimonial1", authorKey: "testimonial1Author" },
  { textKey: "testimonial2", authorKey: "testimonial2Author" },
  { textKey: "testimonial3", authorKey: "testimonial3Author" },
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

const AboutUsSite: React.FC = () => {
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

  // Stats data
  const stats = [
    { value: "5,000+", label: t.users },
    { value: "170,000+", label: t.itemsTracked },
    { value: "1,200+", label: t.collections },
    { value: "50+", label: t.categories },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-50 to-green-50 text-gray-800"}`}>
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
            aria-label="Search for Funko Pops"
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/categories"
                className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                  isDarkMode
                    ? "bg-yellow-500 text-black hover:bg-yellow-600"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                }`}
              >
                {t.startButton}
              </Link>
              <Link
                to="/features"
                className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
                }`}
              >
                {t.exploreButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                  <span className={`p-2 rounded-full ${isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-100 text-blue-600"}`}>
                    📖
                  </span>
                  {t.ourStory}
                </h2>
                <p className="text-lg mb-8 leading-relaxed">
                  {t.storyContent}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <span className={`p-1 rounded ${isDarkMode ? "bg-green-500" : "bg-green-100 text-green-600"}`}>
                        🎯
                      </span>
                      {t.ourMission}
                    </h3>
                    <p className="opacity-90">{t.missionContent}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <span className={`p-1 rounded ${isDarkMode ? "bg-purple-500" : "bg-purple-100 text-purple-600"}`}>
                        👁️
                      </span>
                      {t.ourVision}
                    </h3>
                    <p className="opacity-90">{t.visionContent}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-2xl ${isDarkMode ? "bg-gray-700" : "bg-gradient-to-br from-blue-50 to-green-50"} shadow-xl`}>
                <h3 className="text-2xl font-bold mb-8 text-center">{t.statsTitle}</h3>
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`text-center p-4 rounded-xl transition-transform hover:scale-105 ${
                        isDarkMode ? "bg-gray-600" : "bg-white shadow-md"
                      }`}
                    >
                      <div className={`text-3xl font-bold mb-2 ${
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-blue-500" :
                        index === 2 ? "text-green-500" : "text-purple-500"
                      }`}>
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-50 to-green-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.featuresTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  isDarkMode 
                    ? "bg-gray-800 hover:bg-gray-700" 
                    : "bg-white hover:shadow-xl border border-gray-100"
                }`}
              >
                <div className={`text-4xl mb-4 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
                  {feature.emoji}
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {t[feature.titleKey as keyof typeof t]}
                </h3>
                <p className="opacity-90">
                  {t[feature.descKey as keyof typeof t]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.meetTheTeam}</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.teamDescription}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl text-center transition-transform hover:scale-105 ${
                  isDarkMode ? "bg-gray-700" : "bg-gradient-to-b from-blue-50 to-green-50 shadow-lg"
                }`}
              >
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                  isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                }`}>
                  {member.role}
                </div>
                <p className="opacity-90 text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-50 to-green-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.testimonialsTitle}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl ${
                  isDarkMode ? "bg-gray-800" : "bg-white shadow-lg"
                }`}
              >
                <div className="text-4xl mb-4 opacity-50">"</div>
                <p className="italic mb-6 text-lg">
                  {t[testimonial.textKey as keyof typeof t]}
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{t[testimonial.authorKey as keyof typeof t]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${isDarkMode ? "bg-gradient-to-r from-gray-800 to-gray-900" : "bg-gradient-to-r from-blue-600 to-green-600"}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            {t.joinCommunity}
          </h2>
          <p className="text-xl mb-8 text-white opacity-90 max-w-2xl mx-auto">
            {t.joinDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                isDarkMode
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "bg-white text-blue-600 hover:bg-gray-100"
              }`}
            >
              {t.startButton}
            </Link>
            <Link
              to="/features"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                  : "bg-transparent text-white border-2 border-white hover:bg-white/10"
              }`}
            >
              {t.exploreButton}
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
              <Link to="/about" className="hover:underline font-semibold">{t.pageTitle}</Link>
              <Link to="/features" className="hover:underline">Features</Link>
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUsSite;