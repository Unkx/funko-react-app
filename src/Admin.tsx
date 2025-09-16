import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationAdmin";
import ItemList from "./ItemList.tsx";
// SVG Icons
import MoonIcon from "./assets/moon.svg?react";
import SunIcon from "./assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
import UsersIcon from "/src/assets/users.svg?react";
import EyeIcon from "/src/assets/eye.svg?react";
import ChartIcon from "/src/assets/chart.svg?react";
import CalendarIcon from "/src/assets/calendar.svg?react";
// Flag SVGs
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";

interface User {
  id: number;
  login: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  created_at: string;
  last_login: string | null;
  is_active?: boolean;
}

interface Item {
  id: number;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

interface SiteStats {
  totalUsers: number;
  totalItems: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  activeUsersLast24Hours: number;
  totalVisits: number;
  averageUsersPerDay: number;
  mostActiveUser: string;
  itemsAddedLast7Days: number;
  itemsAddedLast30Days: number;
}

// 🌍 Centralized country configuration
const countries = {
  USA: {
    name: "United States",
    flag: <USAFlag className="w-5 h-5" />,
    region: "North America",
    language: "EN",
  },
  UK: {
    name: "United Kingdom",
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

// 📚 Language display names
const languageNames = {
  EN: "English",
  PL: "Polski",
  RU: "Русский",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
};

const languages = {
  EN: { name: "English", flag: <USAFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
};

const Admin = () => {
  // Constants
  const SUPER_ADMIN_ID = 1;
  const SUPER_ADMIN_USERNAME = "admin";
  
  // Hooks
  const navigate = useNavigate();

  // State
  const [isDarkMode, setIsDarkMode] = useState(() =>
    localStorage.getItem("preferredTheme") === "dark"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(() => 
    localStorage.getItem("preferredCountry") || "USA"
  );

  const [language, setLanguage] = useState<string>(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    return savedLanguage || "EN";
  });

  const [region, setRegion] = useState<string>("North America");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Item related state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState<Item>({
    id: 0,
    title: "",
    number: "",
    category: "",
    series: [],
    exclusive: false,
    imageName: "",
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Track typing state

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derived values
  const t = translations[language] || translations["EN"];
  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const token: string | null = localStorage.getItem("token");

  // Helper functions
  const isSuperAdmin = (user: User | null): boolean => {
    return user?.id === SUPER_ADMIN_ID || user?.login === SUPER_ADMIN_USERNAME;
  };

  const canDeleteUser = (targetUser: User): boolean => {
    if (!currentUser || currentUser.role !== "admin") return false;
    if (currentUser.id === targetUser.id) return false;
    if (isSuperAdmin(currentUser)) return true;
    return targetUser.role !== "admin";
  };
  
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
  }, [language]);

  // 🌐 Detect country from browser language
  const detectCountryFromLocale = (locale: string): string | null => {
    const map: Record<string, string> = {
      "en-US": "USA",
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

  // Effects
  useEffect(() => {
    if (!token || !currentUser || currentUser.role !== "admin") {
      const timer = setTimeout(() => {
        navigate("/loginSite", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, token, navigate]);

  // 🧩 Initial setup: load preferences or detect locale
  useEffect(() => {
    const savedCountry = localStorage.getItem("preferredCountry");
    const savedLanguage = localStorage.getItem("preferredLanguage");
    const countryData = savedCountry && countries[savedCountry as keyof typeof countries]
      ? countries[savedCountry as keyof typeof countries]
      : null;
    if (countryData && savedCountry) {
      setSelectedCountry(savedCountry);
      setLanguage(
        savedLanguage && languageNames[savedLanguage as keyof typeof languageNames]
          ? savedLanguage
          : countryData.language
      );
      setRegion(countryData.region);
    } else {
      const detected = detectCountryFromLocale(navigator.language);
      const detectedData = detected ? countries[detected as keyof typeof countries] : null;
      if (detectedData && detected) {
        setSelectedCountry(detected);
        setLanguage(
          savedLanguage && language[savedLanguage as keyof typeof language]
            ? savedLanguage
            : detectedData.language
        );
        setRegion(detectedData.region);
      }
    }
  }, []);

  // 🌙 Theme sync
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // 🖱️ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        if (showCountryDropdown) setShowCountryDropdown(false);
        if (showLanguageDropdown) setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountryDropdown, showLanguageDropdown]);

  // Fetch users effect
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !(currentUser?.role === "admin")) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/loginSite");
            setError(t.sessionExpired || "Session expired.");
            return;
          }
          throw new Error((await response.text()) || "Failed to fetch users.");
        }
        const usersData = await response.json();
        setUsers(usersData);
      } catch (err: any) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token, currentUser?.role, t.sessionExpired, navigate]);

  // Fetch site statistics
  useEffect(() => {
    const fetchSiteStats = async () => {
      if (!token || !(currentUser?.role === "admin")) return;
      setStatsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error((await response.text() ) || "Failed to fetch site statistics.");
        }
        const statsData = await response.json();
        setSiteStats(statsData);
      } catch (err: any) {
        console.error( t.failedToLoadStatictics ||"Failed to load site statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchSiteStats();
  }, [token, currentUser?.role]);

  // Optimized search - only search when user has stopped typing and entered at least 2 characters
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Reset filtered items if search term is empty
    if (searchTerm.trim().length === 0) {
      setFilteredItems([]);
      setIsTyping(false);
      return;
    }
    
    // Don't search if less than 2 characters
    if (searchTerm.trim().length < 2) {
      setIsTyping(false);
      return;
    }
    
    // Set typing state
    setIsTyping(true);
    
    // Set a new timeout to perform search after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchItems();
      setIsTyping(false);
    }, 700); // Wait 700ms after user stops typing
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handlers
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("preferredTheme", newMode ? "dark" : "light");
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

  const toggleCountryDropdown = () => setShowCountryDropdown((prev) => !prev);

  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  const selectLanguage = (langCode: string) => {
    setLanguage(langCode);
    localStorage.setItem("preferredLanguage", langCode);
    setShowLanguageDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/loginSite");
  };

  const handleMakeAdmin = async (userId: number, userLogin: string) => {
    if (!window.confirm(`${t.confirmMakeAdmin} ${userLogin}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "admin" }),
      });
      if (!response.ok) throw new Error((await response.text()) || "Failed to promote user.");
      const data = await response.json();
      alert(`${t.userPromoted} ${data.user.login}`);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: "admin" } : u)));
    } catch (err: any) {
      alert(`${t.failedToPromote}: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: number, userLogin: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;
    if (isSuperAdmin(userToDelete)) {
      alert(t.cannotDeleteSuperAdmin || "Super admin accounts cannot be deleted.");
      return;
    }
    if (!canDeleteUser(userToDelete)) {
      alert(t.adminPrivilegesRequired || "You need super admin privileges to delete other admins.");
      return;
    }
    if (!window.confirm(`${t.confirmDeleteUser} ${userLogin}?`)) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.text()) || "Failed to delete user.");
      alert(`${t.userDeleted} ${userLogin}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(`${t.failedToDelete}: ${err.message}`);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.number || !newItem.category) {
      alert("Please fill in required fields (title, number, category).");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/admin/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add item.");
      }
      const createdItem = await response.json();
      alert(`Item added: ${createdItem.title}`);
      setShowAddItemModal(false);
      setNewItem({
        id: 0,
        title: "",
        number: "",
        category: "",
        series: [],
        exclusive: false,
        imageName: "",
      });
      // Clear search if we're adding a new item
      setSearchTerm("");
      setFilteredItems([]);
    } catch (err: any) {
      console.error('Add item error:', err);
      alert(`Failed to add item: ${err.message}`);
    }
  };

  // ✅ Optimized: Search only when user has finished typing
  const handleSearchItems = async () => {
    // Don't search if less than 2 characters or no token
    if (searchTerm.trim().length < 2 || !token) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/items/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Uncommented error checking - this is crucial!
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const searchResults = await response.json();
      setFilteredItems(searchResults);
    } catch (err: any) {
      console.error("Search error:", err);
      alert(`Search failed: ${err.message}`);
      setFilteredItems([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredItems([]);
    setIsTyping(false);
  };

  // Early return if not authorized
  if (!token || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-center px-4">
        <p className="text-red-600 text-3xl font-semibold mb-4">
          {t.accessRestricted || "You have no access here."}
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition text-lg"
        >
          {t.goBackToMainsite || "Go back to main site"}
        </Link>
      </div>
    );
  }

  // Main render
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-100 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to="/" className="no-underline flex-shrink-0">
          <h1 className={`text-3xl sm:text-4xl font-bold font-[Special_Gothic_Expanded_One] ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
            Pop&Go!
          </h1>
        </Link>

        {/* Country, Theme, and Logout */}
        {/* 🌐 Country, 🌙 Theme, 🔐 Login */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 ${
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
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-600"}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

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
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-8 py-6 flex flex-col items-center">
        {/* 📍 Current language & region */}
        <div className={`mb-6 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          <p className="text-sm">
            {languageNames[language]} • {region}
          </p>
        </div>

        {/* Site Statistics Section */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <ChartIcon className="w-6 h-6" />
            {t.siteStatistics || "Site Statistics"}
          </h3>

          {statsLoading ? (
            <p className="text-center text-lg">{t.loadingStatistics || "Loading statistics..."}</p>
          ) : siteStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-blue-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalUsers || "Total Users"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalUsers}</p>
              </div>

              {/* Total Items */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-green-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalItems || "Total Items"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalItems}</p>
              </div>

              {/* New Users (Last 7 Days) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-purple-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.newUsers || "New Users (7 Days)"}</h4>
                <p className="text-2xl font-bold">{siteStats.newUsersLast7Days}</p>
              </div>

              {/* Active Users (Last 24h) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-orange-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.activeUsers24h || "Active Users (24h)"}</h4>
                <p className="text-2xl font-bold">{siteStats.activeUsersLast24Hours}</p>
              </div>

              {/* Total Visits */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-red-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalVisits || "Total Visits"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalVisits}</p>
              </div>

              {/* Average Users Per Day */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-indigo-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
                  <ChartIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.avgUsersPerDay || "Avg. Users/Day"}</h4>
                <p className="text-2xl font-bold">{siteStats.averageUsersPerDay}</p>
              </div>

              {/* Most Active User */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-pink-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mb-2">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.mostActiveUser || "Most Active User"}</h4>
                <p className="text-xl font-bold truncate max-w-full">{siteStats.mostActiveUser || "N/A"}</p>
              </div>

              {/* Items Added (Last 30 Days) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-teal-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-2">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.itemsAdded || "Items Added (30 Days)"}</h4>
                <p className="text-2xl font-bold">{siteStats.itemsAddedLast30Days}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-red-500">{t.failedToLoadStatictics || "Failed to load statistics."}</p>
          )}
        </section>

        {/* Notes section */}
        <div className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">{t.notes || "Notes"}:</h3>
            <ul className="list-disc list-inside space-y-2">
                <li>{t.note1 || "Create two subpages for the user list and item list"}</li>
                <li>{t.note2 || "Organize the item list and refactor it (so the page uses less memory)"}</li>
            </ul>
        </div>

        {/* Users Section */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} mb-8`}>
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t.listOfUsers}</h3>

          {loading ? (
            <p className="text-lg">{t.loading}</p>
          ) : error ? (
            <p className="text-red-500 text-lg">{error}</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className={`min-w-full border-collapse text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"} text-left`}>
                  <tr>
                    <th className="w-16 px-2 sm:px-3 py-2 text-center font-semibold">ID</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Login</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold hidden md:table-cell">Email</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Role</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell">Date of Registration</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell">Last Activity</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Status</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Actions</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-100 odd:bg-white hover:bg-gray-200"}`}>
                      <td className="w-16 px-2 sm:px-3 py-2 text-center">
                        {user.id}
                        {isSuperAdmin(user) && (
                          <span className="block text-xs text-purple-600">★</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 truncate max-w-[100px]" title={user.login}>{user.login}</td>
                      <td className="px-2 sm:px-3 py-2 truncate hidden md:table-cell" title={user.email}>{user.email}</td>
                      <td className="px-2 sm:px-3 py-2 capitalize text-center">
                        {user.role}
                        {isSuperAdmin(user) && (
                          <span className="block text-xs text-purple-600">super</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-2 sm:px-3 py-2 text-center text-xs hidden lg:table-cell">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : t.never}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {user.is_active ? (
                          <span className="text-green-500 font-semibold text-xs sm:text-sm">{t.online}</span>
                        ) : (
                          <span className="text-red-500 font-semibold text-xs sm:text-sm">{t.offline}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleMakeAdmin(user.id, user.login)}
                            className={`px-2 py-1 rounded text-xs sm:text-sm ${
                              isDarkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
                            } text-black font-medium transition whitespace-nowrap`}
                            title={t.makeAdmin || "Make Admin"}
                          >
                            {t.makeAdmin || "Admin"}
                          </button>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.login)}
                            className={`px-2 py-1 rounded text-xs sm:text-sm ${
                              isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                            } text-white font-medium transition whitespace-nowrap`}
                            title={t.deleteUser || "Delete User"}
                          >
                            {t.deleteUser || "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-lg">
                        {t.noUsersFound}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Items Section */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mt-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
            <h3 className="text-xl sm:text-2xl font-semibold">{t.listOfItems || "List of Items"}</h3>
            <button
              onClick={() => setShowAddItemModal(true)}
              className={`px-4 py-2 rounded font-medium flex items-center gap-1 ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } transition`}
            >
              + {t.addItem || "Add Item"}
            </button>
          </div>
          
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                placeholder={t.searchItems || "Search items..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Set typing state when user types
                  setIsTyping(true);
                }}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && !searchLoading && (
              <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {searchTerm.trim().length < 2 ? 
                  t.minimumCharacters || "Enter at least 2 characters to search" : 
                  isTyping ? 
                    t.searching || "Searching..." : 
                    `${filteredItems.length} ${t.resultsFound || "results found"}`
                }
              </p>
            )}
            {searchLoading && (
              <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {t.searching || "Searching..."}
              </p>
            )}
          </div>

          {/* Conditionally render ItemList or search results */}
          {searchTerm ? (
            <div className="overflow-x-auto">
              <table className={`min-w-full border-collapse text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"} text-left`}>
                  <tr>
                    <th className="px-2 sm:px-3 py-2 font-semibold">ID</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Title</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Number</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Category</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Series</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold text-center">Exclusive</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Image</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`transition-colors ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-100 odd:bg-white hover:bg-gray-200"}`}>
                      <td className="px-2 sm:px-3 py-2">{item.id}</td>
                      <td className="px-2 sm:px-3 py-2">{item.title}</td>
                      <td className="px-2 sm:px-3 py-2">{item.number}</td>
                      <td className="px-2 sm:px-3 py-2">{item.category}</td>
                      <td className="px-2 sm:px-3 py-2">
                        {item.series && item.series.length > 0 ? item.series.join(", ") : "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {item.exclusive ? (
                          <span className="text-green-500 font-semibold">✓</span>
                        ) : (
                          <span className="text-red-500 font-semibold">✗</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        {item.imageName ? item.imageName : "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            // Handle edit item if needed
                            console.log("Edit item:", item.id);
                          }}
                          className={`px-2 py-1 rounded text-xs sm:text-sm ${
                            isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                          } text-white font-medium transition mx-1`}
                        >
                          {t.edit || "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && searchTerm.trim().length >= 2 && !searchLoading && !isTyping && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-lg">
                        {t.noItemsFound || "No items found matching your search"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <ItemList
              token={token}
              currentUserRole={currentUser?.role}
              isDarkMode={isDarkMode}
              t={(key: string) => (translations[language] as any)[key]}
            />
          )}
        </section>

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowAddItemModal(false)}>
            <div
              className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">{t.addItem || "Add New Item"}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddItem();
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.itemTitle || "Title"}</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.itemNumber || "Number"}</label>
                  <input
                    type="text"
                    value={newItem.number}
                    onChange={(e) => setNewItem({ ...newItem, number: e.target.value })}
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.category || "Category"}</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.series || "Series (comma-separated)"}</label>
                  <input
                    type="text"
                    placeholder="e.g. Marvel, Avengers"
                    value={newItem.series.join(", ")}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        series: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                  />
                </div>

                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="exclusive"
                    checked={newItem.exclusive}
                    onChange={(e) => setNewItem({ ...newItem, exclusive: e.target.checked })}
                    className="mr-2 h-5 w-5"
                  />
                  <label htmlFor="exclusive" className="text-sm font-medium">
                    {t.exclusive || "Exclusive"}
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t.imageName || "Image Name"}</label>
                  <input
                    type="text"
                    value={newItem.imageName}
                    onChange={(e) => setNewItem({ ...newItem, imageName: e.target.value })}
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
                    } transition`}
                  >
                    {t.cancel || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                    } text-white transition`}
                  >
                    {t.addItem || "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        &copy; {new Date().getFullYear()} Pop&Go! — {t.adminPanel || "Admin Panel"}
      </footer>
    </div>
  );
};

export default Admin;