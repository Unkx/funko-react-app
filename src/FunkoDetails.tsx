// -- For PostgreSQL:
// UPDATE your_table_name 
// SET id = SUBSTRING(id FROM 1 FOR LENGTH(id) - 10) 
// WHERE id LIKE '%-undefined';

// FunkoDetails.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { translations } from "./Translations/TranslationsFunkoDetails";
import axios from "axios";

// Recharts for price history
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) {
  console.warn("VITE_API_BASE_URL is not set, using default localhost URL");
}
const api = axios.create({
  baseURL: baseURL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (
    config.url &&
    !config.url.startsWith("/api") &&
    !config.url.startsWith("http")
  ) {
    config.url = `/api${config.url}`;
  }
  return config;
});

// Types
interface FunkoItem {
  title: string;
  number: string;
  category: string;
  series?: string[];
  exclusive?: boolean;
  imageName?: string | null;
}

interface FunkoItemWithId extends FunkoItem {
  id: string;
}

interface PricePoint {
  date: string;
  price: number;
}

interface Shop {
  name: string;
  url: string;
  searchUrl: string;
  currency: string;
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
  const [language, setLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "EN"
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCollection, setInCollection] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);

  const [selectedCountries, setSelectedCountries] = useState(['poland', 'germany', 'france']);
  const [relatedItems, setRelatedItems] = useState<FunkoItemWithId[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);

  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const t = translations[language] || translations["EN"];

  // Shop configurations by country
  const shops: Record<string, Shop[]> = {
    poland: [
      { name: 'Empik', url: 'empik.com', searchUrl: `https://www.empik.com/szukaj/produkty?q=`, currency: 'PLN' },
      { name: 'Allegro', url: 'allegro.pl', searchUrl: 'https://allegro.pl/listing?string=', currency: 'PLN' },
      { name: 'Media Markt PL', url: 'mediamarkt.pl', searchUrl: 'https://www.mediamarkt.pl/pl/search.html?query=', currency: 'PLN' },
      { name: 'Komputronik', url: 'komputronik.pl', searchUrl: 'https://www.komputronik.pl/search/', currency: 'PLN' },
      { name: 'Merlin.pl', url: 'merlin.pl', searchUrl: 'https://merlin.pl/szukaj/?q=', currency: 'PLN' }
    ],
    uk: [
      { name: 'Forbidden Planet', url: 'forbiddenplanet.com', searchUrl: 'https://forbiddenplanet.com/catalog/?q=', currency: 'GBP' },
      { name: 'Game', url: 'game.co.uk', searchUrl: 'https://www.game.co.uk/en/search/?q=', currency: 'GBP' },
      { name: 'Argos', url: 'argos.co.uk', searchUrl: 'https://www.argos.co.uk/search/', currency: 'GBP' },
      { name: 'Amazon UK', url: 'amazon.co.uk', searchUrl: 'https://www.amazon.co.uk/s?k=', currency: 'GBP' },
      { name: 'Smyths Toys', url: 'smythstoys.com', searchUrl: 'https://www.smythstoys.com/uk/en-gb/search/?text=', currency: 'GBP' }
    ],
    usa: [
      { name: 'Hot Topic', url: 'hottopic.com', searchUrl: 'https://www.hottopic.com/search?q=', currency: 'USD' },
      { name: 'GameStop', url: 'gamestop.com', searchUrl: 'https://www.gamestop.com/search/?q=', currency: 'USD' },
      { name: 'Target', url: 'target.com', searchUrl: 'https://www.target.com/s?searchTerm=', currency: 'USD' },
      { name: 'Amazon US', url: 'amazon.com', searchUrl: 'https://www.amazon.com/s?k=', currency: 'USD' },
      { name: 'Entertainment Earth', url: 'entertainmentearth.com', searchUrl: 'https://www.entertainmentearth.com/s/?query1=', currency: 'USD' }
    ],
    germany: [
      { name: 'Elbenwald', url: 'elbenwald.de', searchUrl: 'https://www.elbenwald.de/search?sSearch=', currency: 'EUR' },
      { name: 'Amazon DE', url: 'amazon.de', searchUrl: 'https://www.amazon.de/s?k=', currency: 'EUR' },
      { name: 'MediaMarkt DE', url: 'mediamarkt.de', searchUrl: 'https://www.mediamarkt.de/de/search.html?query=', currency: 'EUR' },
      { name: 'GameStop DE', url: 'gamestop.de', searchUrl: 'https://www.gamestop.de/SearchResult/QuickSearch?q=', currency: 'EUR' },
      { name: 'Müller', url: 'mueller.de', searchUrl: 'https://www.mueller.de/suche/?q=', currency: 'EUR' }
    ],
    france: [
      { name: 'Fnac', url: 'fnac.com', searchUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=', currency: 'EUR' },
      { name: 'Amazon FR', url: 'amazon.fr', searchUrl: 'https://www.amazon.fr/s?k=', currency: 'EUR' },
      { name: 'Cultura', url: 'cultura.com', searchUrl: 'https://www.cultura.com/catalogsearch/result/?q=', currency: 'EUR' },
      { name: 'Micromania', url: 'micromania.fr', searchUrl: 'https://www.micromania.fr/search?text=', currency: 'EUR' },
      { name: 'Leclerc', url: 'e.leclerc', searchUrl: 'https://www.e.leclerc/search?text=', currency: 'EUR' }
    ],
    russia: [
      { name: 'Ozon', url: 'ozon.ru', searchUrl: 'https://www.ozon.ru/search/?text=', currency: 'RUB' },
      { name: 'Wildberries', url: 'wildberries.ru', searchUrl: 'https://www.wildberries.ru/catalog/0/search.aspx?search=', currency: 'RUB' },
      { name: 'M.Video', url: 'mvideo.ru', searchUrl: 'https://www.mvideo.ru/search?text=', currency: 'RUB' },
      { name: 'Citilink', url: 'citilink.ru', searchUrl: 'https://www.citilink.ru/search/?text=', currency: 'RUB' },
      { name: 'DNS Shop', url: 'dns-shop.ru', searchUrl: 'https://www.dns-shop.ru/search/?q=', currency: 'RUB' }
    ]
  };

  const countries = {
    poland: { name: 'Poland', flag: '🇵🇱' },
    uk: { name: 'United Kingdom', flag: '🇬🇧' },
    usa: { name: 'United States', flag: '🇺🇸' },
    germany: { name: 'Germany', flag: '🇩🇪' },
    france: { name: 'France', flag: '🇫🇷' },
    russia: { name: 'Russia', flag: '🇷🇺' }
  };

  const generateId = (
    title: string,
    number: string
  ): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`.replace(/\s+/g, "-");
  };

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      } else {
        return [...prev, countryCode];
      }
    });
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

        const related = dataWithIds.filter(
          (item) =>
            item.id !== foundItem.id &&
            (item.category === foundItem.category ||
              item.series?.some((s) => foundItem.series?.includes(s)))
        );
        setRelatedItems(related.slice(0, 6));

        const mockPrices: PricePoint[] = [
          { date: "2024-01-01", price: 12.99 },
          { date: "2024-02-01", price: 14.49 },
          { date: "2024-03-01", price: 13.99 },
          { date: "2024-04-01", price: 15.49 },
          { date: "2024-05-01", price: 16.29 },
        ];
        setPriceHistory(mockPrices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Check item in wishlist/collection
  useEffect(() => {
    const checkItemStatus = async () => {
      if (!funkoItem || !user) return;
      try {
        const [wishlistRes, collectionRes] = await Promise.all([
          api.get(`/wishlist/check/${funkoItem.id}`),
          api.get(`/collection/check/${funkoItem.id}`),
        ]);
        setInWishlist(wishlistRes.data.exists);
        setInCollection(collectionRes.data.exists);
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 401 || err.response?.status === 403)
        ) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/loginSite");
        }
      }
    };
    checkItemStatus();
  }, [funkoItem, user]);

  // Theme
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Language
  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  // Close dropdown
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

  const languages = useMemo(
    () => ({
      EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
      PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
      RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
      ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
      FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
      DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
    }),
    []
  );

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguageDropdown = () =>
    setShowLanguageDropdown((prev) => !prev);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert(t.loginRequiredMessage || "Please log in");
      navigate("/loginSite");
      return;
    }
    if (!funkoItem || isUpdatingWishlist) return;
    setIsUpdatingWishlist(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${funkoItem.id}`);
      } else {
        await api.post("/wishlist", {
          funkoId: funkoItem.id,
          title: funkoItem.title,
          number: funkoItem.number,
          imageName: funkoItem.imageName,
        });
      }
      setInWishlist(!inWishlist);
    } catch (err) {
      alert(t.updateError || "Error updating wishlist.");
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const toggleCollection = async () => {
    if (!user) {
      alert(t.loginRequiredMessage || "Please log in");
      navigate("/loginSite");
      return;
    }
    if (!funkoItem || isUpdatingCollection) return;
    setIsUpdatingCollection(true);
    try {
      if (inCollection) {
        await api.delete(`/collection/${funkoItem.id}`);
      } else {
        await api.post("/collection", {
          funkoId: funkoItem.id,
          title: funkoItem.title,
          number: funkoItem.number,
          imageName: funkoItem.imageName,
        });
      }
      setInCollection(!inCollection);
    } catch (err) {
      alert(t.updateError || "Error updating collection.");
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  const loginButtonTo = useMemo(() => {
    if (user?.role === "admin") return "/adminSite";
    if (user?.role === "user") return "/dashboardSite";
    return "/loginSite";
  }, [user]);

  const loginButtonText = useMemo(() => {
    return user ? t.goToDashboard || "Dashboard" : t.goToLoginSite || "Log In";
  }, [t, user]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800" : "bg-neutral-400"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${
            isDarkMode ? "border-yellow-500" : "border-green-600"
          }`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
        }`}
      >
        <div className="text-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black"
                : "bg-green-600 text-white"
            }`}
          >
            {t.backButton}
          </button>
        </div>
      </div>
    );
  }

  if (!funkoItem) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
        }`}
      >
        <p>Error: Funko Pop data not available.</p>
        <button
          onClick={() => navigate(-1)}
          className={`px-4 py-2 rounded ${
            isDarkMode
              ? "bg-yellow-500 text-black"
              : "bg-green-600 text-white"
          }`}
        >
          {t.backButton}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 relative">
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
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className={`flex-grow max-w-lg w-full md:w-auto mx-auto flex rounded-lg overflow-hidden ${
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
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isDarkMode ? "bg-yellow-500" : "bg-green-600"
            }`}
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Theme & Lang */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
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
              <div className={`absolute right-0 mt-2 w-48 max-w-full rounded-md shadow-lg py-1 z-10 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
                {Object.entries(translations).map(([code]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 text-base ${language === code ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : "hover:bg-gray-100 dark:hover:bg-gray-600"}`}
                  >
                    {code === "EN" && <UKFlag className="w-5 h-5" />}
                    {code === "PL" && <PolandFlag className="w-5 h-5" />}
                    {code === "RU" && <RussiaFlag className="w-5 h-5" />}
                    {code === "FR" && <FranceFlag className="w-5 h-5" />}
                    {code === "DE" && <GermanyFlag className="w-5 h-5" />}
                    {code === "ES" && <SpainFlag className="w-5 h-5" />}
                    <span>{code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>

        <div>
          <Link
            to={loginButtonTo}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black"
                : "bg-green-600 text-white"
            }`}
          >
            {loginButtonText}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className={`mb-6 px-4 py-2 rounded ${
            isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
          }`}
        >
          {t.backButton}
        </button>

        {/* Marketplace */}
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href={`https://vinylcave.pl/pl/searchquery/${encodeURIComponent(`${funkoItem.title} ${funkoItem.number} funko pop`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isDarkMode ? "text-yellow-400" : "text-green-600"}`}
          >
            {t.searchOnVinylCave || "VinylCave"}
          </a>
          <a
            href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${funkoItem.title} ${funkoItem.number} funko pop`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isDarkMode ? "text-yellow-400" : "text-green-600"}`}
          >
            eBay
          </a>
          <a
            href={`https://www.amazon.com/s?k=${encodeURIComponent(`${funkoItem.title} ${funkoItem.number} funko pop`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isDarkMode ? "text-yellow-400" : "text-green-600"}`}
          >
            Amazon
          </a>
        </div>

        {/* Main details */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h1 className="text-3xl font-bold mb-2">{funkoItem.title}</h1>
          <div className="flex gap-4 mb-6">
            <button
              onClick={toggleWishlist}
              disabled={isUpdatingWishlist}
              className={`px-4 py-2 rounded flex-1 ${
                inWishlist
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              {inWishlist ? t.removeFromWishlist : t.addToWishlist}
            </button>
            <button
              onClick={toggleCollection}
              disabled={isUpdatingCollection}
              className={`px-4 py-2 rounded flex-1 ${
                inCollection
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              {inCollection ? t.removeFromCollection : t.addToCollection}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">{t.details}</h2>
              <p><span className="font-medium">{t.number}:</span> {funkoItem.number}</p>
              <p><span className="font-medium">{t.category}:</span> {funkoItem.category}</p>
              <p><span className="font-medium">{t.series}:</span> {funkoItem.series?.join(", ")}</p>
              {funkoItem.exclusive && (
                <span className="inline-block px-2 py-1 rounded text-sm bg-green-600">
                  {t.exclusive}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3">{t.additionalInformation}</h2>
              <div className="p-4 rounded bg-gray-200 dark:bg-gray-600">
                {funkoItem.imageName ? (
                  <img
                    src={funkoItem.imageName}
                    alt={funkoItem.title}
                    className="rounded w-full max-h-80 object-contain"
                  />
                ) : (
                  <p>{t.noImageAvailable}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shopping Links Section */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h2 className="text-xl font-semibold mb-4">Search on Shopping Sites</h2>
          
          {/* Country Filters */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Search in countries:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(countries).map(([code, country]) => (
                <button
                  key={code}
                  onClick={() => handleCountryToggle(code)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedCountries.includes(code)
                      ? isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                      : isDarkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {country.flag} {country.name}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Links to Shopping Sites */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedCountries.flatMap(countryCode => {
              const countryShops = shops[countryCode];
              if (!countryShops) return [];
              
              return countryShops.map((shop, index) => {
                const searchQuery = `${funkoItem.title || ""} ${funkoItem.number || ""} funko pop`.trim();
                const searchUrl = shop.searchUrl + encodeURIComponent(searchQuery);

                return (
                  <div
                    key={`${countryCode}-${index}`}
                    className={`p-4 rounded border-l-4 transition-all ${
                      isDarkMode ? "border-gray-500 bg-gray-600" : "border-gray-400 bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {shop.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {countries[countryCode as keyof typeof countries].flag} 
                          {countries[countryCode as keyof typeof countries].name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded bg-gray-500 text-white">
                          {shop.currency}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-400">
                        Direct search link
                      </p>
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-1 text-sm rounded transition-all ${
                          isDarkMode 
                            ? "bg-yellow-500 text-black hover:bg-yellow-400" 
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        Search on {shop.name}
                      </a>
                    </div>
                  </div>
                );
              });
            })}
          </div>

          {selectedCountries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Select countries to see shopping links</p>
            </div>
          )}
        </div>

        {/* Price Chart */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h2 className="text-xl font-semibold mb-4">{t.priceHistory || "Price History"}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceHistory}>
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Related items */}
        <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h2 className="text-xl font-semibold mb-4">{t.relatedItems || "Related Items"}</h2>
          {relatedItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  className="block rounded-lg p-3 border dark:border-gray-600 hover:shadow-lg transition"
                >
                  {item.imageName ? (
                    <img
                      src={item.imageName}
                      alt={item.title}
                      className="w-full h-32 object-contain mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      {t.noImageAvailable}
                    </div>
                  )}
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.number}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p>{t.noRelatedItems || "No related items found."}</p>
          )}
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