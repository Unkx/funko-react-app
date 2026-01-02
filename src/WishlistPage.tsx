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
import HeartIcon from "/src/assets/heart.svg?react";
import ShoppingCartIcon from "/src/assets/shopping-cart.svg?react";
import FilterIcon from "/src/assets/filter.svg?react";
import StarIcon from "/src/assets/star.svg?react";

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

interface WishlistItem {
  id: string;
  title: string;
  number: string;
  image_name?: string;
  added_date?: string;
  priority?: "low" | "medium" | "high";
  notes?: string;
  series?: string;
  max_price?: number;
  target_condition?: string;
}

const WishlistPage: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  
  // Wishlist specific states
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [filteredWishlist, setFilteredWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WishlistItem>>({});
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("added_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [wishlistSearch, setWishlistSearch] = useState("");
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

  // Fetch wishlist data
  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/loginregistersite");
        return;
      }

      try {
        const response = await fetch("http://192.168.0.162:5000/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWishlist(data);
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  // Filter and sort wishlist
  useEffect(() => {
    let filtered = wishlist.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(wishlistSearch.toLowerCase()) ||
                           item.number.toLowerCase().includes(wishlistSearch.toLowerCase()) ||
                           (item.series && item.series.toLowerCase().includes(wishlistSearch.toLowerCase()));
      
      const matchesPriority = filterPriority === "all" || item.priority === filterPriority;
      
      return matchesSearch && matchesPriority;
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
        case "priority":
          const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "added_date":
          aValue = new Date(a.added_date || "").getTime();
          bValue = new Date(b.added_date || "").getTime();
          break;
        case "max_price":
          aValue = a.max_price || 0;
          bValue = b.max_price || 0;
          break;
        default:
          aValue = new Date(a.added_date || "").getTime();
          bValue = new Date(b.added_date || "").getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredWishlist(filtered);
  }, [wishlist, wishlistSearch, filterPriority, sortBy, sortOrder]);

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

  const handleEditItem = (item: WishlistItem) => {
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
      const response = await fetch(`http://192.168.0.162:5000/api/wishlist/${editingItem}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setWishlist(prev => prev.map(item => 
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
    if (!confirm("Are you sure you want to remove this item from your wishlist?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://192.168.0.162:5000/api/wishlist/${itemId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWishlist(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleMoveToCollection = async (item: WishlistItem) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Add to collection
      const response = await fetch("http://192.168.0.162:5000/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: item.title,
          number: item.number,
          image_name: item.image_name,
          series: item.series,
          condition: item.target_condition || "mint",
          purchase_price: item.max_price
        })
      });

      if (response.ok) {
        // Remove from wishlist
        await handleDeleteItem(item.id);
        alert("Item moved to your collection!");
      }
    } catch (error) {
      console.error("Failed to move item to collection:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    const count = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
    return (
      <div className="flex">
        {[...Array(count)].map((_, i) => (
          <StarIcon key={i} className={`w-4 h-4 ${getPriorityColor(priority)} fill-current`} />
        ))}
      </div>
    );
  };

  const conditions = ["mint", "near_mint", "good", "fair", "poor"];
  const priorities = ["low", "medium", "high"];

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
              <div ref={languageDropdownRef} className={`absolute mt-2 z-50 lang-dropdown variant-b rounded-lg shadow-xl py-2 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto`}>
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`lang-item w-full text-left px-4 py-2 flex items-center gap-2 ${
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
            Dashboard
          </Link>
          <Link to="/collection" className={`px-3 py-1 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}>
            Collection
          </Link>
          <Link to="/wishlist" className={`px-3 py-1 rounded ${isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white"}`}>
            Wishlist
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-3xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {t.yourWishlist}
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
                  <label className="block text-sm font-medium mb-1">Search Wishlist</label>
                  <input
                    type="text"
                    value={wishlistSearch}
                    onChange={(e) => setWishlistSearch(e.target.value)}
                    placeholder="Search by title, number, or series..."
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="all">All Priorities</option>
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="added_date">Date Added</option>
                    <option value="title">Title</option>
                    <option value="number">Number</option>
                    <option value="priority">Priority</option>
                    <option value="max_price">Max Price</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist Stats */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {wishlist.length}
                </div>
                <div className="text-sm">Total Items</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {wishlist.filter(item => item.priority === "high").length}
                </div>
                <div className="text-sm">High Priority</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  ${wishlist.reduce((sum, item) => sum + (item.max_price || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm">Total Budget</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                  {new Set(wishlist.map(item => item.series)).size}
                </div>
                <div className="text-sm">Series</div>
              </div>
            </div>
          </div>

          {/* Wishlist Grid */}
          {loading ? (
            <div className="text-center py-8">Loading your wishlist...</div>
          ) : filteredWishlist.length === 0 ? (
            <div className="text-center py-8">
              {wishlist.length === 0 ? (
                <div>
                  <p className="mb-4">{t.noItemsInWishlist}</p>
                  <Link 
                    to="/searchsite" 
                    className={`px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                  >
                    Start Adding Items
                  </Link>
                </div>
              ) : (
                <p>No items match your current filters.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWishlist.map(item => (
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
                          name="priority"
                          value={editForm.priority || ""}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        >
                          <option value="">Select Priority</option>
                          {priorities.map(priority => (
                            <option key={priority} value={priority}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </option>
                          ))}
                        </select>
                        <input
                          name="max_price"
                          type="number"
                          step="0.01"
                          value={editForm.max_price || ""}
                          onChange={handleInputChange}
                          placeholder="Max Price"
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <select
                          name="target_condition"
                          value={editForm.target_condition || ""}
                          onChange={handleInputChange}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        >
                          <option value="">Target Condition</option>
                          {conditions.map(condition => (
                            <option key={condition} value={condition}>
                              {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                        <textarea
                          name="notes"
                          value={editForm.notes || ""}
                          onChange={handleInputChange}
                          placeholder="Notes"
                          rows={2}
                          className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                          >
                            <SaveIcon className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center gap-1"
                          >
                            <CancelIcon className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg flex-1">{item.title}</h3>
                          {item.priority && (
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(item.priority)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm mb-1">#{item.number}</p>
                        {item.series && <p className="text-sm mb-1">Series: {item.series}</p>}
                        {item.target_condition && <p className="text-sm mb-1">Target: {item.target_condition}</p>}
                        {item.max_price && <p className="text-sm mb-1">Max Price: ${item.max_price}</p>}
                        {item.added_date && (
                          <p className="text-sm mb-1">
                            Added: {new Date(item.added_date).toLocaleDateString()}
                          </p>
                        )}
                        {item.notes && <p className="text-sm mb-3 italic">{item.notes}</p>}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className={`flex-1 px-3 py-1 rounded flex items-center justify-center gap-1 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                            >
                              <EditIcon className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center gap-1"
                            >
                              <DeleteIcon className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                          <button
                            onClick={() => handleMoveToCollection(item)}
                            className={`w-full px-3 py-1 rounded flex items-center justify-center gap-1 ${isDarkMode ? "bg-green-500 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                          >
                            <ShoppingCartIcon className="w-4 h-4" />
                            Add to Collection
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

export default WishlistPage;