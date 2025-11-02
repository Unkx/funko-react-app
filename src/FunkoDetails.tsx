/// <reference types="vite/client" />

// FunkoDetails.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { translations } from "./Translations/TranslationsFunkoDetails";
import axios from "axios";

// Icons
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
  shop: string;
  country: string;
  currency: string;
}
interface Shop {
  name: string;
  url: string;
  searchUrl: string;
  currency: string;
  priceSelector?: string;
  apiEndpoint?: string;
}
interface ScrapedPrice {
  price: number;
  currency: string;
  shop: string;
  country: string;
  date: string;
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
  const [isScrapingPrices, setIsScrapingPrices] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scrapingResults, setScrapingResults] = useState<ScrapedPrice[]>([]);
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

  // 🌐 Centralized country configuration (from WelcomeSite)
  const countries = {
    USA: {
      name: "USA",
      flag: <USAFlag className="w-5 h-5" />,
      region: "North America",
      language: "EN",
    },
    CA: {
      name: "Canada",
      flag: <CanadaFlag className="w-5 h-5" />,
      region: "North America",
      language : "EN",
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

  // 🌍 Languages for dropdown (with flag) - from WelcomeSite
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

  // Refs for dropdowns (from WelcomeSite)
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  const t = translations[language] || translations["EN"];

  // Shop configurations by country with price selectors
  const shops: Record<string, Shop[]> = {
    poland: [
      { 
        name: 'Empik', 
        url: 'empik.com', 
        searchUrl: `https://www.empik.com/szukaj/produkty?q=`, 
        currency: 'PLN',
        priceSelector: '.price'
      },
      { 
        name: 'Allegro', 
        url: 'allegro.pl', 
        searchUrl: 'https://allegro.pl/listing?string=', 
        currency: 'PLN',
        priceSelector: '[data-analytics-view-value]'
      },
      { 
        name: 'Media Markt PL', 
        url: 'mediamarkt.pl', 
        searchUrl: 'https://www.mediamarkt.pl/pl/search.html?query=', 
        currency: 'PLN',
        priceSelector: '.whole'
      },
      { 
        name: 'Komputronik', 
        url: 'komputronik.pl', 
        searchUrl: 'https://www.komputronik.pl/search/', 
        currency: 'PLN',
        priceSelector: '.price'
      },
      { 
        name: 'Merlin.pl', 
        url: 'merlin.pl', 
        searchUrl: 'https://merlin.pl/szukaj/?q=', 
        currency: 'PLN',
        priceSelector: '.price'
      }
    ],
    uk: [
      { 
        name: 'Forbidden Planet', 
        url: 'forbiddenplanet.com', 
        searchUrl: 'https://forbiddenplanet.com/catalog/?q=', 
        currency: 'GBP',
        priceSelector: '.price'
      },
      { 
        name: 'Game', 
        url: 'game.co.uk', 
        searchUrl: 'https://www.game.co.uk/en/search/?q=', 
        currency: 'GBP',
        priceSelector: '.productPrice'
      },
      { 
        name: 'Argos', 
        url: 'argos.co.uk', 
        searchUrl: 'https://www.argos.co.uk/search/', 
        currency: 'GBP',
        priceSelector: '[data-test="product-price"]'
      },
      { 
        name: 'Amazon UK', 
        url: 'amazon.co.uk', 
        searchUrl: 'https://www.amazon.co.uk/s?k=', 
        currency: 'GBP',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Smyths Toys', 
        url: 'smythstoys.com', 
        searchUrl: 'https://www.smythstoys.com/uk/en-gb/search/?text=', 
        currency: 'GBP',
        priceSelector: '.price'
      }
    ],
    usa: [
      { 
        name: 'Hot Topic', 
        url: 'hottopic.com', 
        searchUrl: 'https://www.hottopic.com/search?q=', 
        currency: 'USD',
        priceSelector: '.price'
      },
      { 
        name: 'GameStop', 
        url: 'gamestop.com', 
        searchUrl: 'https://www.gamestop.com/search/?q=', 
        currency: 'USD',
        priceSelector: '.actual-price'
      },
      { 
        name: 'Target', 
        url: 'target.com', 
        searchUrl: 'https://www.target.com/s?searchTerm=', 
        currency: 'USD',
        priceSelector: '[data-test="product-price"]'
      },
      { 
        name: 'Amazon US', 
        url: 'amazon.com', 
        searchUrl: 'https://www.amazon.com/s?k=', 
        currency: 'USD',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Entertainment Earth', 
        url: 'entertainmentearth.com', 
        searchUrl: 'https://www.entertainmentearth.com/s/?query1=', 
        currency: 'USD',
        priceSelector: '.price'
      }
    ],
    germany: [
      { 
        name: 'Elbenwald', 
        url: 'elbenwald.de', 
        searchUrl: 'https://www.elbenwald.de/search?sSearch=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Amazon DE', 
        url: 'amazon.de', 
        searchUrl: 'https://www.amazon.de/s?k=', 
        currency: 'EUR',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'MediaMarkt DE', 
        url: 'mediamarkt.de', 
        searchUrl: 'https://www.mediamarkt.de/de/search.html?query=', 
        currency: 'EUR',
        priceSelector: '.whole'
      },
      { 
        name: 'GameStop DE', 
        url: 'gamestop.de', 
        searchUrl: 'https://www.gamestop.de/SearchResult/QuickSearch?q=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Müller', 
        url: 'mueller.de', 
        searchUrl: 'https://www.mueller.de/suche/?q=', 
        currency: 'EUR',
        priceSelector: '.price'
      }
    ],
    france: [
      { 
        name: 'Fnac', 
        url: 'fnac.com', 
        searchUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Amazon FR', 
        url: 'amazon.fr', 
        searchUrl: 'https://www.amazon.fr/s?k=', 
        currency: 'EUR',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Cultura', 
        url: 'cultura.com', 
        searchUrl: 'https://www.cultura.com/catalogsearch/result/?q=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Micromania', 
        url: 'micromania.fr', 
        searchUrl: 'https://www.micromania.fr/search?text=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Leclerc', 
        url: 'e.leclerc', 
        searchUrl: 'https://www.e.leclerc/search?text=', 
        currency: 'EUR',
        priceSelector: '.price'
      }
    ],
    russia: [
      { 
        name: 'Ozon', 
        url: 'ozon.ru', 
        searchUrl: 'https://www.ozon.ru/search/?text=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'Wildberries', 
        url: 'wildberries.ru', 
        searchUrl: 'https://www.wildberries.ru/catalog/0/search.aspx?search=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'M.Video', 
        url: 'mvideo.ru', 
        searchUrl: 'https://www.mvideo.ru/search?text=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'Citilink', 
        url: 'citilink.ru', 
        searchUrl: 'https://www.citilink.ru/search/?text=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'DNS Shop', 
        url: 'dns-shop.ru', 
        searchUrl: 'https://www.dns-shop.ru/search/?q=', 
        currency: 'RUB',
        priceSelector: '.price'
      }
    ]
  };

  const shoppingCountries = {
    poland: { name: 'Poland', flag: '🇵🇱' },
    uk: { name: 'United Kingdom', flag: '🇬🇧' },
    usa: { name: 'United States', flag: '🇺🇸' },
    germany: { name: 'Germany', flag: '🇩🇪' },
    france: { name: 'France', flag: '🇫🇷' },
    russia: { name: 'Russia', flag: '🇷🇺' }
  };

  const generateId = (title: string, number: string): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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

  // Improved function to find related items based on series and category
  const findRelatedItems = (currentItem: FunkoItemWithId, allItems: FunkoItemWithId[]) => {
    if (!currentItem || !allItems || allItems.length === 0) return [];
    
    const related = allItems.filter(item => {
      if (item.id === currentItem.id) return false;
      
      const currentSeries = currentItem.series?.map(s => s.toLowerCase()) || [];
      const itemSeries = item.series?.map(s => s.toLowerCase()) || [];
      const sharedSeries = currentSeries.some(series => itemSeries.includes(series));
      
      const sameCategory = currentItem.category?.toLowerCase() === item.category?.toLowerCase();
      
      const titleWords = currentItem.title?.toLowerCase().split(/\s+/) || [];
      const hasCommonWords = titleWords.some(word => 
        word.length > 3 && item.title?.toLowerCase().includes(word)
      );
      
      if (sharedSeries) return true;
      if (sameCategory && hasCommonWords) return true;
      if (hasCommonWords) return true;
      return false;
    });
    
    related.sort((a, b) => {
      const currentSeries = currentItem.series?.map(s => s.toLowerCase()) || [];
      
      const aSeries = a.series?.map(s => s.toLowerCase()) || [];
      const aHasSharedSeries = currentSeries.some(series => aSeries.includes(series));
      
      const bSeries = b.series?.map(s => s.toLowerCase()) || [];
      const bHasSharedSeries = currentSeries.some(series => bSeries.includes(series));
      
      if (aHasSharedSeries && !bHasSharedSeries) return -1;
      if (!aHasSharedSeries && bHasSharedSeries) return 1;
      
      const aSameCategory = currentItem.category?.toLowerCase() === a.category?.toLowerCase();
      const bSameCategory = currentItem.category?.toLowerCase() === b.category?.toLowerCase();
      
      if (aSameCategory && !bSameCategory) return -1;
      if (!aSameCategory && bSameCategory) return 1;
      
      return 0;
    });
    
    return related.slice(0, 6);
  };

  // Fetch Funko data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!id) {
        throw new Error("No ID provided");
      }
      
      console.log("🔍 Searching for ID:", id);
      
      try {
        const response = await api.get(`/api/items/${encodeURIComponent(id)}`);
        console.log("✅ Found item via API:", response.data);
        setFunkoItem(response.data);
        
        try {
          const allItemsResponse = await api.get('/api/items');
          if (allItemsResponse.data && Array.isArray(allItemsResponse.data)) {
            const related = findRelatedItems(response.data, allItemsResponse.data);
            setRelatedItems(related);
          }
        } catch (relatedError) {
          console.warn("Could not load related items from API:", relatedError);
          try {
            const categoryResponse = await api.get(`/api/items/category/${response.data.category}`);
            if (categoryResponse.data && Array.isArray(categoryResponse.data)) {
              const related = findRelatedItems(response.data, categoryResponse.data);
              setRelatedItems(related.filter(item => item.id !== response.data.id).slice(0, 6));
            }
          } catch (categoryError) {
            console.warn("Could not load items by category:", categoryError);
          }
        }
        return;
      } catch (apiError: any) {
        console.warn("Direct API call failed:", apiError.response?.status, apiError.response?.data);
        if (apiError.response?.status === 404) {
          console.log("Item not found in database, trying fallback methods...");
        } else {
          throw apiError;
        }
      }
      
      console.log("🔍 Trying GitHub data as fallback...");
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);
        const data: FunkoItem[] = await response.json();
        const dataWithIds: FunkoItemWithId[] = data.map((item) => ({
          ...item,
          id: generateId(item.title, item.number),
        }));
        
        let foundItem = dataWithIds.find((item) => item.id === id);
        if (!foundItem) {
          const searchParams = extractSearchParamsFromId(id);
          foundItem = dataWithIds.find((item) => 
            item.title.toLowerCase().includes(searchParams.title.toLowerCase())
          );
        }
        
        if (!foundItem) throw new Error("Item not found in any source");
        setFunkoItem(foundItem);
        
        const related = findRelatedItems(foundItem, dataWithIds);
        setRelatedItems(related);
      } catch (githubError) {
        console.error("GitHub fallback failed:", githubError);
        throw new Error("Item not found in database or external sources");
      }
    } catch (err: any) {
      console.error("❌ All fetch methods failed:", err);
      setError(err.message || "Failed to load item");
    } finally {
      setIsLoading(false);
    }
  };

  const extractSearchParamsFromId = (id: string) => {
    const parts = id.replace(/[^a-zA-Z0-9\s-]/g, '').split('-');
    const numberPart = parts.find(part => /^\d+$/.test(part)) || '';
    const titleParts = parts.filter(part => !/^\d+$/.test(part) && part.length > 0);
    return {
      title: titleParts.join(' ') || id.replace(/-/g, ' '),
      number: numberPart
    };
  };

  // Track visits
  useEffect(() => {
    if (id) {
      const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
      visitCount[id] = (visitCount[id] || 0) + 1;
      localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    }
  }, [id]);

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

  // Fetch data on component mount and when id changes
  useEffect(() => {
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
          navigate("/loginregistersite");
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
        languageDropdownRef.current &&
        languageButtonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) &&
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // Header functions (from WelcomeSite)
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
      navigate("/loginregistersite");
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
      navigate("/loginregistersite");
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

  // Function to scrape prices from shopping sites
  const scrapePrices = async () => {
    if (!funkoItem) return;
    setIsScrapingPrices(true);
    setScrapingProgress(0);
    setScrapingResults([]);
    const searchQuery = `${funkoItem.title || ""} ${funkoItem.number || ""} funko pop`.trim();
    const selectedShops = selectedCountries.flatMap(countryCode => 
      shops[countryCode]?.map(shop => ({ ...shop, country: countryCode })) || []
    );
    const results: ScrapedPrice[] = [];
    for (let i = 0; i < selectedShops.length; i++) {
      const shop = selectedShops[i];
      try {
        setScrapingProgress(Math.round((i / selectedShops.length) * 100));
        const response = await api.post('/scrape/price', {
          url: shop.searchUrl + encodeURIComponent(searchQuery),
          shop: shop.name,
          country: shop.country,
          currency: shop.currency,
          priceSelector: shop.priceSelector
        });
        if (response.data && response.data.price) {
          results.push({
            price: response.data.price,
            currency: response.data.currency || shop.currency,
            shop: shop.name,
            country: shop.country,
            date: new Date().toISOString().split('T')[0]
          });
        }
      } catch (error) {
        console.error(`Failed to scrape ${shop.name}:`, error);
      }
    }
    setScrapingResults(results);
    setIsScrapingPrices(false);
    setScrapingProgress(100);
    if (results.length > 0) {
      try {
        await api.post('/prices', {
          funkoId: funkoItem.id,
          prices: results
        });
        const updatedPriceHistory = [...priceHistory, ...results];
        setPriceHistory(updatedPriceHistory);
      } catch (error) {
        console.error("Failed to save prices:", error);
      }
    }
  };

  const loginButtonTo = useMemo(() => {
    if (user?.role === "admin") return "/adminSite";
    if (user?.role === "user") return "/dashboardSite";
    return "/loginregistersite";
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
            isDarkMode ? "border-yellow-500" : "bg-green-600"
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
      {/* 🔝 Header - IDENTYCZNY jak w WelcomeSite */}
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

        {/* 🌐 Language, 🌙 Theme, 🔐 Login */}
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

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
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
              {Object.entries(shoppingCountries).map(([code, country]) => (
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

          {/* Scraping Results */}
          {scrapingResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Current Prices</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {scrapingResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded border-l-4 ${
                      isDarkMode ? "border-green-400 bg-gray-600" : "border-green-600 bg-green-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{result.shop}</h3>
                        <p className="text-xs text-gray-500">
                          {shoppingCountries[result.country as keyof typeof shoppingCountries]?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {result.price} {result.currency}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Updated: {result.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                          {shoppingCountries[countryCode as keyof typeof shoppingCountries].flag} 
                          {shoppingCountries[countryCode as keyof typeof shoppingCountries].name}
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
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noRelatedItems || "No related items found."}</p>
              <Link 
                to="/searchsite" 
                className={`mt-4 inline-block px-4 py-2 rounded ${
                  isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                }`}
              >
                Browse All Items
              </Link>
            </div>
          )}
        </div>
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

export default FunkoDetails;