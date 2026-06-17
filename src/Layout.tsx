import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LanguageContext } from './LanguageContext';
import { useTheme } from './ThemeContext';
import AuthButton from './AuthButton';
import {
  Search, Sun, Moon, Globe, ChevronDown,
  Home, TrendingUp, LayoutGrid, Star, Info
} from 'lucide-react';

const languages: Record<string, { name: string; flag: string }> = {
  US: { name: 'USA', flag: 'us' },
  EN: { name: 'UK', flag: 'gb' },
  CA: { name: 'Canada', flag: 'ca' },
  PL: { name: 'Polski', flag: 'pl' },
  RU: { name: 'Русский', flag: 'ru' },
  ES: { name: 'Español', flag: 'es' },
  FR: { name: 'Français', flag: 'fr' },
  DE: { name: 'Deutsch', flag: 'de' },
};

const navItems = [
  { key: 'home', path: '/', Icon: Home },
  { key: 'search', path: '/SearchSite', Icon: Search },
  { key: 'mostVisited', path: '/mostVisited', Icon: TrendingUp },
  { key: 'categories', path: '/categories', Icon: LayoutGrid },
  { key: 'features', path: '/features', Icon: Star },
  { key: 'about', path: '/about', Icon: Info },
];

const navLabels: Record<string, Record<string, string>> = {
  EN: { home: 'Home', search: 'Search', mostVisited: 'Popular', categories: 'Categories', features: 'Features', about: 'About' },
  US: { home: 'Home', search: 'Search', mostVisited: 'Popular', categories: 'Categories', features: 'Features', about: 'About' },
  CA: { home: 'Home', search: 'Search', mostVisited: 'Popular', categories: 'Categories', features: 'Features', about: 'About' },
  PL: { home: 'Start', search: 'Szukaj', mostVisited: 'Popularne', categories: 'Kategorie', features: 'Funkcje', about: 'O nas' },
  RU: { home: 'Главная', search: 'Поиск', mostVisited: 'Популярные', categories: 'Категории', features: 'Функции', about: 'О нас' },
  FR: { home: 'Accueil', search: 'Recherche', mostVisited: 'Populaire', categories: 'Catégories', features: 'Fonctions', about: 'À propos' },
  DE: { home: 'Start', search: 'Suche', mostVisited: 'Beliebt', categories: 'Kategorien', features: 'Funktionen', about: 'Über uns' },
  ES: { home: 'Inicio', search: 'Buscar', mostVisited: 'Popular', categories: 'Categorías', features: 'Funciones', about: 'Acerca de' },
};

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  translations?: Record<string, string>;
}

export default function Layout({ children, showSearch = true, translations: t = {} }: LayoutProps) {
  const { language, setLanguage } = useContext(LanguageContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showLangDropdown &&
        langDropdownRef.current &&
        langButtonRef.current &&
        !langDropdownRef.current.contains(e.target as Node) &&
        !langButtonRef.current.contains(e.target as Node)
      ) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.toLowerCase().startsWith(path.toLowerCase());
  };

  const labels = navLabels[language] || navLabels.EN;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDarkMode ? 'bg-slate-900 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 no-underline">
            <span className={`text-xl sm:text-2xl font-bold tracking-wide ${isDarkMode ? 'text-amber-400' : 'text-blue-600'}`}>
              <span className="font-['Righteous']">Pop</span>
              <span className="font-['Poppins'] text-lg sm:text-xl">&amp;</span>
              <span className="font-['Righteous']">Go!</span>
            </span>
          </Link>

          {/* Search */}
          {showSearch && (
            <form
              onSubmit={handleSearch}
              className={`hidden sm:flex flex-1 max-w-md rounded-lg overflow-hidden border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 focus-within:border-amber-400/50' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400'}`}
            >
              <input
                type="text"
                placeholder={t.searchPlaceholder || 'Search Funko Pops...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-grow px-4 py-2 text-sm outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                aria-label="Search"
              />
              <button
                type="submit"
                className={`px-3 py-2 transition-colors ${isDarkMode ? 'bg-amber-400 hover:bg-amber-500 text-slate-900' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Spacer */}
          <div className="flex-1 sm:flex-none" />

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                ref={langButtonRef}
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className={`p-2 rounded-lg flex items-center gap-1 text-sm transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                aria-label="Select language"
                aria-expanded={showLangDropdown}
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-xs font-medium">{language}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div
                  ref={langDropdownRef}
                  className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border py-1.5 z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {Object.entries(languages).map(([code, { name, flag }]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                        language === code
                          ? isDarkMode
                            ? 'bg-amber-400/15 text-amber-400 font-semibold'
                            : 'bg-blue-50 text-blue-700 font-semibold'
                          : isDarkMode
                            ? 'text-slate-300 hover:bg-slate-700'
                            : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/${flag}.svg`}
                        className="w-5 h-3.5 rounded-sm object-cover"
                        alt={name}
                        loading="lazy"
                      />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Auth */}
            <AuthButton isDarkMode={isDarkMode} translations={t} />
          </div>
        </div>

        {/* Navigation */}
        <nav className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex justify-center gap-0.5 sm:gap-1 overflow-x-auto">
            {navItems.map(({ key, path, Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={key}
                  to={path}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                    active
                      ? isDarkMode
                        ? 'bg-amber-400/15 text-amber-400 font-semibold'
                        : 'bg-blue-50 text-blue-600 font-semibold'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title={labels[key]}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{labels[key]}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Search */}
        {showSearch && (
          <div className={`sm:hidden border-t px-4 py-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <form
              onSubmit={handleSearch}
              className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <input
                type="text"
                placeholder={t.searchPlaceholder || 'Search Funko Pops...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-grow px-3 py-2 text-sm outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'}`}
                aria-label="Search"
              />
              <button
                type="submit"
                className={`px-3 py-2 ${isDarkMode ? 'bg-amber-400 text-slate-900' : 'bg-blue-600 text-white'}`}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className={`text-center py-6 text-sm border-t transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>
        <p>{t.copyright || '© 2025 Pop&Go! All rights reserved.'}</p>
      </footer>
    </div>
  );
}
