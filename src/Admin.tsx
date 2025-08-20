import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationAdmin";
import ItemList from "./ItemList.tsx"; // Import the new ItemList component

// SVG Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
import UsersIcon from "/src/assets/users.svg?react";
import EyeIcon from "/src/assets/eye.svg?react";
import ChartIcon from "/src/assets/chart.svg?react";
import CalendarIcon from "/src/assets/calendar.svg?react";

// Flag SVGs
import UKFlag from "/src/assets/flags/uk.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";

interface User {
  id: number;
  login: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  created_at: string;
  last_login: string | null;
  is_active?: boolean;
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

const Admin = () => {
  // Constants
  const SUPER_ADMIN_ID = 1;
  const SUPER_ADMIN_USERNAME = "admin";

  // Hooks
  const navigate = useNavigate();

  // State
  const [isDarkMode, setIsDarkMode] = useState(() =>
    localStorage.getItem("preferredTheme") === "dark"
  );
  const [language, setLanguage] = useState(() =>
    localStorage.getItem("preferredLanguage") || "EN"
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Item related state is now primarily handled by ItemList.tsx,
  // but we keep newItem and showAddItemModal for the modal itself.
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

  // Derived values
  const t = translations[language];
  const currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const token: string | null = localStorage.getItem("token");

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

  // Effects
  useEffect(() => {
    if (!token || !currentUser || currentUser.role !== "admin") {
      const timer = setTimeout(() => {
        navigate("/loginSite", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, token, navigate]);

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
            navigate("/loginSite");
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
  }, [token, currentUser?.role, t.sessionExpired, navigate]); // Added dependencies

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
        console.error( t.failedToLoadStatictics ||"Failed to load site statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSiteStats();
  }, [token, currentUser?.role]);

  // Handlers
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("preferredTheme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/loginSite");
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

      // You might want to refresh the ItemList data after adding a new item.
      // This could involve passing a refresh function down to ItemList,
      // or simply letting ItemList refetch its current page data.
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
      // Optionally, force ItemList to re-fetch to show the new item
      // This would require a prop in ItemList to trigger refetch, e.g., a 'refetchTrigger' state
    } catch (err: any) {
      console.error('Add item error:', err);
      alert(`Failed to add item: ${err.message}`);
    }
  };

  // Early return if not authorized
  if (!token || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-center px-4">
        <p className="text-red-600 text-3xl font-semibold mb-4">
          {t.accessRestricted || "You have no access here."}
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

  // Main render
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-100 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to="/" className="no-underline flex-shrink-0">
          <h1 className={`text-3xl sm:text-4xl font-bold font-[Special_Gothic_Expanded_One] ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
            Pop&Go!
          </h1>
        </Link>

        {/* Language, Theme, and Logout */}
        <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-end">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown((prev) => !prev)}
              className={`p-2 rounded-full flex items-center gap-1 text-base ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              aria-label="Change language"
            >
              <GlobeIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{language}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
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
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

        
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-8 py-6 flex flex-col items-center">

        {/* Site Statistics Section */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <ChartIcon className="w-6 h-6" />
            {t.siteStatistics || "Site Statistics"}
          </h3>

          {statsLoading ? (
            <p className="text-center text-lg">{t.loadingStatistics || "Loading statistics..."}</p>
          ) : siteStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-blue-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalUsers || "Total Users"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalUsers}</p>
              </div>

              {/* Total Items */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-green-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalItems || "Total Items"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalItems}</p>
              </div>

              {/* New Users (Last 7 Days) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-purple-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.newUsers7Days || "New Users (7 Days)"}</h4>
                <p className="text-2xl font-bold">{siteStats.newUsersLast7Days}</p>
              </div>

              {/* Active Users (Last 24h) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-orange-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.activeUsers24h || "Active Users (24h)"}</h4>
                <p className="text-2xl font-bold">{siteStats.activeUsersLast24Hours}</p>
              </div>

              {/* Total Visits */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-red-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
                  <EyeIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.totalVisits || "Total Visits"}</h4>
                <p className="text-2xl font-bold">{siteStats.totalVisits}</p>
              </div>

              {/* Average Users Per Day */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-indigo-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
                  <ChartIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.avgUsersPerDay || "Avg. Users/Day"}</h4>
                <p className="text-2xl font-bold">{siteStats.averageUsersPerDay}</p>
              </div>

              {/* Most Active User */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-pink-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mb-2">
                  <UsersIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.mostActiveUser || "Most Active User"}</h4>
                <p className="text-xl font-bold truncate max-w-full">{siteStats.mostActiveUser || "N/A"}</p>
              </div>

              {/* Items Added (Last 30 Days) */}
              <div className={`p-4 rounded-lg flex flex-col items-center ${isDarkMode ? "bg-gray-600" : "bg-teal-50"}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-2">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-lg mb-1">{t.itemsAdded30Days || "Items Added (30 Days)"}</h4>
                <p className="text-2xl font-bold">{siteStats.itemsAddedLast30Days}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-red-500">{t.failedToLoadStatictics || "Failed to load statistics."}</p>
          )}
        </section>

        {/* Notes section */}
        <div className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center">{t.notes || "Notes"}:</h3>
            <ul className="list-disc list-inside space-y-2">
                <li>{t.note1 || "Create two subpages for the user list and item list"}</li>
                <li>{t.note2 || "Organize the item list and refactor it (so the page uses less memory)"}</li>
            </ul>
        </div>

        {/* Users Section */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} mb-8`}>
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t.listOfUsers}</h3>

          {loading ? (
            <p className="text-lg">{t.loading}</p>
          ) : error ? (
            <p className="text-red-500 text-lg">{error}</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className={`min-w-full border-collapse text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
                <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"} text-left`}>
                  <tr>
                    <th className="w-16 px-2 sm:px-3 py-2 text-center font-semibold">ID</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold">Login</th>
                    <th className="px-2 sm:px-3 py-2 font-semibold hidden md:table-cell">Email</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Role</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell">Date of Registration</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold hidden lg:table-cell">Last Activity</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Status</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Actions</th>
                    <th className="px-2 sm:px-3 py-2 text-center font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-100 odd:bg-white hover:bg-gray-200"}`}>
                      <td className="w-16 px-2 sm:px-3 py-2 text-center">
                        {user.id}
                        {isSuperAdmin(user) && (
                          <span className="block text-xs text-purple-600">★</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 truncate max-w-[100px]" title={user.login}>{user.login}</td>
                      <td className="px-2 sm:px-3 py-2 truncate hidden md:table-cell" title={user.email}>{user.email}</td>
                      <td className="px-2 sm:px-3 py-2 capitalize text-center">
                        {user.role}
                        {isSuperAdmin(user) && (
                          <span className="block text-xs text-purple-600">super</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-2 sm:px-3 py-2 text-center text-xs hidden lg:table-cell">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : t.never}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {user.is_active ? (
                          <span className="text-green-500 font-semibold text-xs sm:text-sm">{t.online}</span>
                        ) : (
                          <span className="text-red-500 font-semibold text-xs sm:text-sm">{t.offline}</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleMakeAdmin(user.id, user.login)}
                            className={`px-2 py-1 rounded text-xs sm:text-sm ${
                              isDarkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
                            } text-black font-medium transition whitespace-nowrap`}
                            title={t.makeAdmin || "Make Admin"}
                          >
                            {t.makeAdmin || "Admin"}
                          </button>
                        )}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-center">
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.login)}
                            className={`px-2 py-1 rounded text-xs sm:text-sm ${
                              isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                            } text-white font-medium transition whitespace-nowrap`}
                            title={t.deleteUser || "Delete User"}
                          >
                            {t.deleteUser || "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-lg">
                        {t.noUsersFound}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Items Section (now uses ItemList component) */}
        <section className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg mt-8 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
            <h3 className="text-xl sm:text-2xl font-semibold">{t.listOfItems || "List of Items"}</h3>
            <button
              onClick={() => setShowAddItemModal(true)}
              className={`px-4 py-2 rounded font-medium flex items-center gap-1 ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } transition`}
            >
              + {t.addItem || "Add Item"}
            </button>
          </div>

          <ItemList
            token={token}
            currentUserRole={currentUser?.role}
            isDarkMode={isDarkMode}
            t={(key: string) => (translations[language] as any)[key]} // Pass translation function
          />
        </section>

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowAddItemModal(false)}>
            <div
              className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
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
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
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
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
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
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
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
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
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
                    className={`w-full p-2 border rounded ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-300 hover:bg-gray-400"
                    } transition`}
                  >
                    {t.cancel || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded ${
                      isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                    } text-white transition`}
                  >
                    {t.addItem || "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h3 className={'px-4 py-2' }/>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              {t.logout}
            </button>
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        &copy; {new Date().getFullYear()} Pop&Go! — {t.adminPanel || "Admin Panel"}
      </footer>
    </div>
  );
};

export default Admin;