import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationAdmin";
import useBreakpoints from "./useBreakpoints";
import ItemList from "./ItemList.tsx";
import { motion, AnimatePresence } from "framer-motion";
import ChatComponent from './ChatComponent';
import FriendProfileModal from './FriendProfileModal';
import LoyaltyDashboard from './LoyaltyDashboard';

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
import HeartIcon from "./assets/heart.svg?react";
import ShoppingCartIcon from "./assets/shopping-cart.svg?react";
import FilterIcon from "./assets/filter.svg?react";
import StarIcon from "./assets/star.svg?react";
import PlusIcon from "./assets/plus.svg?react";
import AdminInvites from "./AdminInvites";

// Flag SVGs
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import CanadaFlag from "/src/assets/flags/canada.svg?react";

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
  is_active?: boolean;
  nationality?: string;
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

interface RequestItem {
  id: number;
  title: string;
  number: string | null;
  reason: string;
  created_at: string;
  user_login: string;
  user_email?: string;
}

// 🌍 Centralized country configuration
const countries = {
  USA: {
    name: "United States",
    flag: <USAFlag className="w-5 h-5" />,
    region: "North America",
    language: "EN",
  },
  CA : {
    name: "Canada",
    flag: <CanadaFlag className="w-5 h-5" />,
    region: "North America",
    language : "EN",
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
  US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
  EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
  CA: { name: "Canada", flag: <CanadaFlag className="w-5 h-5" /> },
  PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
  RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
  FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
  DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
  ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
};

// Requests Component
const Requests = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "user">("newest");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const token = localStorage.getItem("token");

  // Detect dark mode from localStorage
  const isDarkMode = localStorage.getItem("preferredTheme") === "dark";

  // Load language (default to EN if not set)
  const language = localStorage.getItem("preferredLanguage") || "EN";
  const t = translations[language] || translations["EN"];

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        alert("Authentication required");
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/admin/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
          setFilteredRequests(data);
        } else {
          alert(t.failedToLoadRequests || "Failed to load requests");
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
        alert(t.failedToLoadRequests || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token, t.failedToLoadRequests]);

  // Filter and sort requests
  useEffect(() => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(query) ||
          req.number?.toLowerCase().includes(query) ||
          req.reason.toLowerCase().includes(query) ||
          req.user_login.toLowerCase().includes(query)
      );
    }

    // User filter
    if (selectedUser !== "all") {
      filtered = filtered.filter((req) => req.user_login === selectedUser);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "user") {
        return a.user_login.localeCompare(b.user_login);
      }
      return 0;
    });

    setFilteredRequests(filtered);
  }, [requests, searchQuery, sortBy, selectedUser]);

  const resolveRequest = async (id: number) => {
    if (!token) return;
    
    if (!confirm(t.confirmResolve)) return;
    
    setProcessingId(id);
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setRequests(requests.filter((r) => r.id !== id));
        setFilteredRequests(filteredRequests.filter((r) => r.id !== id));
        alert(t.requestResolved);
      } else {
        const errorText = await res.text();
        alert(`${t.failedToResolveRequest}: ${errorText}`);
      }
    } catch (err) {
      console.error("Error resolving request:", err);
      alert(t.errorResolvingRequest || "Error resolving request");
    } finally {
      setProcessingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setSelectedUser("all");
  };

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(new Set(requests.map((r) => r.user_login)));

  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800 border border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-3xl font-bold mb-2 ${
            isDarkMode ? "text-yellow-400" : "text-blue-600"
          }`}
        >
          {t.pendingItemRequests || "Pending Item Requests"}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {t.totalRequests}:
          </span>
          <span className="text-lg font-bold">{requests.length}</span>
        </div>
      </div>

      {/* Filters and Search */}
      {requests.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchRequests}
              className={`w-full px-4 py-2 pr-10 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                  : "bg-gray-50 text-gray-800 placeholder-gray-500 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <svg
              className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Sort By */}
            <div className="flex-1 min-w-[200px]">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-50 text-gray-800 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="newest">{t.newest}</option>
                <option value="oldest">{t.oldest}</option>
                <option value="user">User A-Z</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="flex-1 min-w-[200px]">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t.filterByUser}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-50 text-gray-800 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">{t.allUsers}</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedUser !== "all" || sortBy !== "newest") && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {t.clearFilters}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {searchQuery || selectedUser !== "all"
              ? t.noResultsFound
              : t.noPendingRequests}
          </p>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`p-5 rounded-lg border transition-all hover:shadow-md ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Request Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {req.title}
                    {req.number && (
                      <span
                        className={`ml-2 text-sm font-normal ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        #{req.number}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        isDarkMode
                          ? "bg-blue-900 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {req.user_login}
                    </span>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {new Date(req.created_at).toLocaleDateString()} •{" "}
                      {new Date(req.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Request Reason */}
              <div
                className={`mb-4 p-3 rounded ${
                  isDarkMode ? "bg-gray-600" : "bg-white"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t.reason}:
                </p>
                <p className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {req.reason}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => resolveRequest(req.id)}
                  disabled={processingId === req.id}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    processingId === req.id
                      ? "opacity-50 cursor-not-allowed bg-gray-400"
                      : isDarkMode
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {processingId === req.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {t.markAsAdded || "Mark as Added"}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  // Constants
  const SUPER_ADMIN_ID = 1;
  const SUPER_ADMIN_USERNAME = "admin";

  // Hooks
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useBreakpoints();

  // State
  const [activeView, setActiveView] = useState<"users" | "items" | "analytics" | "social" | "requests" | "invites">("users");
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

  // Account Details state
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);

  // Social state
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriendForProfile, setSelectedFriendForProfile] = useState<any>(null);  
  const handleViewFriendProfile = (friend: any) => {
    // Use friend.user_id or friend.friend_user_id instead of friend.id
    setSelectedFriendForProfile({
      ...friend,
      userId: friend.user_id || friend.friend_user_id // adjust based on your API structure
    });
    setShowFriendProfile(true);
  };

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
  const [isTyping, setIsTyping] = useState(false);

  // Request state
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    login: "",
    name: "",
    surname: "",
    password: "",
    gender: "male",
    date_of_birth: "",
    role: "user" as "user" | "admin"
  });

  // 🔹 Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // 🔹 Dashboard Analytics State
  const [userStats, setUserStats] = useState<any>(null);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dashboardAnalyticsLoading, setDashboardAnalyticsLoading] = useState(false);

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

  // Refs
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derived values
  const t = translations[language] || translations["EN"];
  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const token: string | null = localStorage.getItem("token");

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

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

  // Helper function for date formatting
  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // Handle viewing account details
  const handleViewAccountDetails = (user: User) => {
    setSelectedUserDetails(user);
    setShowAccountDetails(true);
  };

  // 🔹 Log activity function
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

  // 🔹 Social state
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  // 🔹 Fetch user analytics
  const fetchUserAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setDashboardAnalyticsLoading(true);
    try {
      const [statsRes, loyaltyRes, friendsRes, leaderboardRes] = await Promise.all([
        fetch("http://localhost:5000/api/activity/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/loyalty/calculate", { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/friends", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/loyalty/leaderboard", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (statsRes.ok) setUserStats(await statsRes.json());
      if (loyaltyRes.ok) setLoyaltyData(await loyaltyRes.json());
      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
    } catch (err) {
      console.error("Failed to fetch user analytics:", err);
    } finally {
      setDashboardAnalyticsLoading(false);
    }
  };

  // 🔹 Social functions
const fetchIncomingRequests = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch("http://localhost:5000/api/friends/requests/incoming", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setIncomingRequests(data);
    }
  } catch (err) {
    console.error("Error fetching incoming requests:", err);
  }
};

const fetchOutgoingRequests = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch("http://localhost:5000/api/friends/requests/outgoing", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setOutgoingRequests(data);
    }
  } catch (err) {
    console.error("Error fetching outgoing requests:", err);
  }
};

const handleAcceptRequest = async (senderId: string, friendshipId: string) => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch(`http://localhost:5000/api/friends/accept/${senderId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      alert("Friend request accepted!");
      fetchIncomingRequests();
      fetchUserAnalytics(); // refresh friends list
    }
  } catch (err) {
    console.error("Error accepting request:", err);
  }
};

const handleRejectRequest = async (friendshipId: string) => {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch(`http://localhost:5000/api/friends/request/${friendshipId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      alert("Friend request removed");
      fetchIncomingRequests();
      fetchOutgoingRequests();
    }
  } catch (err) {
    console.error("Error rejecting request:", err);
  }
};

const handleRemoveFriend = async (friendId: string) => {
  if (!confirm("Are you sure you want to remove this friend?")) return;
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch(`http://localhost:5000/api/friends/${friendId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      alert("Friend removed");
      fetchUserAnalytics();
    }
  } catch (err) {
    console.error("Error removing friend:", err);
  }
};


  // Chat states
  const handleStartChat = async (friend: any) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${friend.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedFriend({ 
          ...friend, 
          conversation_id: data.conversation_id,
          nationality: friend.nationality || data.friend_nationality 
        });
        setShowChat(true);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // 🔹 Loyalty Dashboard state
  const [showLoyaltyDashboard, setShowLoyaltyDashboard] = useState(false);

    const awardPoints = async (actionType: string, details?: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      await fetch("http://localhost:5000/api/loyalty/award-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ actionType, details })
      });
    } catch (err) {
      console.error("Failed to award points:", err);
    }
  };


  // 🔹 Fetch admin analytics data
  const fetchAdminAnalytics = async () => {
    if (!token) return;
    
    setAnalyticsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

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

  // Effects
  useEffect(() => {
    if (!token || !currentUser || currentUser.role !== "admin") {
      const timer = setTimeout(() => {
        navigate("/", { replace: true }); // ✅ Przekierowanie do WelcomeSite
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [currentUser, token, navigate]);

useEffect(() => {
  const savedLang = localStorage.getItem("preferredLanguage");
  const savedCountry = localStorage.getItem("preferredCountry");

  // Jeśli użytkownik ma zapisany język → użyj go
  if (savedLang) {
    setLanguage(savedLang);
  }

  // Jeśli ma zapisany kraj → ustaw region i kraj
  const countryData = savedCountry && countries[savedCountry as keyof typeof countries]
    ? countries[savedCountry as keyof typeof countries]
    : null;

  if (countryData && savedCountry) {
    setSelectedCountry(savedCountry);
    if (!savedLang) setLanguage(countryData.language); // tylko jeśli język nie był ustawiony wcześniej
    setRegion(countryData.region);
  } else {
    // Automatyczne wykrycie z przeglądarki
    const detected = detectCountryFromLocale(navigator.language);
    const detectedData = detected ? countries[detected as keyof typeof countries] : null;
    if (detectedData && detected) {
      setSelectedCountry(detected);
      if (!savedLang) setLanguage(detectedData.language);
      setRegion(detectedData.region);
    }
  }

  // Reszta logiki (popup, mapa, motyw)
  const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
  if (!hasSeenPopup) {
    setShouldShowPopup(true);
    localStorage.setItem("hasSeenLanguagePopup", "true");
  }

  if (isDarkMode) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");

  const hasSeenMap = localStorage.getItem("hasSeenWorldMap");
  if (!hasSeenMap) {
    setShowWorldMapFirstTime(true);
    localStorage.setItem("hasSeenWorldMap", "true");
  }
}, [isDarkMode]);


  // Fetch pending requests count
  useEffect(() => {
    if (!token || currentUser?.role !== "admin") return;
    const fetchCount = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/requests/count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPendingRequestsCount(data.count || 0);
        }
      } catch (err) {
        console.warn("Failed to fetch request count");
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // every 30s
    return () => clearInterval(interval);
  }, [token, currentUser?.role]);

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
        languageDropdownRef.current &&
        buttonRef.current &&
        !languageDropdownRef.current.contains(e.target as Node) &&
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
            navigate("/loginregistersite");
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
        console.error(t.failedToLoadStatictics || "Failed to load site statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchSiteStats();
  }, [token, currentUser?.role]);

  // 🔹 Fetch analytics only when panel is opened
  useEffect(() => {
    if (showAnalytics) {
      fetchAdminAnalytics();
    }
  }, [showAnalytics]);

  // 🔹 Fetch dashboard analytics when active view changes
  useEffect(() => {
    if (activeView === "analytics") {
      fetchUserAnalytics();
    }
  }, [activeView]);

  // Update the useEffect that loads social data
  useEffect(() => {
    if (activeView === "social") {
      fetchIncomingRequests();
      fetchOutgoingRequests();
      fetchUserAnalytics(); // also load friends
    }
  }, [activeView]);

  // Optimized search - only search when user has stopped typing and entered at least 2 characters
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchTerm.trim().length === 0) {
      setFilteredItems([]);
      setIsTyping(false);
      return;
    }
    if (searchTerm.trim().length < 2) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchItems();
      setIsTyping(false);
    }, 700);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Helper functions
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

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("preferredTheme", newMode ? "dark" : "light");
  };

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

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/loginregistersite");
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
      setSearchTerm("");
      setFilteredItems([]);
    } catch (err: any) {
      console.error('Add item error:', err);
      alert(`Failed to add item: ${err.message}`);
    }
  };

  const handleAddUser = async () => {
    const { email, login, name, surname, password, gender, date_of_birth, role } = newUser;
    if (!email || !login || !name || !surname || !password || !date_of_birth) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const createdUser = await response.json();
        alert(`User created: ${createdUser.login}`);
        setShowAddUserModal(false);
        setNewUser({
          email: "",
          login: "",
          name: "",
          surname: "",
          password: "",
          gender: "male",
          date_of_birth: "",
          role: "user"
        });
        // Refresh user list
        const usersRes = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Add user error:", err);
      alert("Network error");
    }
  };

  const handleSearchItems = async () => {
    if (searchTerm.trim().length < 2 || !token) return;
    setSearchLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/items/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });
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

  const generateFunkoId = (title: string, number: string): string => {
    return `${title}-${number}`
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleItemNavigation = (item: Item) => {
    let funkoId = String(item.id);
    const isCorrectFormat = /^[a-z0-9]+-\d+.*$/.test(funkoId.toLowerCase());
    if (!isCorrectFormat && item.title && item.number) {
      funkoId = generateFunkoId(item.title, item.number);
    }
    navigate(`/item/${encodeURIComponent(funkoId)}`);
  };

  // 🔹 Render Analytics View
  const renderAnalyticsView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
        {t.yourStats || "Your Statistics"}
      </h2>
      {dashboardAnalyticsLoading ? (
        <div className="text-center py-8">Loading your stats...</div>
      ) : (
        <div className="space-y-6">
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
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
          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
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
          {userStats?.breakdown && userStats.breakdown.length > 0 && (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
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
          {leaderboard.length > 0 && (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
              <h3 className="text-xl font-semibold mb-4">{t.leaderboard || "Leaderboard"}</h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry: any, idx: number) => {
                  const isCurrentUser = entry.login === currentUser?.login;
                  return (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-2 rounded ${
                        isCurrentUser ? (isDarkMode ? "bg-yellow-900" : "bg-blue-50") : ""
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
        </div>
      )}
    </div>
  );

  // 🔹 Render Social View
  const renderSocialView = () => (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
        {t.social || "Social"}
      </h2>
      {/* Add Friend Form */}
      <div className={`p-6 rounded-lg shadow-lg mb-6 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
        <h3 className="text-xl font-semibold mb-4">{t.addFriend || "Add Friend"}</h3>
        <div className="flex gap-2">
          <input
            id="friendLoginInput"
            type="text"
            placeholder="Enter username..."
            className={`flex-1 px-4 py-2 rounded border border-gray-300 ${isDarkMode ? "bg-gray-600" : "bg-gray-50"}`}
          />
          <button
            onClick={async () => {
              const input = document.getElementById("friendLoginInput") as HTMLInputElement;
              const friendLogin = input.value.trim();
              if (!friendLogin) {
                alert("Please enter a username");
                return;
              }
              const token = localStorage.getItem("token");
              if (!token) return;
              try {
                const response = await fetch("http://localhost:5000/api/friends/request", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${token}` 
                  },
                  body: JSON.stringify({ friendLogin })
                });
                if (response.ok) {
                  alert("Friend request sent!");
                  await awardPoints("friend_add", `Sent friend request to ${friendLogin}`); // ✅ DODANE
                  input.value = "";
                  fetchOutgoingRequests();
                } else {
                  const error = await response.json();
                  alert(error.error || "Failed to send friend request");
                }
              } catch (err) {
                console.error("Error sending friend request:", err);
                alert("Failed to send friend request");
              }
            }}
            className={`px-6 py-2 rounded ${
              isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            {t.sendRequest || "Send Request"}
          </button>
        </div>
      </div>

      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div className={`p-6 rounded-lg shadow-lg mb-6 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">
            {t.incomingRequests || "Friend Requests"} ({incomingRequests.length})
          </h3>
          <div className="space-y-3">
            {incomingRequests.map((request: any) => (
              <div 
                key={request.id}
                className={`flex justify-between items-center p-4 rounded border ${
                  isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-semibold">{request.login}</h4>
                  <p className="text-sm text-gray-500">
                    {request.name} {request.surname}
                  </p>
                  <p className="text-xs text-gray-400">
                    Collection: {request.collection_size} items
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.sender_id, request.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {t.accept || "Accept"}
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    {t.reject || "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div className={`p-6 rounded-lg shadow-lg mb-6 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">
            {t.sentRequests || "Sent Requests"} ({outgoingRequests.length})
          </h3>
          <div className="space-y-3">
            {outgoingRequests.map((request: any) => (
              <div 
                key={request.id}
                className={`flex justify-between items-center p-4 rounded border ${
                  isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div>
                  <h4 className="font-semibold">{request.login}</h4>
                  <p className="text-sm text-gray-500">
                    {request.name} {request.surname}
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                  {t.cancel || "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
        <h3 className="text-xl font-semibold mb-4">
          {t.yourFriends || "Your Friends"} ({friends.filter((f: any) => f.status === "accepted").length})
        </h3>
        {friends.filter((f: any) => f.status === "accepted").length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {t.noFriends || "You don't have any friends yet. Start connecting!"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.filter((f: any) => f.status === "accepted").map((friend: any) => (
              <div 
                key={friend.id}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? "border-gray-600" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{friend.login}</h4>
                    <p className="text-sm text-gray-500">
                      {friend.name} {friend.surname}
                    </p>
                  </div>
                </div>
                <p className="text-sm mb-3">
                  {t.collectionSize || "Collection"}: {friend.collection_size} items
                </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewFriendProfile(friend)}
                      className={`flex-1 px-3 py-2 rounded ${
                        isDarkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
                      } text-white text-sm`}
                    >
                      {t.viewProfile || "View Profile"}
                    </button>
                    <button
                      onClick={() => handleStartChat(friend)}
                      className={`flex-1 px-3 py-2 rounded ${
                        isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                      } text-white text-sm`}
                    >
                      {t.chat || "Chat"}
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    >
                      {t.remove || "Remove"}
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChat && selectedFriend && (
        <ChatComponent 
          isDarkMode={isDarkMode}
          user={currentUser}
          friend={selectedFriend}
          onClose={() => setShowChat(false)}
        />
      )}
      {/* Friend Profile Modal */}
      {showFriendProfile && selectedFriendForProfile && (
        <FriendProfileModal
          friendId={selectedFriendForProfile.id}
          isDarkMode={isDarkMode}
          onClose={() => {
            setShowFriendProfile(false);
            setSelectedFriendForProfile(null);
          }}
          t={t}
        />
      )}
    </div>
  );

  // 🔹 Render Account Details Modal
  const renderAccountDetailsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowAccountDetails(false)}>
      <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white border border-gray-200"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{t.accountDetails || "Account Details"}</h3>
          <button
            onClick={() => setShowAccountDetails(false)}
            className={`p-1 rounded-full ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            ✕
          </button>
        </div>
        
        {selectedUserDetails && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <h4 className="font-semibold mb-3 text-lg">{t.personalInformation || "Personal Information"}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.name || "Name"}:</strong> 
                  <span>{selectedUserDetails.name || "N/A"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.surname || "Surname"}:</strong> 
                  <span>{selectedUserDetails.surname || "N/A"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.email || "Email"}:</strong> 
                  <span>{selectedUserDetails.email || "N/A"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.login || "Username"}:</strong> 
                  <span>{selectedUserDetails.login || "N/A"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.gender || "Gender"}:</strong> 
                  <span>{selectedUserDetails.gender ? (t[selectedUserDetails.gender] || selectedUserDetails.gender) : "N/A"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.dateOfBirth || "Date of Birth"}:</strong> 
                  <span>{formatDate(selectedUserDetails.date_of_birth)}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.nationality || "Nationality"}:</strong> 
                  <span>{selectedUserDetails.nationality || "N/A"}</span>
                </li>
              </ul>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <h4 className="font-semibold mb-3 text-lg">{t.accountInformation || "Account Information"}</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.userId || "User ID"}:</strong> 
                  <span>{selectedUserDetails.id}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.role || "Role"}:</strong> 
                  <span className={`capitalize ${selectedUserDetails.role === 'admin' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {selectedUserDetails.role}
                    {isSuperAdmin(selectedUserDetails) && " ★"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.userSince || "User Since"}:</strong> 
                  <span>{formatDate(selectedUserDetails.created_at)}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.lastLogin || "Last Login"}:</strong> 
                  <span>{selectedUserDetails.last_login ? formatDate(selectedUserDetails.last_login) : t.never || "Never"}</span>
                </li>
                <li className="flex justify-between">
                  <strong className="text-gray-700 dark:text-gray-300">{t.status || "Status"}:</strong> 
                  <span className={selectedUserDetails.is_active ? "text-green-600" : "text-red-600"}>
                    {selectedUserDetails.is_active ? (t.online || "Online") : (t.offline || "Offline")}
                  </span>
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-300 dark:border-gray-600">
              {selectedUserDetails.role !== "admin" && (
                <button
                  onClick={() => {
                    handleMakeAdmin(selectedUserDetails.id, selectedUserDetails.login);
                    setShowAccountDetails(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded ${
                    isDarkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
                  } text-black font-medium transition`}
                >
                  {t.makeAdmin || "Make Admin"}
                </button>
              )}
              {canDeleteUser(selectedUserDetails) && (
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUserDetails.id, selectedUserDetails.login);
                    setShowAccountDetails(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded ${
                    isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                  } text-white font-medium transition`}
                >
                  {t.deleteUser || "Delete User"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 🔹 Render Add User Modal
  const renderAddUserModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowAddUserModal(false)}>
      <div className="w-full max-w-md p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">{t.addUser || "Add New User"}</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="First Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="p-2 border border-gray-300 rounded dark:bg-gray-700"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUser.surname}
              onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
              className="p-2 border border-gray-300 rounded dark:bg-gray-700"
              required
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="w-full p-2 mb-3 border border-gray-300 rounded dark:bg-gray-700"
            required
          />
          <input
            type="text"
            placeholder="Username (login)"
            value={newUser.login}
            onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
            className="w-full p-2 mb-3 border border-gray-300 rounded dark:bg-gray-700"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="w-full p-2 mb-3 border border-gray-300 rounded dark:bg-gray-700"
            required
          />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={newUser.gender}
              onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as any })}
              className="p-2 border border-gray-300 rounded dark:bg-gray-700"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            <input
              type="date"
              value={newUser.date_of_birth}
              onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
              className="p-2 border border-gray-300 rounded dark:bg-gray-700"
              required
            />
          </div>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
            className="w-full p-2 mb-4 border border-gray-300 rounded dark:bg-gray-700"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded border border-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Early return if not authorized
  if (!token || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-800 text-center px-4">
        <p className="text-red-600 text-3xl font-semibold mb-4">
          {t.accessRestricted || "You have no access here."}
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t.redirectingIn || "Redirecting to main site in 2 seconds..."}
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

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-gray-800"}`}>
      {/* 🔝 Header */}
<header className={`py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4 ${isDarkMode ? "bg-gray-800" : "bg-blue-100"}`}>
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

        {/* 🔍 Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchTerm.trim()) {
              navigate(`/searchsite?q=${encodeURIComponent(searchTerm.trim())}`);
            }
          }}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden border border-gray-300 ${
            isDarkMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <input
            type="text"
            placeholder={t.searchPlaceholder || "Search for Funko Pops..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-grow px-4 py-2 outline-none ${
              isDarkMode
                ? "bg-gray-700 text-white placeholder-gray-400"
                : "bg-white text-gray-800 placeholder-gray-500"
            }`}
            aria-label="Search for Funko Pops"
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

        {/* 🌐 Language, 🌙 Theme, 🔐 Dashboard */}
        <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`p-2 rounded-full flex items-center gap-1 min-w-0 border border-gray-300 ${
                isDarkMode
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-white hover:bg-gray-100"
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

          {/* 🌙 Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full border border-gray-300 ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
            }`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          {/* 🔐 Dashboard/Login */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded border border-red-600 ${
              isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
            } text-white shadow-md`}
          >
            {t.logout}
          </button>
        </div>
      </header>

      {/* 🔹 Updated Navigation */}
      <nav className={`px-8 py-2 ${isDarkMode ? "bg-gray-700" : "bg-white border-b border-gray-200"}`}>
        <div className="flex gap-4 flex-wrap">
          <button onClick={() => setActiveView("users")} className={`px-3 py-1 rounded border ${
            activeView === "users" 
              ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
              : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
          }`}>
            {t.listOfUsers || "Users"}
          </button>
          <button onClick={() => setActiveView("items")} className={`px-3 py-1 rounded border ${
            activeView === "items" 
              ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
              : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
          }`}>
            {t.listOfItems || "Items"}
          </button>
          {/* 🔹 NEW TABS */}
          <button onClick={() => setActiveView("analytics")} className={`px-3 py-1 rounded border flex items-center gap-2 ${
            activeView === "analytics" 
              ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
              : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
          }`}>
            <ChartIcon className="w-4 h-4" /> {t.analytics || "Analytics"}
          </button>
          <button onClick={() => setActiveView("social")} className={`px-3 py-1 rounded border flex items-center gap-2 ${
            activeView === "social" 
              ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
              : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
          }`}>
            <UsersIcon className="w-4 h-4" /> {t.social || "Social"}
          </button>

          <button onClick={() => setActiveView("invites")} className={`px-3 py-1 rounded border flex items-center gap-2 ${
            activeView === "invites" 
              ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
              : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
          }`}>
            <StarIcon className="w-4 h-4" /> {t.invites || "Invites"}
          </button>

          <button 
            onClick={() => setActiveView("requests")} 
            className={`px-3 py-1 rounded border flex items-center gap-2 ${
              activeView === "requests" 
                ? (isDarkMode ? "bg-yellow-500 text-black border-yellow-500" : "bg-blue-600 text-white border-blue-600") 
                : (isDarkMode ? "hover:bg-gray-600 border-gray-600" : "hover:bg-gray-100 border-gray-300")
            }`}
          >
            📥 {t.requests || "Requests"}
          </button>

        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-8 py-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeView === "users" && (
            <motion.div key="users" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: "easeInOut" }} className="w-full max-w-7xl">
              {/* 📍 Current language & region */}
              <div className={`mb-6 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <p className="text-sm">
                  {languageNames[language]} • {region}
                </p>
              </div>

              {/* 🔹 Advanced Analytics Section */}
              {showAnalytics && (
                <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                      <ChartIcon className="w-6 h-6" />
                      {t.advancedAnalytics || "Advanced Analytics"}
                    </h3>
                    <button
                      onClick={() => setShowAnalytics(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div className="text-center py-8">
                      <p>{t.loadingAnalytics || "Loading analytics..."}</p>
                    </div>
                  ) : adminAnalytics ? (
                    <div className="space-y-6">
                      {/* User Engagement Metrics */}
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-blue-50 border border-blue-100"}`}>
                        <h4 className="font-semibold text-lg mb-4">
                          {t.userEngagement || "User Engagement (Last 30 Days)"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold">{adminAnalytics.engagement?.active_users || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session (min)</p>
                            <p className="text-2xl font-bold">
                              {Math.round((adminAnalytics.engagement?.avg_session || 0) / 60)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Actions</p>
                            <p className="text-2xl font-bold">{adminAnalytics.engagement?.total_actions || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Top Actions */}
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-green-50 border border-green-100"}`}>
                        <h4 className="font-semibold text-lg mb-4">
                          {t.topActions || "Top User Actions"}
                        </h4>
                        <div className="space-y-2">
                          {adminAnalytics.topActions?.slice(0, 5).map((action: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="capitalize">{action.action_type.replace('_', ' ')}</span>
                              <span className="font-bold">{action.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Retention Rate */}
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-purple-50 border border-purple-100"}`}>
                        <h4 className="font-semibold text-lg mb-4">
                          {t.retentionRate || "User Retention (7-Day)"}
                        </h4>
                        <div className="text-center">
                          <p className="text-4xl font-bold text-purple-600">
                            {adminAnalytics.retention?.retention_rate || 0}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {adminAnalytics.retention?.returned_users || 0} of {adminAnalytics.retention?.total_users || 0} users returned
                          </p>
                        </div>
                      </div>

                      {/* Social Engagement */}
                      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-orange-50 border border-orange-100"}`}>
                        <h4 className="font-semibold text-lg mb-4">
                          {t.socialEngagement || "Social Engagement"}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Friendships</p>
                            <p className="text-2xl font-bold">{adminAnalytics.social?.total_friendships || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                            <p className="text-2xl font-bold">{adminAnalytics.social?.total_comments || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Public Collections</p>
                            <p className="text-2xl font-bold">{adminAnalytics.social?.public_collections || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Refresh Button */}
                      <div className="text-center">
                        <button
                          onClick={fetchAdminAnalytics}
                          className={`px-6 py-3 rounded-lg border ${
                            isDarkMode ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-500" : "bg-blue-600 hover:bg-blue-700 border-blue-600"
                          } text-white font-medium`}
                        >
                          {t.refreshAnalytics || "Refresh Analytics"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t.noAnalyticsData || "No analytics data available"}
                    </div>
                  )}
                </section>
              )}

              {/* Site Statistics Section */}
              <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
                <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                  <ChartIcon className="w-6 h-6" />
                  {t.siteStatistics || "Site Statistics"}
                </h3>
                {statsLoading ? (
                  <p className="text-center text-lg">{t.loadingStatistics || "Loading statistics..."}</p>
                ) : siteStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Users */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-blue-50 border-blue-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                        <UsersIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.totalUsers || "Total Users"}</h4>
                      <p className="text-2xl font-bold">{siteStats.totalUsers}</p>
                    </div>
                    {/* Total Items */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-green-50 border-green-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                        <EyeIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.totalItems || "Total Items"}</h4>
                      <p className="text-2xl font-bold">{siteStats.totalItems}</p>
                    </div>
                    {/* New Users (Last 7 Days) */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-purple-50 border-purple-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                        <CalendarIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.newUsers || "New Users (7 Days)"}</h4>
                      <p className="text-2xl font-bold">{siteStats.newUsersLast7Days}</p>
                    </div>
                    {/* Active Users (Last 24h) */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-orange-50 border-orange-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-2">
                        <EyeIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.activeUsers24h || "Active Users (24h)"}</h4>
                      <p className="text-2xl font-bold">{siteStats.activeUsersLast24Hours}</p>
                    </div>
                    {/* Total Visits */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-red-50 border-red-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
                        <EyeIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.totalVisits || "Total Visits"}</h4>
                      <p className="text-2xl font-bold">{siteStats.totalVisits}</p>
                    </div>
                    {/* Average Users Per Day */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-indigo-50 border-indigo-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
                        <ChartIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.avgUsersPerDay || "Avg. Users/Day"}</h4>
                      <p className="text-2xl font-bold">{siteStats.averageUsersPerDay}</p>
                    </div>
                    {/* Most Active User */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-pink-50 border-pink-100"}`}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mb-2">
                        <UsersIcon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-lg mb-1">{t.mostActiveUser || "Most Active User"}</h4>
                      <p className="text-xl font-bold truncate max-w-full">{siteStats.mostActiveUser || "N/A"}</p>
                    </div>
                    {/* Items Added (Last 30 Days) */}
                    <div className={`p-4 rounded-lg flex flex-col items-center border ${isDarkMode ? "bg-gray-600 border-gray-500" : "bg-teal-50 border-teal-100"}`}>
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

              {/* Users Section */}
              <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"} mb-8`}>
                <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t.listOfUsers}</h3>
                {loading ? (
                  <p className="text-lg">{t.loading}</p>
                ) : error ? (
                  <p className="text-red-500 text-lg">{error}</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className={`min-w-full border-collapse text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"} border border-gray-200`}>
                      <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"} text-left border-b border-gray-300`}>
                        <tr>
                          <th className="w-16 px-2 sm:px-3 py-2 text-center font-semibold border-r border-gray-300">ID</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Login</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold hidden md:table-cell border-r border-gray-300">Email</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold border-r border-gray-300">Role</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell border-r border-gray-300">Date of Registration</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell border-r border-gray-300">Last Activity</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold border-r border-gray-300">Status</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold border-r border-gray-300">Actions</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold border-r border-gray-300">Delete</th>
                          <th className="px-2 sm:px-3 py-2 text-center font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className={`transition-colors border-b border-gray-200 ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-50 odd:bg-white hover:bg-gray-100"}`}>
                            <td className="w-16 px-2 sm:px-3 py-2 text-center border-r border-gray-300">
                              {user.id}
                              {isSuperAdmin(user) && (
                                <span className="block text-xs text-purple-600">★</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 truncate max-w-[100px] border-r border-gray-300" title={user.login}>{user.login}</td>
                            <td className="px-2 sm:px-3 py-2 truncate hidden md:table-cell border-r border-gray-300" title={user.email}>{user.email}</td>
                            <td className="px-2 sm:px-3 py-2 capitalize text-center border-r border-gray-300">
                              {user.role}
                              {isSuperAdmin(user) && (
                                <span className="block text-xs text-purple-600">super</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center hidden lg:table-cell border-r border-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="px-2 sm:px-3 py-2 text-center text-xs hidden lg:table-cell border-r border-gray-300">
                              {user.last_login ? new Date(user.last_login).toLocaleString() : t.never}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center border-r border-gray-300">
                              {user.is_active ? (
                                <span className="text-green-500 font-semibold text-xs sm:text-sm">{t.online}</span>
                              ) : (
                                <span className="text-red-500 font-semibold text-xs sm:text-sm">{t.offline}</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center border-r border-gray-300">
                              {user.role !== "admin" && (
                                <button
                                  onClick={() => handleMakeAdmin(user.id, user.login)}
                                  className={`px-2 py-1 rounded text-xs sm:text-sm border ${
                                    isDarkMode ? "bg-yellow-600 hover:bg-yellow-700 border-yellow-600" : "bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
                                  } text-black font-medium transition whitespace-nowrap`}
                                  title={t.makeAdmin || "Make Admin"}
                                >
                                  {t.makeAdmin || "Admin"}
                                </button>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center border-r border-gray-300">
                              {canDeleteUser(user) && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.login)}
                                  className={`px-2 py-1 rounded text-xs sm:text-sm border ${
                                    isDarkMode ? "bg-red-600 hover:bg-red-700 border-red-600" : "bg-red-500 hover:bg-red-600 border-red-500"
                                  } text-white font-medium transition whitespace-nowrap`}
                                  title={t.deleteUser || "Delete User"}
                                >
                                  {t.deleteUser || "Delete"}
                                </button>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center">
                              <button
                                onClick={() => handleViewAccountDetails(user)}
                                className={`px-2 py-1 rounded text-xs sm:text-sm border ${
                                  isDarkMode ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : "bg-blue-500 hover:bg-blue-600 border-blue-500"
                                } text-white font-medium transition whitespace-nowrap`}
                                title={t.viewDetails || "View Details"}
                              >
                                {t.viewDetails || "Details"}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={10} className="text-center py-4 text-lg">
                              {t.noUsersFound}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      
                    </table>

                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className={`px-4 py-2 rounded font-medium border mt-4 ${
                        isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                      }`}
                    >
                      + {t.addUser || "Add User"}
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeView === "items" && (
            <motion.div key="items" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: "easeInOut" }} className="w-full max-w-7xl">
              {/* Items Section */}
              <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mt-8 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
                  <h3 className="text-xl sm:text-2xl font-semibold">{t.listOfItems || "List of Items"}</h3>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className={`px-4 py-2 rounded font-medium flex items-center gap-1 border ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
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
                        setIsTyping(true);
                      }}
                      className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
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
                    <table className={`min-w-full border-collapse text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"} border border-gray-200`}>
                      <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-100"} text-left border-b border-gray-300`}>
                        <tr>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">ID</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Title</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Number</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Category</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Series</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold text-center border-r border-gray-300">Exclusive</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold border-r border-gray-300">Image</th>
                          <th className="px-2 sm:px-3 py-2 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={item.id} className={`transition-colors border-b border-gray-200 ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-50 odd:bg-white hover:bg-gray-100"}`}>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">{item.id}</td>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">{item.title}</td>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">{item.number}</td>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">{item.category}</td>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">
                              {item.series && item.series.length > 0 ? item.series.join(", ") : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center border-r border-gray-300">
                              {item.exclusive ? (
                                <span className="text-green-500 font-semibold">✓</span>
                              ) : (
                                <span className="text-red-500 font-semibold">✗</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-2 border-r border-gray-300">
                              {item.imageName ? item.imageName : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-center">
                              <button
                                onClick={() => {
                                  console.log("Edit item:", item.id);
                                }}
                                className={`px-2 py-1 rounded text-xs sm:text-sm border ${
                                  isDarkMode ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : "bg-blue-500 hover:bg-blue-600 border-blue-500"
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
                    className={`w-full max-w-md p-6 rounded-lg shadow-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
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
                          className={`w-full p-2 border border-gray-300 rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
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
                          className={`w-full p-2 border border-gray-300 rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
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
                          className={`w-full p-2 border border-gray-300 rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
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
                          className={`w-full p-2 border border-gray-300 rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
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
                          className={`w-full p-2 border border-gray-300 rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                        />
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(false)}
                          className={`px-4 py-2 rounded border ${
                            isDarkMode ? "bg-gray-600 hover:bg-gray-500 border-gray-600" : "bg-gray-300 hover:bg-gray-400 border-gray-400"
                          } transition`}
                        >
                          {t.cancel || "Cancel"}
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-2 rounded border ${
                            isDarkMode ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : "bg-blue-500 hover:bg-blue-600 border-blue-500"
                          } text-white transition`}
                        >
                          {t.addItem || "Add Item"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 🔹 NEW VIEWS */}
          {activeView === "invites" && (
            <motion.div key="invites" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: "easeInOut" }} className="w-full max-w-7xl">
              <AdminInvites />
            </motion.div>
          )}

          {activeView === "analytics" && <motion.div key="analytics" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: "easeInOut" }} className="w-full max-w-7xl">{renderAnalyticsView()}</motion.div>}
          {activeView === "social" && <motion.div key="social" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5, ease: "easeInOut" }} className="w-full max-w-7xl">{renderSocialView()}</motion.div>}
          {activeView === "requests" && (
            <motion.div 
              key="requests" 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              transition={{ duration: 0.5, ease: "easeInOut" }} 
              className="w-full max-w-7xl"
            >
              <Requests />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && renderAddUserModal()}

      {/* Account Details Modal */}
      {showAccountDetails && renderAccountDetailsModal()}

      {/* Loyalty Dashboard Modal */}
      {showLoyaltyDashboard && (
        <LoyaltyDashboard 
          isDarkMode={isDarkMode}
          onClose={() => setShowLoyaltyDashboard(false)}
        />
      )}
      {/* Footer */}
      <footer className={`py-4 text-center text-sm ${isDarkMode ? "text-gray-400 bg-gray-800" : "text-gray-600 bg-white border-t border-gray-200"}`}>
        &copy; {new Date().getFullYear()} Pop&Go! — {t.adminPanel || "Admin Panel"}
      </footer>
    </div>
  );
};

export default Admin;