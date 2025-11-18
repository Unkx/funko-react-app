// LoginRegisterSite.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations as loginTranslations } from "./Translations/TranslationsLogIn";
import { translations as registerTranslations } from "./Translations/TranslationRegistersite";

import { motion, AnimatePresence } from "framer-motion";

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

const LoginRegisterSite: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme !== null ? savedTheme === "dark" : true;
  });

  const [language, setLanguage] = useState("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const navigate = useNavigate();
  const tLogin = loginTranslations[language] || loginTranslations["EN"];
  const tRegister = registerTranslations[language] || registerTranslations["EN"];

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Login form state
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [email, setEmail] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [registerError, setRegisterError] = useState("");


  // Save theme
  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  // Language & popup
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // Handlers
  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!login || !password) {
      setLoginError(tLogin.emptyFieldsError || "Fill all fields.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      navigate(data.user.role === "admin" ? "/AdminSite" : "/dashboardSite");
    } catch {
      setLoginError("Connection error. Please try again.");
    }
  };

  // --- REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (!email || !regLogin || !name || !surname || !regPassword || !confirmPassword || !gender || !dateOfBirth) {
      setRegisterError(tRegister.allFieldsRequired || "All fields are required.");
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegisterError(tRegister.passwordsDoNotMatch || "Passwords do not match.");
      return;
    }
    const payload = {
      email,
      login: regLogin,
      name,
      surname,
      password: regPassword,
      gender,
      nationality, // ✅ send it
      date_of_birth: new Date(dateOfBirth).toISOString().split("T")[0],
      // ❌ remove "role"
    };
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || "Registration failed");
      }
      navigate("/dashboardSite");
    } catch (err: any) {
      setRegisterError(err.message || "Failed to connect to server.");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"}`}>
      {/* Header */}
      <header className="py-4 px-8 flex justify-between items-center">
        <Link to="/" className="no-underline">
          <h1 className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
            Pop&Go!
          </h1>
        </Link>
        {shouldShowPopup && <LanguageSelectorPopup onClose={() => setShouldShowPopup(false)} />}
        <div className="flex gap-4">
          {/* Language */}
          <div className="relative">
            <button ref={buttonRef} onClick={() => setShowLanguageDropdown((p) => !p)}
              className={`p-2 rounded-full flex items-center gap-1 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
              <GlobeIcon className="w-5 h-5" /> <span>{language}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
            </button>
            {showLanguageDropdown && (
              <div ref={dropdownRef} className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
                {Object.entries(languages).map(([code, { name, flag }]) => (
                  <button key={code} onClick={() => selectLanguage(code)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${language === code ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white") : (isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200")}`}>
                    {flag} <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>


    <main className="flex-grow p-8 flex flex-col items-center justify-center">
    <AnimatePresence mode="wait">
        {!showRegister ? (
        <motion.div
            key="login"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex justify-center"
        >
            {/* LOGIN FORM */}
            <form
            onSubmit={handleLogin}
            className={`max-w-md w-full flex flex-col gap-4 p-6 rounded-lg shadow-md ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
            }`}
            >
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-yellow-400" : "text-blue-600"}`}>
                {tLogin.goToLoginSite}
            </h2>
            {loginError && <p className="text-red-500">{loginError}</p>}
            <input type="text" placeholder={tLogin.login} value={login} onChange={(e) => setLogin(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}/>
            <input type="password" placeholder={tLogin.password} value={password} onChange={(e) => setPassword(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <button type="submit" className={`px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                {tLogin.loginButton}
            </button>
            <p className="text-center mt-2">
                {tLogin.registerLink}{" "}
                <button type="button" onClick={() => setShowRegister(true)} className="underline text-green-600 dark:text-blue-400">
                {tLogin.registerNow}
                </button>
            </p>
            </form>
        </motion.div>
        ) : (
        <motion.div
            key="register"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex justify-center"
        >
            {/* REGISTER FORM */}
            <form
            onSubmit={handleRegister}
            className={`max-w-md w-full flex flex-col gap-4 p-6 rounded-lg shadow-md ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
            }`}
            >
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-yellow-400" : "text-green-600"}`}>
                {tRegister.registerTitle}
            </h2>
            {registerError && <p className="text-red-500">{registerError}</p>}
            <input type="text" placeholder={tRegister.username} value={regLogin} onChange={(e) => setRegLogin(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="text" placeholder={tRegister.name} value={name} onChange={(e) => setName(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="text" placeholder={tRegister.surname} value={surname} onChange={(e) => setSurname(e.target.value)}className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="password" placeholder={tRegister.password} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="password" placeholder={tRegister.confirmPassword} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <input type="text" placeholder={tRegister.nationality} value={nationality} onChange={(e) => setNationality(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}>
                <option value="">{tRegister.selectGender}</option>
                <option value="male">{tRegister.male}</option>
                <option value="female">{tRegister.female}</option>
                <option value="other">{tRegister.other}</option>
                <option value="prefer_not_to_say">{tRegister.preferNotToSay}</option>
            </select>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`} />

            <div className="flex gap-2">
                <button type="submit" className={`flex-1 px-4 py-2 rounded ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                {tRegister.registerButton}
                </button>
                <button type="button" onClick={() => setShowRegister(false)} className={`flex-1 px-4 py-2 rounded border  ${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-red-600 hover:bg-red-700 text-white"}`}>
                {tRegister.backToLogin || "Back"}
                </button>
            </div>
            </form>
        </motion.div>
        )}
    </AnimatePresence>
    </main>


      <footer className={`text-center py-4 ${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-200 text-gray-700"}`}>
        {tLogin.copyright || "© 2025 Pop&Go! All rights reserved."}
      </footer>
    </div>
  );
};

export default LoginRegisterSite;
