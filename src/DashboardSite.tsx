import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations } from "./Translations/TranslationsDashboard";

// Icons
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
import EditIcon from "/src/assets/edit.svg?react";
import SaveIcon from "/src/assets/save.svg?react";
import CancelIcon from "/src/assets/cancel.svg?react";

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
}

const UserCollectionSection: React.FC<{ isDarkMode: boolean; t: typeof translations["EN"] }> = ({ isDarkMode, t }) => {
  const [collection, setCollection] = useState<FunkoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/collection", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setCollection(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={`max-w-4xl w-full mb-8 p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
      <h3 className="text-xl font-semibold mb-4">{t.yourCollection}</h3>
      {loading ? <p>Loading...</p> : collection.length === 0 ? <p>{t.emptyCollection}</p> :
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collection.map(item => (
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
  );
};

const UserWishlistSection: React.FC<{ isDarkMode: boolean; t: typeof translations["EN"] }> = ({ isDarkMode, t }) => {
  const [wishlist, setWishlist] = useState<FunkoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/wishlist", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setWishlist(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={`max-w-4xl w-full mb-8 p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
      <h3 className="text-xl font-semibold mb-4">{t.yourWishlist}</h3>
      {loading ? <p>Loading...</p> : wishlist.length === 0 ? <p>{t.noItemsInWishlist}</p> :
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wishlist.map(item => (
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
  );
};

const DashboardSite: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
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

  const dropdownRef = useRef<HTMLDivElement>(null);
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

        // Fetch fresh user data from server
        const response = await fetch(`http://localhost:5000/api/users/${parsedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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


  
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/LoginSite");
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

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
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(language);
  };

  return (
    <div
      className={`welcome-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* Header */}
      <header className="py-4 px-8 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 relative">
        <div className="flex-shrink-0">
          <Link to="/" className="no-underline">
            <h1
              className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] tracking-wide ${
                isDarkMode ? "text-yellow-400" : "text-green-600"
              }`}
            >
              Pop&Go!
            </h1>
          </Link>
          {shouldShowPopup && (
            <LanguageSelectorPopup onClose={() => setShouldShowPopup(false)} />
          )}
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
              ref={buttonRef}
              onClick={toggleLanguageDropdown}
              className={`language-toggle-button p-2 rounded-full flex items-center gap-1 ${
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
      </header>

      {/* Main content - Dashboard */}
      <main className="flex-grow p-8 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">{t.welcome} {user?.name || ""}</h3>
        <h2
          className={`text-3xl font-bold mb-6 ${
            isDarkMode ? "text-yellow-400" : "text-green-600"
          }`}
        >
          {t.dashboardWelcome} 
        </h2>

        {/* Section: Profile Info */}
        <section className="max-w-2xl w-full bg-opacity-50 p-6 rounded-lg shadow-lg mb-8
          dark:bg-gray-700 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{t.profile}</h3>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className={`p-2 rounded ${
                  isDarkMode
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-600 hover:bg-green-700"
                } text-white flex items-center gap-1`}
              >
                <EditIcon className="w-4 h-4" />
                <span>{t.edit}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className={`p-2 rounded flex items-center gap-1 ${
                    isDarkMode
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  <SaveIcon className="w-4 h-4" />
                  <span>{isLoading ? t.saving : t.save}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className={`p-2 rounded flex items-center gap-1 ${
                    isDarkMode
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  <CancelIcon className="w-4 h-4" />
                  <span>{t.cancel}</span>
                </button>
              </div>
            )}
          </div>
          {error && (
            <div className={`mb-4 p-2 rounded ${
              isDarkMode ? "bg-red-900 text-red-200" : "bg-red-200 text-red-800"
            }`}>
              {error}
            </div>
          )}
          <ul className="space-y-3">
            {isEditing ? (
              <>
                <li className="flex flex-wrap items-center">
                  <strong className="w-full md:w-1/3">{t.name}:</strong>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className={`flex-grow px-3 py-1 rounded ${
                      isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"
                    }`}
                  />
                </li>
                <li className="flex flex-wrap items-center">
                  <strong className="w-full md:w-1/3">{t.surname}:</strong>
                  <input
                    type="text"
                    name="surname"
                    value={editForm.surname}
                    onChange={handleInputChange}
                    className={`flex-grow px-3 py-1 rounded ${
                      isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"
                    }`}
                  />
                </li>
                <li className="flex flex-wrap items-center">
                  <strong className="w-full md:w-1/3">{t.gender}:</strong>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleInputChange}
                    className={`flex-grow px-3 py-1 rounded ${
                      isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"
                    }`}
                  >
                    <option value="">{t.selectGender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="other">{t.other}</option>
                    <option value="prefer_not_to_say">{t.preferNotToSay}</option>
                  </select>
                </li>
                <li className="flex flex-wrap items-center">
                  <strong className="w-full md:w-1/3">{t.dateOfBirth}:</strong>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editForm.date_of_birth}
                    onChange={handleInputChange}
                    className={`flex-grow px-3 py-1 rounded ${
                      isDarkMode ? "bg-gray-600 text-white" : "bg-gray-100"
                    }`}
                  />
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong>{t.name}:</strong> {user?.name || "N/A"}
                </li>
                <li>
                  <strong>{t.surname}:</strong> {user?.surname || "N/A"}
                </li>
                <li>
                  <strong>{t.email}:</strong> {user?.email || "N/A"}
                </li>
                <li>
                  <strong>{t.login}:</strong> {user?.login || "N/A"}
                </li>
                <li>
                  <strong>{t.gender}:</strong> {user?.gender ? t[user.gender] || user.gender : "N/A"}
                </li>
                <li>
                  <strong>{t.dateOfBirth}:</strong> {formatDate(user?.date_of_birth || "")}
                </li>
                <li>
                  <strong>{t.userSince}:</strong> {formatDate(user?.created_at || "")}
                </li>
                <li>
                  <strong>{t.lastLogin}:</strong> {formatDate(user?.last_login || "")}
                </li>
              </>
            )}
          </ul>
          <div className="mt-6">
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
          </div>
        </section>

        {/* Section: Collection */}
        <UserCollectionSection isDarkMode={isDarkMode} t={t} />

        {/* Section: Wishlist */}
        <UserWishlistSection isDarkMode={isDarkMode} t={t} />
      </main>

      {/* Footer */}
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

export default DashboardSite;