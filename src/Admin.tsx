import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LanguageSelectorPopup from "./LanguageSelectorPopup";
import { translations } from "./Translations/TranslationAdmin"; // Assuming translations are also for Register

// Ikony SVG
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



const Admin = () => {
  const navigate = useNavigate();

  // Ustawienia motywu i języka
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("preferredTheme") === "dark";
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = translations[language];

  // Dane użytkownika z localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Sprawdzenie dostępu – tylko admin może wejść
if (!user || user.role !== "admin") {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-center px-4">
      <p className="text-red-600 text-2xl font-semibold mb-4">
        {t.accessRestricted || "You have no access here"}
      </p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
      >
        {t.goBackToMainsite || "Go back to main site"}
      </Link>
    </div>
  );
}


  // Pobierz użytkowników z API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Jeśli używasz JWT
          },
        });
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Błąd pobierania użytkowników:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Przełączanie motywu
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("preferredTheme", newMode ? "dark" : "light");

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Wybór języka
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

  // Wylogowanie
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Jeśli używasz JWT
    navigate("/loginSite");
  };

  return (
    <div
      className={`welcome-site min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-400 text-black"
      }`}
    >
      {/* Header */}
      <header className="py-4 px-8 flex justify-between items-center">
        <Link to="/" className="no-underline">
          <h1
            className={`text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
              isDarkMode ? "text-yellow-400" : "text-green-600"
            }`}
          >
            Pop&Go!
          </h1>
        </Link>

        {/* Język i motyw */}
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown((prev) => !prev)}
              className={`p-2 rounded-full flex items-center gap-1 ${
                isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label="Change language"
            >
              <GlobeIcon className="w-5 h-5" />
              <span>{language}</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showLanguageDropdown && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10 ${
                  isDarkMode ? "bg-gray-700" : "bg-white"
                }`}
              >
                {Object.entries(language).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => selectLanguage(code)}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                      language === code
                        ? isDarkMode
                          ? "bg-yellow-500 text-black"
                          : "bg-green-600 text-white"
                        : ""
                    }`}
                  >
                    <span className="w-5 h-5">{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Motyw */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          {/* Wylogowanie */}
          {/* <button
            onClick={handleLogout}
            className={`p-2 rounded-full flex items-center gap-1 ${
              isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
            } text-white`}
            aria-label="Logout"
          >

            <span>{t.logout}</span>
          </button> */}
        </div>
      </header>

      {/* Główna zawartość */}
      <main className="flex-grow p-8 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">
          {t.welcome}, {user?.name || "Admin"} {user?.surname || ""}
        </h3>
        <h2
          className={`text-3xl font-bold mb-6 ${
            isDarkMode ? "text-yellow-400" : "text-green-600"
          }`}
        >
          {t.dashboardWelcome}
        </h2>

        <div
          className={`max-w-4xl w-full bg-opacity-50 p-6 rounded-lg shadow-lg ${
            isDarkMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <h3 className="text-xl font-semibold mb-4">{t.listOfUsers}</h3>

          {loading ? (
            <p>{t.loading}</p>
          ) : users.length > 0 ? (
            <table
              className={`w-full border-collapse ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
              } shadow-md rounded-lg overflow-hidden`}
            >
              <thead
                className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"} text-left`}
              >
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Login</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Rola</th>
                  <th className="px-4 py-2">Data rejestracji</th>
                  <th className="px-4 py-2">Ostatni login</th>
                  <th className="px-4 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`${
                      isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                    } transition-colors duration-200`}
                  >
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.login}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 capitalize">{user.role}</td>
                    <td className="px-4 py-2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Nigdy"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm("Czy na pewno usunąć tego użytkownika?")) {
                            fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                              },
                            })
                              .then((res) => res.json())
                              .then(() => {
                                alert(`${t.userDeleted} ${user.login}`);
                                setUsers(users.filter((u) => u.id !== user.id));
                              })
                              .catch((err) =>
                                console.error("Nie udało się usunąć użytkownika:", err)
                              );
                          }
                        }}
                        className={`px-3 py-1 rounded ${
                          isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                        } text-white`}
                      >
                        {t.deleteUser}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      {t.noUsersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <p>{t.noUsersFound}</p>
          )}

          
        </div>

         <div className="mt-6">
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded ${
                isDarkMode
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              {t.logout || "Logout"}
            </button>
          </div>  
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

export default Admin;