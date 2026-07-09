import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LanguageContext } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import Layout from "./Layout";
import { translations } from "./Translations/TranslationsSearchSite";
import { X, ZoomIn, Grid3X3, List, ChevronLeft, ChevronRight } from "lucide-react";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://funko-backend.onrender.com";

let cachedItemsPromise: Promise<any[]> | null = null;

const moduleGenerateId = (title: string, number: string): string => {
  const safeTitle = title ? title.trim() : "";
  const safeNumber = number ? number.trim() : "";
  return `${safeTitle}-${safeNumber}`
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const fetchAllItemsOnce = async (): Promise<any[]> => {
  if (cachedItemsPromise) return cachedItemsPromise;
  cachedItemsPromise = (async () => {
    try {
      try {
        const apiResponse = await fetch(`${baseURL}/api/items?limit=200`);
        if (apiResponse.ok) {
          const backendData = await apiResponse.json();
          return backendData.map((item: any) => ({
            ...item,
            id: item.id || moduleGenerateId(item.title, item.number),
          }));
        }
      } catch {}
      const githubResponse = await fetch(
        "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
      );
      if (!githubResponse.ok) throw new Error(`GitHub error: ${githubResponse.status}`);
      const githubData = await githubResponse.json();
      return githubData.map((item: any) => ({ ...item, id: moduleGenerateId(item.title, item.number) }));
    } catch (err) {
      throw err;
    }
  })();
  return cachedItemsPromise;
};

fetchAllItemsOnce().catch(() => {});

// Image Modal
const ImageModal: React.FC<{
  imageUrl: string;
  altText: string;
  onClose: () => void;
  isDarkMode: boolean;
}> = ({ imageUrl, altText, onClose, isDarkMode }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`relative p-4 rounded-2xl shadow-2xl max-w-3xl max-h-[90vh] overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
          aria-label="Close image"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[calc(90vh-80px)] object-contain"
          onError={(e) => {
            e.currentTarget.src = "/src/assets/placeholder.png";
            e.currentTarget.onerror = null;
          }}
        />
        <p className={`text-center mt-3 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{altText}</p>
      </div>
    </div>
  );
};

// Request Modal
const RequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSubmit: (formData: { title: string; number: string; reason: string }) => void;
  isSubmitting: boolean;
  submitSuccess: boolean;
  t: any;
}> = ({ isOpen, onClose, isDarkMode, onSubmit, isSubmitting, submitSuccess, t }) => {
  const [formData, setFormData] = useState({ title: "", number: "", reason: "" });

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`relative p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-slate-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">{t.requestMissingItem || "Request Missing Item"}</h2>
        {submitSuccess ? (
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
            {t.requestSubmitted || "Request submitted successfully!"}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="req-title" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                {t.itemTitle || "Item Title"} *
              </label>
              <input
                type="text"
                id="req-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                required
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode ? "bg-slate-900 border-slate-700 text-white focus:border-amber-400/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400"
                } outline-none`}
                placeholder={t.titlePlaceholder || "Enter item title"}
              />
            </div>
            <div>
              <label htmlFor="req-number" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                {t.itemNumber || "Item Number"}
              </label>
              <input
                type="text"
                id="req-number"
                value={formData.number}
                onChange={(e) => setFormData((p) => ({ ...p, number: e.target.value }))}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  isDarkMode ? "bg-slate-900 border-slate-700 text-white focus:border-amber-400/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400"
                } outline-none`}
                placeholder={t.numberPlaceholder || "Enter item number (optional)"}
              />
            </div>
            <div>
              <label htmlFor="req-reason" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                {t.reason || "Reason"} *
              </label>
              <textarea
                id="req-reason"
                value={formData.reason}
                onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                required
                rows={3}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors resize-none ${
                  isDarkMode ? "bg-slate-900 border-slate-700 text-white focus:border-amber-400/50" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400"
                } outline-none`}
                placeholder={t.reasonPlaceholder || "Why are you requesting this item?"}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? t.submitting || "Submitting..." : t.submitRequest || "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

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
  const { language } = useContext(LanguageContext);
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [funkoData, setFunkoData] = useState<FunkoItem[]>([]);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [filteredAndSortedResults, setFilteredAndSortedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
  const markImageBroken = (id: string) =>
    setBrokenImageIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const [sortOption, setSortOption] = useState("titleAsc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageAlt, setModalImageAlt] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryParam = queryParams.get("q") || "";

  const t = (translations as any)[language] || translations["EN"];

  const generateId = (title: string, number: string): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const allItems = useMemo(() => {
    const transformedAdmin = adminItems.map((item: any) => ({
      ...item,
      title: item.title || "",
      number: item.number || "",
      series: Array.isArray(item.series) ? item.series : item.category ? [item.category] : ["Unknown"],
      exclusive: item.exclusive || false,
      id: `admin-${item.id}`,
      isAdmin: true,
    }));
    const transformedFunko = funkoData.map((item: any) => ({
      ...item,
      title: item.title || "",
      number: item.number || "",
      series: Array.isArray(item.series) ? item.series : item.series ? [item.series] : ["Unknown"],
      exclusive: item.exclusive || false,
      id: item.id || generateId(item.title, item.number),
      isAdmin: false,
    }));
    const merged = [...transformedFunko, ...transformedAdmin];
    const funkoKeySet = new Set(transformedFunko.map((i) => `${i.title.toLowerCase()}|${(i.number || "").toLowerCase()}`));
    return merged.filter((item) => {
      if (item.isAdmin) {
        return !funkoKeySet.has(`${item.title.toLowerCase()}|${(item.number || "").toLowerCase()}`);
      }
      return true;
    });
  }, [funkoData, adminItems]);

  const totalDisplayed = Math.min(filteredAndSortedResults.length, displayLimit);
  const totalPages = Math.max(1, Math.ceil(totalDisplayed / itemsPerPage));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, displayLimit);
    return filteredAndSortedResults.slice(start, end).filter((item: any) => !brokenImageIds.has(item.id));
  }, [currentPage, itemsPerPage, filteredAndSortedResults, displayLimit, brokenImageIds]);

  const availableSeries = useMemo(() => [...new Set(allItems.flatMap((item: any) => item.series))], [allItems]);

  // Data fetching
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    (async () => {
      try {
        const resp = await fetch(`${baseURL}/api/items?limit=30`);
        if (resp.ok) {
          const quickData = await resp.json();
          if (mounted) {
            setFunkoData(quickData.map((item: any) => ({ ...item, id: item.id || moduleGenerateId(item.title, item.number) })));
          }
        }
      } catch {}
    })();
    fetchAllItemsOnce()
      .then((data) => {
        if (mounted) {
          setFunkoData(data);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message || "An error occurred.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const resp = await fetch(`${baseURL}/api/items?limit=30`);
        if (resp.ok) setAdminItems(await resp.json());
      } catch {}
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (allItems.length === 0) {
      setFilteredAndSortedResults([]);
      return;
    }
    const normalized = queryParam.toLowerCase().trim();
    let results = allItems.filter((item: any) => {
      const titleMatch = item.title?.toLowerCase().includes(normalized);
      const numberMatch = item.number?.toLowerCase().includes(normalized);
      const seriesMatch = item.series?.some((s: string) => s.toLowerCase().includes(normalized));
      return titleMatch || numberMatch || seriesMatch;
    });
    if (categoryFilter) results = results.filter((item: any) => item.series?.includes(categoryFilter));
    if (showExclusiveOnly) results = results.filter((item: any) => item.exclusive);
    results = results.filter((item: any) => !!item.imageName);
    switch (sortOption) {
      case "titleDesc":
        results.sort((a: any, b: any) => b.title?.localeCompare(a.title || "") || 0);
        break;
      case "numberAsc":
        results.sort((a: any, b: any) => (Number(a.number) || 0) - (Number(b.number) || 0));
        break;
      case "numberDesc":
        results.sort((a: any, b: any) => (Number(b.number) || 0) - (Number(a.number) || 0));
        break;
      default:
        results.sort((a: any, b: any) => a.title?.localeCompare(b.title || "") || 0);
    }
    setFilteredAndSortedResults(results);
    setCurrentPage(1);
  }, [queryParam, categoryFilter, showExclusiveOnly, sortOption, allItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    else navigate("/searchsite");
  };

  const goToPage = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRequestSubmit = async (formData: { title: string; number: string; reason: string }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t.loginRequired || "Please log in.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${baseURL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setSubmitSuccess(true);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxShow = 5;
    const half = Math.floor(maxShow / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxShow - 1, totalPages);
    if (end - start + 1 < maxShow) start = Math.max(end - maxShow + 1, 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Layout translations={t} showSearch={false}>
      {/* Inline Search + Filters */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <form onSubmit={handleSearch} className="mb-4">
          <div
            className={`flex rounded-xl overflow-hidden border transition-colors ${
              isDarkMode ? "bg-slate-800 border-slate-700 focus-within:border-amber-400/50" : "bg-white border-slate-200 focus-within:border-blue-400"
            }`}
          >
            <input
              type="text"
              placeholder={t.searchPlaceholder || "Search Funko Pops..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-grow px-4 py-3 text-sm outline-none bg-transparent ${isDarkMode ? "text-white placeholder-slate-400" : "text-slate-900 placeholder-slate-500"}`}
              aria-label="Search"
            />
            <button
              type="submit"
              className={`px-5 py-3 font-medium text-sm transition-colors ${isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              {t.searchButton || "Search"}
            </button>
          </div>
        </form>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by series"
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            } outline-none`}
          >
            <option value="">{t.allSeries || "All Series"}</option>
            {availableSeries.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showExclusiveOnly}
              onChange={() => setShowExclusiveOnly(!showExclusiveOnly)}
              className={`rounded ${isDarkMode ? "accent-amber-400" : "accent-blue-600"}`}
            />
            {t.exclusiveOnly || "Exclusive only"}
          </label>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            } outline-none`}
          >
            <option value="titleAsc">{t.sortByTitleAsc || "A → Z"}</option>
            <option value="titleDesc">{t.sortByTitleDesc || "Z → A"}</option>
            <option value="numberAsc">{t.sortByNumberAsc || "# Low → High"}</option>
            <option value="numberDesc">{t.sortByNumberDesc || "# High → Low"}</option>
          </select>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? (isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600") : isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? (isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600") : isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {error ? (
          <p className="text-red-500 text-center py-12">{error}</p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className={`animate-spin rounded-full h-10 w-10 border-2 border-t-transparent ${isDarkMode ? "border-amber-400" : "border-blue-600"}`} />
          </div>
        ) : (
          <>
            {queryParam && (
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {t.searchingResults || "Results for"}{" "}
                <span className={isDarkMode ? "text-amber-400" : "text-blue-600"}>"{queryParam}"</span>
              </h2>
            )}

            {filteredAndSortedResults.length > 0 ? (
              <>
                <div className={`flex items-center justify-between mb-4 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span>
                    {Math.min(filteredAndSortedResults.length, displayLimit)} of {filteredAndSortedResults.length} results
                  </span>
                  {filteredAndSortedResults.length > displayLimit && (
                    <button
                      onClick={() => setDisplayLimit((d) => Math.min(filteredAndSortedResults.length, d + 50))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isDarkMode ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Load more
                    </button>
                  )}
                </div>

                {/* Grid View */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {currentItems.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/funko/${encodeURIComponent(item.id)}`)}
                        className={`group rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                          isDarkMode ? "bg-slate-800 border-slate-700 hover:border-amber-400/30" : "bg-white border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div className={`relative p-3 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                          <img
                            src={item.imageName}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-32 sm:h-40 object-contain transition-transform duration-300 group-hover:scale-105"
                            onError={() => markImageBroken(item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageUrl(item.imageName);
                              setModalImageAlt(item.title);
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageUrl(item.imageName);
                              setModalImageAlt(item.title);
                            }}
                            className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDarkMode ? "bg-slate-900/70 text-white" : "bg-white/80 text-slate-700"
                            }`}
                            aria-label="Zoom image"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          {item.isAdmin && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] rounded bg-blue-500 text-white font-semibold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-xs sm:text-sm truncate">{item.title}</h3>
                          <p className={`text-[10px] sm:text-xs mt-1 truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            #{item.number} &middot; {Array.isArray(item.series) ? item.series.join(", ") : item.series}
                          </p>
                          {item.exclusive && (
                            <span
                              className={`inline-block mt-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {t.exclusive || "Exclusive"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View */
                  <div className="space-y-2">
                    {currentItems.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/funko/${encodeURIComponent(item.id)}`)}
                        className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                          isDarkMode ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={item.imageName}
                          alt={item.title}
                          loading="lazy"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg flex-shrink-0 cursor-zoom-in"
                          onError={() => markImageBroken(item.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImageUrl(item.imageName);
                            setModalImageAlt(item.title);
                          }}
                        />
                        <div className="flex-grow min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                          <p className={`text-xs sm:text-sm mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {t.series || "Series"}: {Array.isArray(item.series) ? item.series.join(", ") : item.series}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                            #{item.number}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          {item.exclusive && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {t.exclusive || "Exclusive"}
                            </span>
                          )}
                          {item.isAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500 text-white font-semibold">ADMIN</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="ipp" className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {t.itemsPerPage || "Per page"}:
                    </label>
                    <select
                      id="ipp"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-1 rounded-lg text-sm border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200"} outline-none`}
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map((page, i) =>
                      page === "..." ? (
                        <span key={i} className="px-2 text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={i}
                          onClick={() => goToPage(page as number)}
                          className={`min-w-[36px] py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? isDarkMode
                                ? "bg-amber-400 text-slate-900"
                                : "bg-blue-600 text-white"
                              : isDarkMode
                                ? "hover:bg-slate-800"
                                : "hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className={`text-xs ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {t.page || "Page"} {currentPage} {t.of || "of"} {totalPages}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{t.noResult || "No results found."}</p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {t.requestMissingItem || "Request Missing Item"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          altText={modalImageAlt || "Funko Pop"}
          onClose={() => {
            setModalImageUrl(null);
            setModalImageAlt(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSubmitSuccess(false);
        }}
        isDarkMode={isDarkMode}
        onSubmit={handleRequestSubmit}
        isSubmitting={isSubmitting}
        submitSuccess={submitSuccess}
        t={t}
      />
    </Layout>
  );
};

export default SearchSite;
