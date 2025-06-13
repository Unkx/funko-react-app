  import React, { useState, useEffect, useRef } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import LanguageSelectorPopup from "./LanguageSelectorPopup";
  import { translations } from "./Translations/TranslationsLogIn";

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

  const languages = {
    EN: { name: "English", flag: <UKFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
  };

  const LoginSite: React.FC = () => {
    // Load theme from localStorage using "preferredTheme"
    const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem("preferredTheme");
      return savedTheme !== null ? savedTheme === "dark" : true;
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [language, setLanguage] = useState("EN");
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [shouldShowPopup, setShouldShowPopup] = useState(false);
    const navigate = useNavigate();
    const t = translations[language] || translations["EN"];
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Form state
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Save theme preference and apply globally
    useEffect(() => {
      localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");

      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, [isDarkMode]);

    // Toggle functions
    const selectLanguage = (lang: string) => {
      setLanguage(lang);
      localStorage.setItem("preferredLanguage", lang);
      setShowLanguageDropdown(false);
    };

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    const toggleLanguageDropdown = () =>
      setShowLanguageDropdown((prev) => !prev);

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate("/searchsite");
      }
    };

    // Handle login submission
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!login || !password) {
        setLoginError(t.emptyFieldsError || "Fill all fields.");
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setLoginError(data.error || "Login failed");
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === "admin") {
          navigate("/AdminSite");
        } else {
          navigate("/dashboardSite");
        }
        

      } catch (err) {
        console.error("Login error:", err);
        setLoginError("Connection error. Please try again.");
      }
    };
    // Load saved settings and handle click outside for language dropdown
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
          dropdownRef.current &&
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setShowLanguageDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showLanguageDropdown]);
    
    return (
      <div
        className={`welcome-site min-h-screen flex flex-col ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-indigo-200 text-black"
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
            {shouldShowPopup && ( // Conditionally render the popup
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
                  ref={dropdownRef} // Assign ref to the dropdown div
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

        {/* Main content - Login form */}
        <main className="flex-grow p-8 flex flex-col items-center justify-center">
          <h2
            className={`text-2xl font-bold mb-4 ${
              isDarkMode ? "text-yellow-400" : "text-green-600"
            }`}
          >
            {t.goToLoginSite}
          </h2>

          <form
            onSubmit={handleLogin}
            className={`max-w-md w-full flex flex-col gap-4 p-6 rounded-lg shadow-md ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
            }`}
          >
            {loginError && (
              <p className="text-red-500 mb-2">{loginError}</p>
            )}

            <input
              type="text"
              placeholder={t.login}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className={`px-4 py-2 rounded ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              }`}
              required
            />

            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`px-4 py-2 rounded ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
              }`}
              required
            />

            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } transition-colors`}
            >
              {t.loginButton}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-4 text-center">
            <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} mr-2`}>
              {t.registerLink}
            </span>
            <Link
              to="/RegisterSite"
              className={`font-medium underline ${
                isDarkMode
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-green-600 hover:text-green-800"
              }`}
            >
              {t.registerNow || "Register"}
            </Link>
          </div>
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

  export default LoginSite;