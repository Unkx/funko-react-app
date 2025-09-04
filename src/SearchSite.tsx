import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { translations } from "./Translations/TranslationsSearchSite";

// Icons
import MoonIcon from "./assets/moon.svg?react";
import SunIcon from "./assets/sun.svg?react";
import SearchIcon from "./assets/search.svg?react";
import GlobeIcon from "./assets/globe.svg?react";
import ChevronDownIcon from "./assets/chevron-down.svg?react";

// Add a simple CloseIcon if you don't have one as a separate SVG file
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


// Flags (assuming these paths are correct)
import UKFlag from "./assets/flags/uk.svg?react";
import PolandFlag from "./assets/flags/poland.svg?react";
import RussiaFlag from "./assets/flags/russia.svg?react";
import FranceFlag from "./assets/flags/france.svg?react";
import GermanyFlag from "./assets/flags/germany.svg?react";
import SpainFlag from "./assets/flags/spain.svg?react";

// --- START NEW MODAL COMPONENT ---
interface ImageModalProps {
  imageUrl: string;
  altText: string;
  onClose: () => void;
  isDarkMode: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText, onClose, isDarkMode }) => {
  useEffect(() => {
    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close when clicking outside the image
    >
      <div
        className={`relative ${isDarkMode ? "bg-gray-800" : "bg-white"} p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1 rounded-full ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-black hover:bg-gray-300"}`}
          aria-label="Close image"
        >
          <CloseIcon className="w-6 h-6" /> {/* Using the new CloseIcon */}
        </button>
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[calc(90vh-60px)] object-contain" // Adjusted max-height to account for padding/button
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
// --- END NEW MODAL COMPONENT ---


const SearchSite = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [funkoData, setFunkoData] = useState([]);
  const [filteredAndSortedResults, setFilteredAndSortedResults] = useState(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const [sortOption, setSortOption] = useState("titleAsc");

  // --- NEW STATE FOR MODAL ---
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageAlt, setModalImageAlt] = useState<string | null>(null);
  // --- END NEW STATE FOR MODAL ---


  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const queryParam = queryParams.get("q") || "";

  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedResults.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, filteredAndSortedResults]);

  const availableSeries = useMemo(() => {
    return [...new Set(funkoData.flatMap((item: any) => item.series))];
  }, [funkoData]);

  const languages = {
    EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  };

  // Helper to generate IDs
  const generateId = (title: string , number: string ): string => { // | 
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`.replace(/\s+/g, "-");
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Generate IDs for the fetched data before setting it
        const dataWithIds = data.map((item: any) => ({
          ...item,
          id: generateId(item.title, item.number),
        }));
        setFunkoData(dataWithIds); // Store data with IDs
        setError(null);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Initialize search query from URL
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        dropdownRef.current &&
        buttonRef.current &&
        !(dropdownRef.current as Node).contains(event.target as Node) &&
        !(buttonRef.current as Node).contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // Effect for filtering and sorting the main data.
  useEffect(() => {
    if (funkoData.length === 0) {
      setFilteredAndSortedResults([]);
      return;
    }

    let currentProcessedResults = funkoData.filter((item: any) =>
      item.title.toLowerCase().includes(queryParam.toLowerCase())
    );

    if (categoryFilter) {
      currentProcessedResults = currentProcessedResults.filter((item: any) =>
        item.series.includes(categoryFilter)
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
          b.title.localeCompare(a.title)
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
          a.title.localeCompare(b.title)
        );
        break;
    }

    setFilteredAndSortedResults(currentProcessedResults);
    setCurrentPage(1); // Reset to first page when filters/sort/search change
  }, [queryParam, categoryFilter, showExclusiveOnly, sortOption, funkoData]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  // Save theme preference and apply class to document.documentElement
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const t = translations[language] || translations["EN"];

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
      navigate("/searchsite"); // Clear search query from URL
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
    return "/loginSite";
  }, []);

  const loginButtonText = useMemo(() => {
    return localStorage.getItem("user")
      ? t.goToDashboard || "Dashboard"
      : t.goToLoginSite || "Log In";
  }, [t]);

  // --- NEW HANDLERS FOR MODAL ---
  const openImageModal = (imageUrl: string, altText: string) => {
    setModalImageUrl(imageUrl);
    setModalImageAlt(altText);
  };

  const closeImageModal = () => {
    setModalImageUrl(null);
    setModalImageAlt(null);
  };
  // --- END NEW HANDLERS FOR MODAL ---

  return (
    <div
      className={`search-site min-h-screen flex flex-col ${
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

        {/* Search Form */}
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
            {isDarkMode ? (
              <SunIcon className="w-6 h-6" />
            ) : (
              <MoonIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Login Button */}
          <div>
            <Link
              to={loginButtonTo}
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? "bg-yellow-500 text-black hover:bg-yellow-600"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {loginButtonText}
            </Link>
          </div>
      </header>

      {/* Filters */}
      <div className="p-4 flex flex-wrap gap-4 justify-center">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`px-3 py-2 rounded ${isDarkMode ? "bg-gray-700" : "bg-white"}`}
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
              isDarkMode ? "accent-yellow-500" : "accent-green-600"
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

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center justify-center">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
        ) : (
          <>
            {queryParam && (
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
                {t.searchingResults}
                <span className="text-yellow-400"> {queryParam}</span>
              </h2>
            )}

            {filteredAndSortedResults.length > 0 ? (
              <>
                <ul className="w-full max-w-4xl space-y-4">
                  {currentItems.map((item: any) => (
                    <li
                      key={item.id} // Using item.id as key is best practice
                      className={`p-4 sm:px-6 sm:py-4 rounded-lg flex flex-col sm:flex-row gap-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      } cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => navigate(`/funko/${item.id}`)}
                    >
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {/* THE IMAGE ELEMENT - CORRECTED SRC AND ADDED MODAL CLICK */}
                        <img
                          src={item.imageName || "/src/assets/placeholder.png"} // Corrected to item.imageName
                          alt={item.title}
                          className="w-24 h-24 object-contain rounded-md cursor-zoom-in"
                          onError={(e) => {
                            e.currentTarget.src = "/src/assets/placeholder.png";
                            e.currentTarget.onerror = null;
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents the <li>'s navigate from firing
                            openImageModal(item.imageName || "/src/assets/placeholder.png", item.title); // Corrected for modal
                          }}
                        />
                      </div>
                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="text-sm">
                          {t.series}: {item.series.join(", ")}
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

                {/* Pagination */}
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
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
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
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      &lt;
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
                                : "bg-green-600 text-white"
                              : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600"
                              : "bg-gray-200 hover:bg-gray-300"
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
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      &gt;
                    </button>

                  </div>

                  <div className="text-sm">
                    {t.page} {currentPage} {t.of} {totalPages}
                  </div>
                </div>
              </>
            ) : (
              <p>{t.noResult}</p>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`text-center py-4 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"
        }`}
      >
        {t.copyright}
      </footer>

      {/* --- NEW MODAL RENDER --- */}
      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          altText={modalImageAlt || "Funko Pop Image"}
          onClose={closeImageModal}
          isDarkMode={isDarkMode}
        />
      )}
      {/* --- END NEW MODAL RENDER --- */}
    </div>
  );
};

export default SearchSite;
