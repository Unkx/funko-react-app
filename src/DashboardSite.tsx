import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations } from "./Translations/TranslationsDashboard";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import MoonIcon from "./assets/moon.svg?react";
import SunIcon from "./assets/sun.svg?react";
import SearchIcon from "./assets/search.svg?react";
import GlobeIcon from "./assets/globe.svg?react";
import ChevronDownIcon from "./assets/chevron-down.svg?react";
import EditIcon from "./assets/edit.svg?react";
import DeleteIcon from "./assets/delete.svg?react";
import SaveIcon from "./assets/save.svg?react";
import CancelIcon from "./assets/cancel.svg?react";
import HeartIcon from "./assets/heart.svg?react";
import ShoppingCartIcon from "./assets/shopping-cart.svg?react";
import FilterIcon from "./assets/filter.svg?react";
import StarIcon from "./assets/star.svg?react";
import PlusIcon from "./assets/plus.svg?react";
import ChartIcon from "./assets/chart.svg?react";
import UsersIcon from "./assets/users.svg?react";

// Flags
import UKFlag from "./assets/flags/UK.svg?react";
import PolandFlag from "./assets/flags/poland.svg?react";
import RussiaFlag from "./assets/flags/russia.svg?react";
import FranceFlag from "./assets/flags/france.svg?react";
import GermanyFlag from "./assets/flags/germany.svg?react";
import SpainFlag from "./assets/flags/spain.svg?react";
import USAFlag from "./assets/flags/usa.svg?react";

const languages = {
  EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
  US: { name: "English (US)", flag: <USAFlag className="w-5 h-5" /> },
};

const languageNames = {
  EN: "English",
  PL: "Polski",
  RU: "Русский",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
};

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  login: string;
  gender: string;
  date_of_birth: string;
  role: string;
  created_at: string;
  last_login: string;
}

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

// Updated ActiveView type
type ActiveView = "dashboard" | "collection" | "wishlist" | "analytics" | "social";

const DashboardSite: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<string>(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    return savedLanguage || "EN";
  });
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("GB");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    surname: "",
    gender: "",
    date_of_birth: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Collection states
  const [collection, setCollection] = useState<FunkoItem[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<FunkoItem[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [editingCollectionItem, setEditingCollectionItem] = useState<string | null>(null);
  const [editCollectionForm, setEditCollectionForm] = useState<Partial<FunkoItem>>({});
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [collectionSortBy, setCollectionSortBy] = useState<string>("title");
  const [collectionSortOrder, setCollectionSortOrder] = useState<"asc" | "desc">("asc");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);

  // Wishlist states
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [filteredWishlist, setFilteredWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [editingWishlistItem, setEditingWishlistItem] = useState<string | null>(null);
  const [editWishlistForm, setEditWishlistForm] = useState<Partial<WishlistItem>>({});
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [wishlistSortBy, setWishlistSortBy] = useState<string>("added_date");
  const [wishlistSortOrder, setWishlistSortOrder] = useState<"asc" | "desc">("desc");
  const [wishlistSearch, setWishlistSearch] = useState("");
  const [showWishlistFilters, setShowWishlistFilters] = useState(false);

  // Analytics and Social states
  const [userStats, setUserStats] = useState<any>(null);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // Theme effect
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // User data and language popup effect
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!userData || !token) {
        navigate("/LoginSite");
        return;
      }
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEditForm({
          name: parsedUser.name,
          surname: parsedUser.surname,
          gender: parsedUser.gender,
          date_of_birth: parsedUser.date_of_birth
        });
        const response = await fetch(`http://localhost:5000/api/users/${parsedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const freshUserData = await response.json();
          setUser(freshUserData);
          localStorage.setItem("user", JSON.stringify(freshUserData));
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
    const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
    if (!hasSeenPopup) {
      setShouldShowPopup(true);
      localStorage.setItem("hasSeenLanguagePopup", "true");
    }
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
  }, [showLanguageDropdown, navigate]);

  // Fetch analytics when analytics tab is active
  useEffect(() => {
    if (activeView === "analytics") {
      fetchUserAnalytics();
    }
  }, [activeView]);

  // Fetch collection
  useEffect(() => {
    const fetchCollection = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/LoginSite");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/collection", {
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
        setCollectionLoading(false);
      }
    };
    if (activeView === "collection" || activeView === "dashboard") {
      fetchCollection();
    }
  }, [navigate, activeView]);

  // Filter and sort collection
  useEffect(() => {
    let filtered = collection.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                           item.number.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                           (item.series && item.series.toLowerCase().includes(collectionSearch.toLowerCase()));
      const matchesCondition = filterCondition === "all" || item.condition === filterCondition;
      return matchesSearch && matchesCondition;
    });
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";
      switch (collectionSortBy) {
        case "title": aValue = a.title.toLowerCase(); bValue = b.title.toLowerCase(); break;
        case "number": aValue = parseInt(a.number) || 0; bValue = parseInt(b.number) || 0; break;
        case "condition": aValue = a.condition || ""; bValue = b.condition || ""; break;
        case "purchase_date": aValue = new Date(a.purchase_date || "").getTime(); bValue = new Date(b.purchase_date || "").getTime(); break;
        case "purchase_price": aValue = a.purchase_price || 0; bValue = b.purchase_price || 0; break;
        default: aValue = a.title.toLowerCase(); bValue = b.title.toLowerCase();
      }
      return collectionSortOrder === "asc" ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });
    setFilteredCollection(filtered);
  }, [collection, collectionSearch, filterCondition, collectionSortBy, collectionSortOrder]);

  // Fetch wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/LoginSite");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/wishlist", {
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
        setWishlistLoading(false);
      }
    };
    if (activeView === "wishlist" || activeView === "dashboard") {
      fetchWishlist();
    }
  }, [navigate, activeView]);

  // Filter and sort wishlist
  useEffect(() => {
    let filtered = wishlist.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(wishlistSearch.toLowerCase()) ||
                           item.number.toLowerCase().includes(wishlistSearch.toLowerCase()) ||
                           (item.series && item.series.toLowerCase().includes(wishlistSearch.toLowerCase()));
      const matchesPriority = filterPriority === "all" || item.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
    filtered.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";
      switch (wishlistSortBy) {
        case "title": aValue = a.title.toLowerCase(); bValue = b.title.toLowerCase(); break;
        case "number": aValue = parseInt(a.number) || 0; bValue = parseInt(b.number) || 0; break;
        case "priority": 
          const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "added_date": aValue = new Date(a.added_date || "").getTime(); bValue = new Date(b.added_date || "").getTime(); break;
        case "max_price": aValue = a.max_price || 0; bValue = b.max_price || 0; break;
        default: aValue = new Date(a.added_date || "").getTime(); bValue = new Date(b.added_date || "").getTime();
      }
      return wishlistSortOrder === "asc" ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });
    setFilteredWishlist(filtered);
  }, [wishlist, wishlistSearch, filterPriority, wishlistSortBy, wishlistSortOrder]);

  // Activity logging function
  const logActivity = async (actionType: string, details?: any) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch("http://localhost:5000/api/activity/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action_type: actionType,
          action_details: details || {},
          session_duration: Math.floor(Date.now() / 1000)
        })
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  // Fetch user analytics data
  const fetchUserAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const [statsRes, loyaltyRes, friendsRes, leaderboardRes] = await Promise.all([
        fetch("http://localhost:5000/api/activity/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/loyalty/calculate", { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/friends", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/loyalty/leaderboard", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (statsRes.ok) setUserStats(await statsRes.json());
      else console.warn("Failed to fetch user stats");
      
      if (loyaltyRes.ok) setLoyaltyData(await loyaltyRes.json());
      else console.warn("Failed to fetch loyalty data");
      
      if (friendsRes.ok) setFriends(await friendsRes.json());
      else console.warn("Failed to fetch friends");
      
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      else console.warn("Failed to fetch leaderboard");
      
    } catch (err) {
      console.error("Failed to fetch user analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const toggleLanguageDropdown = () => setShowLanguageDropdown((prev) => !prev);

  // Log activity on search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await logActivity("search", { query: searchQuery });
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/searchsite");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/LoginSite");
  };

  const handleEditClick = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditForm({
        name: user.name,
        surname: user.surname,
        gender: user.gender,
        date_of_birth: user.date_of_birth
      });
    }
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editForm)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Collection item handlers
  const handleEditCollectionItem = (item: FunkoItem) => {
    setEditingCollectionItem(item.id);
    setEditCollectionForm(item);
  };

  const handleCancelCollectionEdit = () => {
    setEditingCollectionItem(null);
    setEditCollectionForm({});
  };

  const handleSaveCollectionEdit = async () => {
    if (!editingCollectionItem) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/collection/${editingCollectionItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editCollectionForm)
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setCollection(prev => prev.map(item => item.id === editingCollectionItem ? updatedItem : item));
        setEditingCollectionItem(null);
        setEditCollectionForm({});
      }
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteCollectionItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from your collection?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/collection/${itemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setCollection(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleCollectionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditCollectionForm(prev => ({ ...prev, [name]: value }));
  };

  // Wishlist item handlers
  const handleEditWishlistItem = (item: WishlistItem) => {
    setEditingWishlistItem(item.id);
    setEditWishlistForm(item);
  };

  const handleCancelWishlistEdit = () => {
    setEditingWishlistItem(null);
    setEditWishlistForm({});
  };

  const handleSaveWishlistEdit = async () => {
    if (!editingWishlistItem) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/${editingWishlistItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editWishlistForm)
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setWishlist(prev => prev.map(item => item.id === editingWishlistItem ? updatedItem : item));
        setEditingWishlistItem(null);
        setEditWishlistForm({});
      }
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteWishlistItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from your wishlist?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/${itemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setWishlist(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  // Log activity when adding to collection
  const handleAddToCollection = async (item: any) => {
    await logActivity("collection_add", { item_id: item.id, title: item.title });
  };

  // Log activity when adding to wishlist
  const handleAddToWishlist = async (item: any) => {
    await logActivity("wishlist_add", { item_id: item.id, title: item.title });
  };

  const handleMoveToCollection = async (item: WishlistItem) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5000/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
        await handleDeleteWishlistItem(item.id);
        alert("Item moved to your collection!");
        await logActivity("collection_add", { item_id: item.id, title: item.title });
      }
    } catch (error) {
      console.error("Failed to move item to collection:", error);
    }
  };

  const handleWishlistInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditWishlistForm(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(language);
  };

  // Render Analytics View
  const renderAnalyticsView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
        {t.yourStats || "Your Statistics"}
      </h2>

      {analyticsLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <p className="mt-2">Loading your stats...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Loyalty Score Card */}
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t.loyaltyScore || "Loyalty Score"}</h3>
              <div className="flex items-center gap-2">
                <StarIcon className="w-6 h-6 text-yellow-500" />
                <span className="text-3xl font-bold text-yellow-500">
                  {loyaltyData?.loyaltyScore || 0}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t.activeDays || "Active Days"}</p>
                <p className="text-xl font-bold">{loyaltyData?.activeDays || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">{t.accountAge || "Account Age"}</p>
                <p className="text-xl font-bold">{loyaltyData?.accountAge || 0} days</p>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
            <h3 className="text-xl font-semibold mb-4">{t.yourActivity || "Your Activity"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{userStats?.overall?.total_actions || 0}</p>
                <p className="text-sm text-gray-500">{t.totalActions || "Total Actions"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{userStats?.overall?.active_days || 0}</p>
                <p className="text-sm text-gray-500">{t.activeDays || "Active Days"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round((userStats?.overall?.avg_session_duration || 0) / 60)}
                </p>
                <p className="text-sm text-gray-500">{t.avgSession || "Avg Session (min)"}</p>
              </div>
            </div>
          </div>

          {/* Activity Breakdown */}
          {userStats?.breakdown && userStats.breakdown.length > 0 && (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-4">{t.activityBreakdown || "Activity Breakdown"}</h3>
              <div className="space-y-2">
                {userStats.breakdown.map((action: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="capitalize">{action.action_type.replace('_', ' ')}</span>
                    <span className="font-bold">{action.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Position */}
          {leaderboard.length > 0 && (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-4">{t.leaderboard || "Leaderboard"}</h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry: any, idx: number) => {
                  const isCurrentUser = entry.login === user?.login;
                  return (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-2 rounded ${
                        isCurrentUser ? (isDarkMode ? "bg-yellow-900" : "bg-green-100") : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8">
                          {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                        </span>
                        <span className={isCurrentUser ? "font-bold" : ""}>
                          {entry.login} {isCurrentUser && "(You)"}
                        </span>
                      </div>
                      <span className="font-bold">{entry.loyalty_score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!userStats && !analyticsLoading) && (
            <div className="text-center py-8 text-gray-500">
              <p>No analytics data available yet.</p>
              <p className="text-sm">Start using the app to see your statistics!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Social View
  const renderSocialView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
        {t.social || "Social"}
      </h2>

      {/* Friend Request Form */}
      <div className={`p-6 rounded-lg shadow-lg mb-6 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
        <h3 className="text-xl font-semibold mb-4">{t.addFriend || "Add Friend"}</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const friendLogin = formData.get("friendLogin") as string;
          
          const token = localStorage.getItem("token");
          if (!token) return;

          try {
            const response = await fetch("http://localhost:5000/api/friends/request", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ friendLogin })
            });

            if (response.ok) {
              alert("Friend request sent!");
              e.currentTarget.reset();
              fetchUserAnalytics();
            } else {
              const error = await response.json();
              alert(error.error || "Failed to send friend request");
            }
          } catch (err) {
            console.error("Error sending friend request:", err);
            alert("Failed to send friend request");
          }
        }}>
          <div className="flex gap-2">
            <input
              name="friendLogin"
              type="text"
              placeholder="Enter username..."
              required
              className={`flex-1 px-4 py-2 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded ${
                isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {t.sendRequest || "Send Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Friends List */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
        <h3 className="text-xl font-semibold mb-4">{t.yourFriends || "Your Friends"}</h3>
        {friends.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {t.noFriends || "You don't have any friends yet. Start connecting!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(friend => (
              <div 
                key={friend.id}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{friend.login}</h4>
                    <p className="text-sm text-gray-500">
                      {friend.name} {friend.surname}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    friend.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {friend.status}
                  </span>
                </div>
                <p className="text-sm">
                  {t.collectionSize || "Collection"}: {friend.collection_size} items
                </p>
                {friend.status === "pending" && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (!token) return;
                      try {
                        const response = await fetch(
                          `http://localhost:5000/api/friends/accept/${friend.id}`,
                          { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (response.ok) {
                          alert("Friend request accepted!");
                          fetchUserAnalytics();
                        }
                      } catch (err) {
                        console.error("Error accepting friend:", err);
                      }
                    }}
                    className="mt-2 w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {t.acceptRequest || "Accept"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <>
      <h3 className="text-xl font-semibold mb-4 ">{t.welcome} {user?.name || ""}</h3>
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
        {t.dashboardWelcome} 
      </h2>
      {/* Section: Profile Info */}
      <section className="max-w-4xl w-full mx-auto bg-opacity-50 p-8 rounded-xl shadow-xl mb-10 dark:bg-gray-800 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t.profile}</h3>
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              <EditIcon className="w-5 h-5" />
              <span className="font-medium">{t.edit}</span>
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                  isDarkMode ? "bg-green-500 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                <SaveIcon className="w-5 h-5" />
                <span className="font-medium">{isLoading ? t.saving : t.save}</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                  isDarkMode ? "bg-gray-500 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400"
                } text-gray-800 dark:text-white`}
              >
                <CancelIcon className="w-5 h-5" />
                <span className="font-medium">{t.cancel}</span>
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
          }`}>
            {error}
          </div>
        )}
        <ul className="space-y-4 text-lg">
          {isEditing ? (
            <>
              <li className="flex flex-col md:flex-row md:items-center gap-2">
                <strong className="w-full md:w-1/3 text-gray-700 dark:text-gray-300">{t.name}:</strong>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className={`flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                    isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-50 text-gray-900 border-gray-300"
                  }`}
                />
              </li>
              <li className="flex flex-col md:flex-row md:items-center gap-2">
                <strong className="w-full md:w-1/3 text-gray-700 dark:text-gray-300">{t.surname}:</strong>
                <input
                  type="text"
                  name="surname"
                  value={editForm.surname}
                  onChange={handleInputChange}
                  className={`flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                    isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-50 text-gray-900 border-gray-300"
                  }`}
                />
              </li>
              <li className="flex flex-col md:flex-row md:items-center gap-2">
                <strong className="w-full md:w-1/3 text-gray-700 dark:text-gray-300">{t.gender}:</strong>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleInputChange}
                  className={`flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                    isDarkMode ? "bg-gray-700 text-white border-gray-100" : "bg-gray-50 text-gray-100 border-gray-300"
                  }`}
                >
                  <option value="">{t.selectGender}</option>
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                  <option value="other">{t.other}</option>
                  <option value="prefer_not_to_say">{t.preferNotToSay}</option>
                </select>
              </li>
              <li className="flex flex-col md:flex-row md:items-center gap-2">
                <strong className="w-full md:w-1/3 text-gray-700 dark:text-gray-300">{t.dateOfBirth}:</strong>
                <input
                  type="date"
                  name="date_of_birth"
                  value={editForm.date_of_birth}
                  onChange={handleInputChange}
                  className={`flex-grow px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                    isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-50 text-gray-900 border-gray-300"
                  }`}
                />
              </li>
            </>
          ) : (
            <>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.name}:</strong> {user?.name || "N/A"}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.surname}:</strong> {user?.surname || "N/A"}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.email}:</strong> {user?.email || "N/A"}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.login}:</strong> {user?.login || "N/A"}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.gender}:</strong> {user?.gender ? t[user.gender] || user.gender : "N/A"}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.dateOfBirth}:</strong> {formatDate(user?.date_of_birth || "")}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.userSince}:</strong> {formatDate(user?.created_at || "")}</li>
              <li><strong className="text-gray-700 dark:text-gray-300">{t.lastLogin}:</strong> {formatDate(user?.last_login || "")}</li>
            </>
          )}
        </ul>
      </section>
      {/* Section: Collection Preview */}
      <section className={`max-w-4xl w-full mb-8 p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{t.yourCollection}</h3>
          <button 
            onClick={() => setActiveView("collection")}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white`}
          >
            View All
          </button>
        </div>
        {collectionLoading ? <p>Loading...</p> : collection.length === 0 ? <p>{t.emptyCollection}</p> :
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collection.slice(0, 3).map(item => (
              <div key={item.id} className="border rounded p-3 bg-white shadow">
                {item.image_name && <img src={item.image_name} alt={item.title} className="w-full h-32 object-contain mb-2" />}
                <div className="font-semibold">{item.title}</div>
                <div>#{item.number}</div>
                <div>{t.collection} {item.condition}</div>
                <div className="text-xs text-gray-500">Added: {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : ""}</div>
              </div>
            ))}
          </div>
        }
      </section>
      {/* Section: Wishlist Preview */}
      <section className={`max-w-4xl w-full mb-8 p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{t.yourWishlist}</h3>
          <button 
            onClick={() => setActiveView("wishlist")}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"} text-white`}
          >
            View All
          </button>
        </div>
        {wishlistLoading ? <p>Loading...</p> : wishlist.length === 0 ? <p>{t.noItemsInWishlist}</p> :
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wishlist.slice(0, 3).map(item => (
              <div key={item.id} className="border rounded p-3 bg-white shadow">
                {item.image_name && <img src={item.image_name} alt={item.title} className="w-full h-32 object-contain mb-2" />}
                <div className="font-semibold">{item.title}</div>
                <div>#{item.number}</div>
                <div className="text-xs text-gray-500">Added: {item.added_date ? new Date(item.added_date).toLocaleDateString() : ""}</div>
              </div>
            ))}
          </div>
        }
      </section>
    </>
  );

  const renderCollectionView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-3xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
          {t.yourCollection}
        </h2>
        <button
          onClick={() => setShowCollectionFilters(!showCollectionFilters)}
          className={`px-4 py-2 rounded flex items-center gap-2 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          <FilterIcon className="w-4 h-4" />
          Filters
        </button>
      </div>
      {showCollectionFilters && (
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search Collection</label>
              <input
                type="text"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                placeholder="Search by title, number, or series..."
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
                <option value="all">All Conditions</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={collectionSortBy}
                onChange={(e) => setCollectionSortBy(e.target.value)}
                className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
              >
                <option value="title">Title</option>
                <option value="number">Number</option>
                <option value="condition">Condition</option>
                <option value="purchase_date">Purchase Date</option>
                <option value="purchase_price">Price</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select
                value={collectionSortOrder}
                onChange={(e) => setCollectionSortOrder(e.target.value as "asc" | "desc")}
                className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {collection.length}
            </div>
            <div className="text-sm">{t.TotalItems}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {filteredCollection.length}
            </div>
            <div className="text-sm">{t.FilteredItems}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              ${collection.reduce((sum, item) => sum + (item.purchase_price || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm">{t.TotalValue}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {new Set(collection.map(item => item.series)).size}
            </div>
            <div className="text-sm">Series</div>
          </div>
        </div>
      </div>
      {collectionLoading ? (
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
                {t.StartAddingItems}
              </Link>
            </div>
          ) : (
            <p>No items match your current filters.</p>
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
                {editingCollectionItem === item.id ? (
                  <div className="space-y-3">
                    <input
                      name="title"
                      value={editCollectionForm.title || ""}
                      onChange={handleCollectionInputChange}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <input
                      name="number"
                      value={editCollectionForm.number || ""}
                      onChange={handleCollectionInputChange}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <select
                      name="condition"
                      value={editCollectionForm.condition || ""}
                      onChange={handleCollectionInputChange}
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
                      value={editCollectionForm.purchase_price || ""}
                      onChange={handleCollectionInputChange}
                      placeholder="Purchase Price"
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <textarea
                      name="notes"
                      value={editCollectionForm.notes || ""}
                      onChange={handleCollectionInputChange}
                      placeholder="Notes"
                      rows={2}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCollectionEdit}
                        className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                      >
                        <SaveIcon className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelCollectionEdit}
                        className="flex-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded flex items-center justify-center gap-1"
                      >
                        <CancelIcon className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm mb-1">#{item.number}</p>
                    {item.series && <p className="text-sm mb-1">Series: {item.series}</p>}
                    {item.condition && <p className="text-sm mb-1">Condition: {item.condition}</p>}
                    {item.purchase_price && <p className="text-sm mb-1">Price: ${item.purchase_price}</p>}
                    {item.purchase_date && (
                      <p className="text-sm mb-1">
                        Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                      </p>
                    )}
                    {item.notes && <p className="text-sm mb-3 italic">{item.notes}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCollectionItem(item)}
                        className={`flex-1 px-3 py-1 rounded flex items-center justify-center gap-1 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                      >
                        <EditIcon className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollectionItem(item.id)}
                        className="flex-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center gap-1"
                      >
                        <DeleteIcon className="w-4 h-4" />
                        Remove
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
  );

  const renderWishlistView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-3xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
          {t.yourWishlist}
        </h2>
        <button
          onClick={() => setShowWishlistFilters(!showWishlistFilters)}
          className={`px-4 py-2 rounded flex items-center gap-2 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          <FilterIcon className="w-4 h-4" />
          Filters
        </button>
      </div>
      {showWishlistFilters && (
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
                value={wishlistSortBy}
                onChange={(e) => setWishlistSortBy(e.target.value)}
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
                value={wishlistSortOrder}
                onChange={(e) => setWishlistSortOrder(e.target.value as "asc" | "desc")}
                className={`w-full px-3 py-2 rounded ${isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"}`}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
      <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {wishlist.length}
            </div>
            <div className="text-sm">{t.TotalItems}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {wishlist.filter(item => item.priority === "high").length}
            </div>
            <div className="text-sm">{t.HighPriority}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              ${wishlist.reduce((sum, item) => sum + (item.max_price || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm">{t.TotalBudget}</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
              {new Set(wishlist.map(item => item.series)).size}
            </div>
            <div className="text-sm">{t.Series}</div>
          </div>
        </div>
      </div>
      {wishlistLoading ? (
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
                {t.StartAddingItems}
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
                {editingWishlistItem === item.id ? (
                  <div className="space-y-3">
                    <input
                      name="title"
                      value={editWishlistForm.title || ""}
                      onChange={handleWishlistInputChange}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <input
                      name="number"
                      value={editWishlistForm.number || ""}
                      onChange={handleWishlistInputChange}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <select
                      name="priority"
                      value={editWishlistForm.priority || ""}
                      onChange={handleWishlistInputChange}
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
                      value={editWishlistForm.max_price || ""}
                      onChange={handleWishlistInputChange}
                      placeholder="Max Price"
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <select
                      name="target_condition"
                      value={editWishlistForm.target_condition || ""}
                      onChange={handleWishlistInputChange}
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
                      value={editWishlistForm.notes || ""}
                      onChange={handleWishlistInputChange}
                      placeholder="Notes"
                      rows={2}
                      className={`w-full px-2 py-1 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveWishlistEdit}
                        className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-1"
                      >
                        <SaveIcon className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelWishlistEdit}
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
                          onClick={() => handleEditWishlistItem(item)}
                          className={`flex-1 px-3 py-1 rounded flex items-center justify-center gap-1 ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWishlistItem(item.id)}
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
  );

  return (
    <div className={`welcome-site min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"}`}>
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
        {/* Language, Theme, and Logout */}
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
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>
        <div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              isDarkMode ? "bg-red-600 hover:bg-red-800 " : "bg-red-500 hover:bg-red-800"
            } text-white shadow-md`}
          >
            {t.logout}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`px-8 py-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => setActiveView("dashboard")} 
            className={`px-3 py-1 rounded ${activeView === "dashboard" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}
          >
            {t.dashboard}
          </button>
          <button 
            onClick={() => setActiveView("collection")} 
            className={`px-3 py-1 rounded ${activeView === "collection" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}
          >
            {t.collection}
          </button>
          <button 
            onClick={() => setActiveView("wishlist")} 
            className={`px-3 py-1 rounded ${activeView === "wishlist" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}
          >
            {t.wishlist}
          </button>
          {/* Analytics Tab */}
          <button 
            onClick={() => setActiveView("analytics")} 
            className={`px-3 py-1 rounded flex items-center gap-2 ${activeView === "analytics" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}
          >
            <ChartIcon className="w-4 h-4" />
            {t.analytics || "Analytics"}
          </button>
          {/* Social Tab */}
          <button 
            onClick={() => setActiveView("social")} 
            className={`px-3 py-1 rounded flex items-center gap-2 ${activeView === "social" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}
          >
            <UsersIcon className="w-4 h-4" />
            {t.social || "Social"}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-8 py-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {renderDashboardView()}
            </motion.div>
          )}
          {activeView === "collection" && (
            <motion.div
              key="collection"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-7xl"
            >
              {renderCollectionView()}
            </motion.div>
          )}
          {activeView === "wishlist" && (
            <motion.div
              key="wishlist"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-7xl"
            >
              {renderWishlistView()}
            </motion.div>
          )}
          {/* Analytics View */}
          {activeView === "analytics" && (
            <motion.div
              key="analytics"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-7xl"
            >
              {renderAnalyticsView()}
            </motion.div>
          )}
          {/* Social View */}
          {activeView === "social" && (
            <motion.div
              key="social"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full max-w-7xl"
            >
              {renderSocialView()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`text-center py-4 ${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"}`}>
        {t.copyright}
      </footer>
    </div>
  );
};

export default DashboardSite;