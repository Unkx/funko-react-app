import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useBreakpoints from "./useBreakpoints";
import QuickLinks from "./QuickLinks";
import { translations } from "./Translations/TranslationsSearchSite";

// Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

// Add a simple CloseIcon
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Flags
import USAFlag from "/src/assets/flags/usa.svg?react";
import UKFlag from "/src/assets/flags/uk.svg?react";
import CanadaFlag from "/src/assets/flags/canada.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import AuthButton from "./AuthButton";

// --- Module-level cached fetch to speed up initial load ---
let cachedItemsPromise: Promise<any[]> | null = null;

const moduleGenerateId = (title: string, number: string): string => {
  const safeTitle = title ? title.trim() : "";
  const safeNumber = number ? number.trim() : "";
  return `${safeTitle}-${safeNumber}`
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const fetchAllItemsOnce = async (): Promise<any[]> => {
  if (cachedItemsPromise) return cachedItemsPromise;

  cachedItemsPromise = (async () => {
    try {
      // Try backend first
      try {
        const apiResponse = await fetch("http://localhost:5000/api/items?limit=200");
        if (apiResponse.ok) {
          const backendData = await apiResponse.json();
          return backendData.map((item: any) => ({
            ...item,
            id: item.id || moduleGenerateId(item.title, item.number),
          }));
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback to GitHub static JSON
      const githubResponse = await fetch(
        "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
      );
      if (!githubResponse.ok) throw new Error(`GitHub error: ${githubResponse.status}`);
      const githubData = await githubResponse.json();
      return githubData.map((item: any) => ({ ...item, id: moduleGenerateId(item.title, item.number) }));
    } catch (err) {
      // propagate
      throw err;
    }
  })();

  return cachedItemsPromise;
};

// Start prefetch immediately when module loads to reduce perceived latency
fetchAllItemsOnce().catch(() => {
  /* ignore prefetch errors */
});

// --- IMAGE MODAL COMPONENT ---
interface ImageModalProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
  isDarkMode: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose, isDarkMode }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative ${isDarkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1 rounded-full ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
          aria-label="Close image"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[calc(90vh-60px)] object-contain"
          onError={(e) => {
            e.currentTarget.src = "/src/assets/placeholder.png";
            e.currentTarget.onerror = null;
          }}
        />
        <p className={`text-center mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{altText}</p>
      </div>
    </div>
  );
};

// --- REQUEST MODAL COMPONENT ---
interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSubmit: (formData: { title: string; number: string; reason: string }) => void;
  isSubmitting: boolean;
  submitSuccess: boolean;
  t: any;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onSubmit,
  isSubmitting,
  submitSuccess,
  t
}) => {
  const [formData, setFormData] = useState({ title: "", number: "", reason: "" });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative ${isDarkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
          aria-label="Close modal"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>
          {t.requestMissingItem || "Request Missing Item"}
        </h2>

        {submitSuccess ? (
          <div className={`p-4 rounded-md ${isDarkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"}`}>
            ✅ {t.requestSubmitted || "Request submitted successfully!"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {t.itemTitle || "Item Title"} *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black"
                }`}
                placeholder={t.titlePlaceholder || "Enter item title"}
              />
            </div>

            <div>
              <label htmlFor="number" className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {t.itemNumber || "Item Number"}
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black"
                }`}
                placeholder={t.numberPlaceholder || "Enter item number (optional)"}
              />
            </div>

            <div>
              <label htmlFor="reason" className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {t.reason || "Reason for Request"} *
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black"
                }`}
                placeholder={t.reasonPlaceholder || "Why are you requesting this item?"}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded ${
                  isDarkMode
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
                disabled={isSubmitting}
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } disabled:opacity-50`}
              >
                {isSubmitting ? t.submitting || "Submitting..." : t.submitRequest || "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Define the structure of a Funko Pop item
interface FunkoItem {
  id: number | string;
  title: string;
  number: string;
  series: string[];
  exclusive: boolean;
  imageName?: string;
  category?: string;
}

const SearchSite = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [funkoData, setFunkoData] = useState<FunkoItem[]>([]);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [filteredAndSortedResults, setFilteredAndSortedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Adaptive display limits
  const DEFAULT_DESKTOP_LIMIT = 50;
  const DEFAULT_MOBILE_LIMIT = 20;
  const INITIAL_DISPLAY_LIMIT = isMobile ? DEFAULT_MOBILE_LIMIT : DEFAULT_DESKTOP_LIMIT;
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const [sortOption, setSortOption] = useState("titleAsc");

  // Local cache settings for faster repeat loads
  const CACHE_KEY = "funkoItemsCache_v1";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

  // Load cached items synchronously on mount (via effect) so returning users see content instantly
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.timestamp &&
          Date.now() - parsed.timestamp < CACHE_TTL_MS &&
          Array.isArray(parsed.items)
        ) {
          setFunkoData(parsed.items);
          // mark initial loading as finished so spinner doesn't block cached view
          setIsLoading(false);
        }
      }
    } catch (e) {
      // ignore parse errors and continue
    }
  }, []);

  // Modal states
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageAlt, setModalImageAlt] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const languageDropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const queryParam = queryParams.get("q") || "";

  // Helper to generate IDs
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

  // Combine funkoData and adminItems for processing
  const allItems = useMemo(() => {
    const transformedAdminItems = adminItems.map((item: any) => ({
      ...item,
      title: item.title || "",
      number: item.number || "",
      series: Array.isArray(item.series)
        ? item.series
        : item.category
        ? [item.category]
        : ["Unknown"],
      exclusive: item.exclusive || false,
      id: `admin-${item.id}`,
      isAdmin: true,
    }));

    const transformedFunkoData = funkoData.map((item: any) => ({
      ...item,
      title: item.title || "",
      number: item.number || "",
      series: Array.isArray(item.series)
        ? item.series
        : item.series
        ? [item.series]
        : ["Unknown"],
      exclusive: item.exclusive || false,
      id: item.id || generateId(item.title, item.number),
      isAdmin: false,
    }));

    const merged = [...transformedFunkoData, ...transformedAdminItems];

    const funkoKeySet = new Set(
      transformedFunkoData.map(
        (i) => `${i.title.toLowerCase()}|${(i.number || "").toLowerCase()}`
      )
    );

    const unique = merged.filter((item) => {
      if (item.isAdmin) {
        const key = `${item.title.toLowerCase()}|${(item.number || "").toLowerCase()}`;
        return !funkoKeySet.has(key);
      }
      return true;
    });

    return unique;
  }, [funkoData, adminItems]);

  const totalDisplayed = Math.min(filteredAndSortedResults.length, displayLimit);
  const totalPages = Math.max(1, Math.ceil(totalDisplayed / itemsPerPage));

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const lastIndex = Math.min(indexOfLastItem, displayLimit);
    return filteredAndSortedResults.slice(indexOfFirstItem, lastIndex);
  }, [currentPage, itemsPerPage, filteredAndSortedResults, displayLimit]);

  const availableSeries = useMemo(() => {
    return [...new Set(allItems.flatMap((item: any) => item.series))];
  }, [allItems]);

  const languages = {
    US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
    EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
    CA: { name: "Canada", flag: <CanadaFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  };

  // Fetch data: first perform a quick, small backend fetch to show initial items fast,
  // then update/replace with the full dataset returned by fetchAllItemsOnce().
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    // Quick fetch: small limit for initial render (fast response expected)
    (async () => {
      try {
        const resp = await fetch("http://localhost:5000/api/items?limit=30");
        if (resp.ok) {
          const quickData = await resp.json();
          if (!mounted) return;
          const mapped = quickData.map((item: any) => ({
            ...item,
            id: item.id || moduleGenerateId(item.title, item.number),
          }));
          // Show quick results immediately to improve perceived load on mobile
          setFunkoData(mapped);
          setError(null);
        }
      } catch (e) {
        // ignore quick fetch failure; full fetch will be attempted below
      }
    })();

    // Full fetch (cached) - when ready replace/merge the data
    fetchAllItemsOnce()
      .then((data) => {
        if (!mounted) return;
        setFunkoData(data);
        setError(null);
        try {
          // persist the full dataset for faster subsequent loads
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items: data }));
        } catch (e) {
          // ignore storage errors (quota, private mode)
        }
      })
      .catch((err: any) => {
        if (!mounted) return;
        console.warn("Failed to load full items:", err);
        setError(err?.message || "An error occurred while fetching data.");
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch admin items from backend
  useEffect(() => {
    const fetchAdminItems = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/items?limit=30");
        if (response.ok) {
          const data = await response.json();
          setAdminItems(data);
        } else {
          console.warn("Failed to fetch admin items, continuing with GitHub data only");
        }
      } catch (err: any) {
        console.warn("Error fetching admin items:", err);
      }
    };
    fetchAdminItems();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        buttonRef.current &&
        !(languageDropdownRef.current as Node).contains(event.target as Node) &&
        !(buttonRef.current as Node).contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  useEffect(() => {
    if (allItems.length === 0) {
      setFilteredAndSortedResults([]);
      return;
    }

    const normalizedQuery = queryParam.toLowerCase().trim();

    let currentProcessedResults = allItems.filter((item: any) => {
      const titleMatch = item.title?.toLowerCase().includes(normalizedQuery);
      const numberMatch = item.number?.toLowerCase().includes(normalizedQuery);
      const seriesMatch = item.series?.some((series: string) =>
        series.toLowerCase().includes(normalizedQuery)
      );

      return titleMatch || numberMatch || seriesMatch;
    });

    if (categoryFilter) {
      currentProcessedResults = currentProcessedResults.filter((item: any) =>
        item.series?.includes(categoryFilter)
      );
    }

    if (showExclusiveOnly) {
      currentProcessedResults = currentProcessedResults.filter(
        (item: any) => item.exclusive === true
      );
    }

    switch (sortOption) {
      case "titleDesc":
        currentProcessedResults.sort((a: any, b: any) =>
          b.title?.localeCompare(a.title || "") || 0
        );
        break;
      case "numberAsc":
        currentProcessedResults.sort(
          (a: any, b: any) => (Number(a.number) || 0) - (Number(b.number) || 0)
        );
        break;
      case "numberDesc":
        currentProcessedResults.sort(
          (a: any, b: any) => (Number(b.number) || 0) - (Number(a.number) || 0)
        );
        break;
      case "titleAsc":
      default:
        currentProcessedResults.sort((a: any, b: any) =>
          a.title?.localeCompare(b.title || "") || 0
        );
        break;
    }

    setFilteredAndSortedResults(currentProcessedResults);
    setCurrentPage(1);
    setDisplayLimit(isMobile ? DEFAULT_MOBILE_LIMIT : DEFAULT_DESKTOP_LIMIT);
  }, [queryParam, categoryFilter, showExclusiveOnly, sortOption, allItems, isMobile]);

  useEffect(() => {
    setDisplayLimit(isMobile ? DEFAULT_MOBILE_LIMIT : DEFAULT_DESKTOP_LIMIT);
  }, [isMobile]);

  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  useEffect(() => {
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

  const t = (translations as any)[language] || translations["EN"];

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

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPage = (pageNumber: number | string) => {
    if (pageNumber !== "...") {
      setCurrentPage(Number(pageNumber));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getDisplayedPages = () => {
    const totalDisplayedPages = 5;
    const halfDisplay = Math.floor(totalDisplayedPages / 2);
    let startPage = Math.max(currentPage - halfDisplay, 1);
    let endPage = Math.min(startPage + totalDisplayedPages - 1, totalPages);

    if (endPage - startPage + 1 < totalDisplayedPages) {
      startPage = Math.max(endPage - totalDisplayedPages + 1, 1);
    }

    const pages: (number | string)[] = [];

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const loginButtonTo = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "admin") return "/adminSite";
    if (user?.role === "user") return "/dashboardSite";
    return "/loginregistersite";
  }, []);

  const loginButtonText = useMemo(() => {
    return localStorage.getItem("user")
      ? t.goToDashboard || "Dashboard"
      : t.goToLoginSite || "Log In";
  }, [t]);

  const openImageModal = (imageUrl: string, altText: string) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(altText);
  };

  const closeImageModal = () => {
    setModalImageUrl(null);
    setModalImageAlt(null);
  };

  const handleRequestSubmit = async (formData: { title: string; number: string; reason: string }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t.loginRequired || "Please log in to submit a request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setSubmitSuccess(false);
  };

  const isAdminItem = (itemId: string) => itemId.startsWith('admin-');

  return (
    <div
      className={`search-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"
      }`}
    >
      <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
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

        <form
          onSubmit={handleSearch}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden ${
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

        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0 min-w-0 items-center">
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 min-w-0 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-neutral-600"
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

          {/* <Link
            to={loginButtonTo}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loginButtonText}
          </Link> */}
          <AuthButton isDarkMode={isDarkMode} translations={t} />
        </div>
      </header>

      <QuickLinks isDarkMode={isDarkMode} language={language as any} />

  <div className="p-4 flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by series"
          className={`w-full sm:w-64 md:w-80 lg:w-96 px-3 py-2 rounded text-sm min-w-0 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <option value="">{t.allSeries}</option>
          {availableSeries.map((series, index) => (
            <option key={index} value={series}>
              {series}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showExclusiveOnly}
            onChange={() => setShowExclusiveOnly(!showExclusiveOnly)}
            className={`rounded ${
              isDarkMode ? "accent-yellow-500" : "accent-blue-600"
            }`}
          />
          {t.exclusiveOnly}
        </label>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className={`px-3 py-2 rounded ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
        >
          <option value="titleAsc">{t.sortByTitleAsc}</option>
          <option value="titleDesc">{t.sortByTitleDesc}</option>
          <option value="numberAsc">{t.sortByNumberAsc}</option>
          <option value="numberDesc">{t.sortByNumberDesc}</option>
        </select>
      </div>

      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center justify-center">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
        ) : (
          <div>
            {queryParam && (
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
                {t.searchingResults}
                <span className="text-yellow-400"> {queryParam}</span>
              </h2>
            )}

            {filteredAndSortedResults.length > 0 ? (
              <div>
                <div className="w-full max-w-4xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500">
                      Showing {Math.min(filteredAndSortedResults.length, displayLimit)} of {filteredAndSortedResults.length} results
                    </div>
                    {filteredAndSortedResults.length > displayLimit && (
                      <button
                        onClick={() => setDisplayLimit((d) => Math.min(filteredAndSortedResults.length, d + (isMobile ? DEFAULT_MOBILE_LIMIT : DEFAULT_DESKTOP_LIMIT)))}
                        className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border`}
                      >
                        Load more
                      </button>
                    )}
                  </div>

                  <ul className="space-y-4">
                    {currentItems.map((item: any) => (
                      <li
                        key={item.id}
                        className={`p-3 sm:px-6 sm:py-4 rounded-lg flex flex-col sm:flex-row gap-4 ${
                          isDarkMode ? "bg-gray-700" : "bg-white"
                        } cursor-pointer hover:opacity-90 transition-opacity relative`}
                        onClick={() => {
                          const properId = item.id.includes('-')
                            ? item.id
                            : generateId(item.title, item.number || '');
                          navigate(`/funko/${encodeURIComponent(properId)}`);
                        }}
                      >
                        {isAdminItem(item.id) && (
                          <div className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-blue-500 text-white font-semibold">
                            ADMIN
                          </div>
                        )}

                        <div className="flex-shrink-0 mx-auto sm:mx-0">
                          <img
                            src={item.imageName || "/src/assets/placeholder.png"}
                            alt={item.title}
                            loading="lazy"
                            className="w-16 h-16 sm:w-24 sm:h-24 object-contain rounded-md cursor-zoom-in"
                            onError={(e) => {
                              e.currentTarget.src = "/src/assets/placeholder.png";
                              e.currentTarget.onerror = null;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(item.imageName || "/src/assets/placeholder.png", item.title);
                            }}
                          />
                        </div>

                        <div className="flex-grow text-center sm:text-left">
                          <h3 className="text-lg font-bold">{item.title}</h3>
                          <p className="text-sm">
                            {t.series}: {Array.isArray(item.series) ? item.series.join(", ") : item.series}
                          </p>
                          <p className="text-sm">
                            {t.number}: {item.number}
                          </p>
                          {item.exclusive && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                isDarkMode ? "bg-yellow-600" : "bg-green-600"
                              }`}
                            >
                              {t.exclusive}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage">{t.itemsPerPage}</label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-1 rounded ${
                        isDarkMode ? "bg-gray-700" : "bg-white"
                      }`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap justify-center items-center gap-1">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentPage === 1
                          ? "opacity-50 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {t.previous || "Previous"}
                    </button>
                    {getDisplayedPages().map((page, index) =>
                      page === "..." ? (
                        <span key={index} className="px-2">
                          ...
                        </span>
                      ) : (
                        <button
                          key={index}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded ${
                            currentPage === page
                              ? isDarkMode
                                ? "bg-yellow-500 text-black"
                                : "bg-blue-600 text-white"
                              : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded ${
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {t.next || "Next"}
                    </button>
                  </div>

                  <div className="text-sm">
                    {t.page} {currentPage} {t.of} {totalPages}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4">{t.noResult}</p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className={`px-4 py-2 rounded ${
                    isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {t.requestMissingItem || "Request Missing Item"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer
        className={`text-center py-4 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-700"
        }`}
      >
        {t.copyright}
      </footer>

      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          altText={modalImageAlt || "Funko Pop Image"}
          onClose={closeImageModal}
          isDarkMode={isDarkMode}
        />
      )}

      <RequestModal
        isOpen={showRequestModal}
        onClose={handleCloseRequestModal}
        isDarkMode={isDarkMode}
        onSubmit={handleRequestSubmit}
        isSubmitting={isSubmitting}
        submitSuccess={submitSuccess}
        t={t}
      />
    </div>
  );
};

export default SearchSite
