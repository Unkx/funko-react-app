import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationAdmin";

// SVG Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

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

const Admin = () => {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");
  const token: string | null = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !user || user.role !== "admin") {
      const timer = setTimeout(() => {
        navigate("/loginSite", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, token, navigate]);

  if (!token || !user || user.role !== "admin") {
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

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/loginSite");
            setError(t.sessionExpired || "Session expired.");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch users.");
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === "admin") {
      fetchUsers();
    }
  }, [token, user?.role, navigate, t.sessionExpired]);

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
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role: "admin" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to promote user.");
      }

      const data = await response.json();
      alert(`${t.userPromoted} ${data.user.login}`);

      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: "admin" } : u
      ));
    } catch (err: any) {
      alert(`${t.failedToPromote}: ${err.message}`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-100 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to="/" className="no-underline">
          <h1 className={`text-3xl sm:text-4xl font-bold font-[Special_Gothic_Expanded_One] ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
            Pop&Go!
          </h1>
        </Link>

        {/* Language and Theme */}
        <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-end">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown((prev) => !prev)}
              className={`p-2 rounded-full flex items-center gap-1 text-base ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              aria-label="Change language"
            >
              <GlobeIcon className="w-5 h-5" />
              <span>{language}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
            </button>

            {showLanguageDropdown && (
              <div className={`absolute right-0 mt-2 w-48 max-w-full rounded-md shadow-lg py-1 z-10 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
                {Object.entries(translations).map(([code, langData]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 text-base ${language === code ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : ""}`}
                  >
                    {code === 'EN' && <UKFlag className="w-5 h-5" />}
                    {code === 'PL' && <PolandFlag className="w-5 h-5" />}
                    {code === 'RU' && <RussiaFlag className="w-5 h-5" />}
                    {code === 'FR' && <FranceFlag className="w-5 h-5" />}
                    {code === 'DE' && <GermanyFlag className="w-5 h-5" />}
                    {code === 'ES' && <SpainFlag className="w-5 h-5" />}
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
        <h3 className="text-xl sm:text-2xl font-semibold mb-2">
          {t.welcome}, {user?.name} {user?.surname}
        </h3>
        <h2 className={`text-3xl sm:text-4xl font-bold mb-6 ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
          {t.dashboardWelcome}
        </h2>

        <div className={`max-w-6xl w-full p-4 sm:p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t.listOfUsers}</h3>

          {loading ? (
            <p className="text-lg">{t.loading}</p>
          ) : error ? (
            <p className="text-red-500 text-lg">{error}</p>
          ) : (
          <div className="overflow-x-auto w-full">
            <table className={`min-w-full border-collapse text-base sm:text-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
              <thead className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"} text-left`}>
                <tr>
                  <th className="w-16 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserID}</th>
                  <th className="w-24 px-2 sm:px-3 py-2 font-semibold">{t.UserName}</th>
                  <th className="w-48 px-2 sm:px-3 py-2 font-semibold">{t.UserEmail}</th>
                  <th className="w-24 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserRole}</th>
                  <th className="w-32 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserDateOfRegistration}</th>
                  <th className="w-40 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserLastActivity}</th>
                  <th className="w-24 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserStatus}</th>
                  <th className="w-32 px-2 sm:px-3 py-2 text-center font-semibold">{t.UserActions || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}>
                    <td className="w-16 px-2 sm:px-3 py-2 text-center">{user.id}</td>
                    <td className="w-24 px-2 sm:px-3 py-2 truncate" title={user.login}>{user.login}</td>
                    <td className="w-48 px-2 sm:px-3 py-2 truncate" title={user.email}>{user.email}</td>
                    <td className="w-24 px-2 sm:px-3 py-2 capitalize text-center">{user.role}</td>
                    <td className="w-32 px-2 sm:px-3 py-2 text-center">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="w-40 px-2 sm:px-3 py-2 text-center text-sm">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : t.never}
                    </td>
                    <td className="w-24 px-2 sm:px-3 py-2 text-center">
                      {user.is_active ? (
                        <span className="text-green-500 font-semibold text-sm">{t.online}</span>
                      ) : (
                        <span className="text-red-500 font-semibold text-sm">{t.offline}</span>
                      )}
                    </td>
                    <td className="w-32 px-2 sm:px-3 py-2 text-center">
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleMakeAdmin(user.id, user.login)}
                          className={`px-2 py-1 rounded text-sm ${
                            isDarkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
                          } text-black font-medium transition whitespace-nowrap`}
                          title={t.makeAdmin || "Make Admin"}
                        >
                          {t.makeAdmin || "Admin"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-lg">
                      {t.noUsersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className={`px-4 py-2 rounded text-lg ${isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white`}
          >
            {t.logout}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-4 text-base ${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"}`}>
        {t.copyright}
      </footer>
    </div>
  );
};

export default Admin;