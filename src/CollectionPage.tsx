import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import useBreakpoints from "./useBreakpoints";
import { translations } from "./Translations/TranslationsDashboard";

// Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
import EditIcon from "/src/assets/edit.svg?react";
import DeleteIcon from "/src/assets/delete.svg?react";
import SaveIcon from "/src/assets/save.svg?react";
import CancelIcon from "/src/assets/cancel.svg?react";
import PlusIcon from "/src/assets/plus.svg?react";
import FilterIcon from "/src/assets/filter.svg?react";

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

interface FunkoItem {
  id: string;
  title: string;
  number: string;
  image_name?: string;
  condition?: string;
  added_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  series?: string;
}

const CollectionPage: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  
  // Collection specific states
  const [collection, setCollection] = useState<FunkoItem[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<FunkoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FunkoItem>>({});
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const t = translations[language] || translations["EN"];

  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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

  useEffect(() => {
    const savedLang = localStorage.getItem("preferredLanguage");
    if (savedLang && languages[savedLang as keyof typeof languages]) {
      setLanguage(savedLang);
    }

    const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
    if (!hasSeenPopup) {
      setShouldShowPopup(true);
      localStorage.setItem("hasSeenLanguagePopup", "true");
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        buttonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/loginregistersite");
        return;
      }

      try {
        const response = await fetch("http://192.168.0.162:5000/api/collection", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCollection(data);
        } else {
          setCollection([]);
        }
      } catch (error) {
        console.error("Failed to fetch collection:", error);
        setCollection([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [navigate]);

  // Filter and sort collection
  useEffect(() => {
    let filtered = collection.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                           item.number.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                           (item.series && item.series.toLowerCase().includes(collectionSearch.toLowerCase()));
      
      const matchesCondition = filterCondition === "all" || item.condition === filterCondition;
      
      return matchesSearch && matchesCondition;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "number":
          aValue = parseInt(a.number) || 0;
          bValue = parseInt(b.number) || 0;
          break;
        case "condition":
          aValue = a.condition || "";
          bValue = b.condition || "";
          break;
        case "purchase_date":
          aValue = new Date(a.purchase_date || "").getTime();
          bValue = new Date(b.purchase_date || "").getTime();
          break;
        case "purchase_price":
          aValue = a.purchase_price || 0;
          bValue = b.purchase_price || 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredCollection(filtered);
  }, [collection, collectionSearch, filterCondition, sortBy, sortOrder]);

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  const handleEditItem = (item: FunkoItem) => {
    setEditingItem(item.id);
    setEditForm(item);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://192.168.0.162:5000/api/collection/${editingItem}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setCollection(prev => prev.map(item => 
          item.id === editingItem ? updatedItem : item
        ));
        setEditingItem(null);
        setEditForm({});
      }
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.confirmDelete)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://192.168.0.162:5000/api/collection/${itemId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCollection(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const conditions = ["mint", "near_mint", "good", "fair", "poor"];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-8 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 relative">
        <div className="flex-shrink-0">
          <Link to="/" className="no-underline">
            <h1 className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] tracking-wide ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              Pop&Go!
            </h1>
          </Link>
          {shouldShowPopup && (
            <LanguageSelectorPopup onClose={() => setShouldShowPopup(false)} />
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className={`flex-grow max-w-lg mx-auto flex rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-grow px-4 py-2 outline-none ${isDarkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-white text-black"}`}
            aria-label="Search input"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"}`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Theme & Language Toggle */}
        <div className="flex-shrink-0 flex gap-4 min-w-0 items-center">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 min-w-0 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              aria-label="Select language"
            >
              <GlobeIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">{language}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
            </button>
            {showLanguageDropdown && (
              <div ref={languageDropdownRef} className={`absolute mt-2 z-50 rounded-lg shadow-xl py-1 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600`}>
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`lang-item w-full text-left px-4 py-2 flex items-center gap-2 whitespace-nowrap ${
                      language === code
                        ? isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                        : isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
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
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`px-8 py-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}>
        <div className="flex gap-4">
          <Link to="/dashboardSite" className={`px-3 py-1 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>
            {t.dashboard}
          </Link>
          <Link to="/collection" className={`px-3 py-1 rounded ${isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"}`}>
            {t.collection}
          </Link>
          <Link to="/wishlist" className={`px-3 py-1 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>
            {t.wishlist}
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-3xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {t.yourCollection}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
            >
              <FilterIcon className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.searchCollection}</label>
                  <input
                    type="text"
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    placeholder={t.searchByPlaceholder}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="all">{t.allConditions}</option>
                      {conditions.map(condition => (
                        <option key={condition} value={condition}>
                          {t[condition] || condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.sortBy}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="title">{t.title}</option>
                    <option value="number">{t.number}</option>
                    <option value="condition">{t.condition}</option>
                    <option value="purchase_date">{t.purchaseDate}</option>
                    <option value="purchase_price">{t.price}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.order}</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="asc">{t.ascending}</option>
                    <option value="desc">{t.descending}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Collection Stats */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {collection.length}
                </div>
                <div className="text-sm">{t.totalItems}</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {filteredCollection.length}
                </div>
                <div className="text-sm">{t.filteredItems}</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  ${collection.reduce((sum, item) => sum + (item.purchase_price || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm">{t.totalValue}</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {new Set(collection.map(item => item.series)).size}
                </div>
                <div className="text-sm">{t.series}</div>
              </div>
            </div>
          </div>

          {/* Collection Grid */}
          {loading ? (
            <div className="text-center py-8">Loading your collection...</div>
          ) : filteredCollection.length === 0 ? (
              <div className="text-center py-8">
                  {collection.length === 0 ? (
                    <div>
                      <p className="mb-4">{t.emptyCollection}</p>
                      <Link 
                        to="/searchsite" 
                        className={`px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                      >
                        {t.startAddingItems}
                      </Link>
                    </div>
                  ) : (
                    <p>{t.noItemsMatch}</p>
                  )}
                </div>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollection.map(item => (
                <div key={item.id} className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
                  {item.image_name && (
                    <img src={item.image_name} alt={item.title} className="w-full h-48 object-contain bg-gray-100" />
                  )}
                  <div className="p-4">
                    {editingItem === item.id ? (
                      <div className="space-y-3">
                        <input
                          name="title"
                          value={editForm.title || ""}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <input
                          name="number"
                          value={editForm.number || ""}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <select
                          name="condition"
                          value={editForm.condition || ""}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        >
                          {conditions.map(condition => (
                            <option key={condition} value={condition}>
                              {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                        <input
                          name="purchase_price"
                          type="number"
                          step="0.01"
                          value={editForm.purchase_price || ""}
                          onChange={handleInputChange}
                          placeholder="Purchase Price"
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <textarea
                          name="notes"
                          value={editForm.notes || ""}
                          onChange={handleInputChange}
                          placeholder={t.notes}
                          rows={2}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <SaveIcon className="w-4 h-4" />
                            {t.save}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center gap-1"
                          >
                            <CancelIcon className="w-4 h-4" />
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                        <p className="text-sm mb-1">#{item.number}</p>
                        {item.series && <p className="text-sm mb-1">{t.seriesLabel}: {item.series}</p>}
                        {item.condition && <p className="text-sm mb-1">{t.conditionLabel}: {t[item.condition] || item.condition}</p>}
                        {item.purchase_price && <p className="text-sm mb-1">{t.price}: ${item.purchase_price}</p>}
                        {item.purchase_date && (
                          <p className="text-sm mb-1">
                            {t.purchased}: {new Date(item.purchase_date).toLocaleDateString()}
                          </p>
                        )}
                        {item.notes && <p className="text-sm mb-3 italic">{item.notes}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className={`flex-1 px-3 py-1 rounded flex items-center justify-center gap-1 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                          >
                            <EditIcon className="w-4 h-4" />
                            {t.edit}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center gap-1"
                          >
                            <DeleteIcon className="w-4 h-4" />
                            {t.remove}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

export default CollectionPage;