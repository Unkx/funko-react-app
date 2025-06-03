import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { translations } from "./Translations/TranslationsSearchSite";

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

const SearchSite = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [funkoData, setFunkoData] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtry
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false);
  const [sortOption, setSortOption] = useState("titleAsc");

  const navigate = useNavigate();
  const location = useLocation();

  // Get query parameter from URL
  const queryParams = new URLSearchParams(location.search);
  const queryParam = queryParams.get("q") || "";

  // Obliczenia paginacji
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(results.length / itemsPerPage);

  // Zbierz unikalne serie
  const availableSeries = [...new Set(funkoData.flatMap((item) => item.series))];

    const languages = {
    EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  };

  // Pobieranie danych
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setFunkoData(data);
        setError(null);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
 
  // Initialize search query from URL when component mounts
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Wyszukiwanie + filtry + sortowanie
  useEffect(() => {
    if (queryParam && funkoData.length > 0) {
      let filteredResults = funkoData.filter((item) =>
        item.title.toLowerCase().includes(queryParam.toLowerCase())
      );

      // Filtr po serii
      if (categoryFilter) {
        filteredResults = filteredResults.filter((item) =>
          item.series.includes(categoryFilter)
        );
      }

      // Filtr po exclusive
      if (showExclusiveOnly) {
        filteredResults = filteredResults.filter((item) => item.exclusive === true);
      }

      // Sortowanie
      switch (sortOption) {
        case "titleDesc":
          filteredResults.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case "numberAsc":
          filteredResults.sort((a, b) => a.number - b.number);
          break;
        case "numberDesc":
          filteredResults.sort((a, b) => b.number - a.number);
          break;
        case "titleAsc":
        default:
          filteredResults.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      setResults(filteredResults);
      setCurrentPage(1);
    } else {
      setResults([]);
    }
  }, [queryParam, categoryFilter, showExclusiveOnly, sortOption, funkoData]);

  // Obsługa języka
  const selectLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };
  const t = translations[language] || translations["EN"];
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage) setLanguage(savedLanguage);
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("preferredTheme");
    if (savedTheme) setIsDarkMode(savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("preferredTheme", newMode ? "dark" : "light");
  };

  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  const handleSearch = (e) => {
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

  const goToPage = (pageNumber) => {
    if (pageNumber !== "...") {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Paginacja
  const getDisplayedPages = () => {
    const totalDisplayedPages = 5;
    const halfDisplay = Math.floor(totalDisplayedPages / 2);
    let startPage = Math.max(currentPage - halfDisplay, 1);
    let endPage = Math.min(startPage + totalDisplayedPages - 1, totalPages);
    if (endPage - startPage + 1 < totalDisplayedPages) {
      startPage = Math.max(endPage - totalDisplayedPages + 1, 1);
    }
    const pages = [];

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

  return (
    <div
      className={`search-site min-h-screen flex flex-col ${
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
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Login Button */}
        <div>
          <Link
            to="/loginSite"
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {translations[language].goToLoginSite || "Log In"}
          </Link>
        </div>
      </header>

      {/* Filtry */}
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
            className={`rounded ${isDarkMode ? "accent-yellow-500" : "accent-green-600"}`}
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

      {/* Główna zawartość */}
      <main className="flex-grow p-8 flex flex-col items-center justify-center">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {t.searchingResults}
              <span className="text-yellow-400"> {queryParam}</span>
            </h2>

            {results.length > 0 ? (
              <>
                <ul className="w-full max-w-4xl space-y-4">
                  {currentItems.map((item, index) => (
                    <li
                      key={index}
                      className={`px-6 py-4 rounded-lg flex gap-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={item.imageName || "/src/assets/placeholder.png"}
                          alt={item.title}
                          className="w-24 h-24 object-contain rounded-md"
                          onError={(e) => {
                            e.target.src = "/src/assets/placeholder.png";
                            e.target.onerror = null;
                          }}
                        />
                      </div>
                      <div className="flex-grow">
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

                {/* Paginacja */}
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
                      className={`px-2 py-1 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
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
                    {getDisplayedPages().map((page, index) => (
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
                    ))}
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
                    {t.page} {currentPage} {t.of}{" "}
                    {totalPages}
                  </div>
                </div>
              </>
            ) : (
              <p>{t.noResult}</p>
            )}
          </>
        )}
      </main>

      {/* Stopka */}
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

export default SearchSite;