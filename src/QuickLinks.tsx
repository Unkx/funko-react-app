import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { quickLinksTranslations } from './Translations/QuickLinksTranslations';

interface QuickLinksProps {
  isDarkMode?: boolean;
  language?: keyof typeof quickLinksTranslations;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  userName?: string;
  onLoginClick?: () => void;
  onDashboardClick?: () => void;
}

const QuickLinks: React.FC<QuickLinksProps> = ({
  isDarkMode = false,
  language = 'EN',
  isAuthenticated = false,
  isAdmin = false,
  userName = '',
  onLoginClick,
  onDashboardClick
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const t = quickLinksTranslations[language] || quickLinksTranslations.EN;

  const handleUserLinkClick = (e: React.MouseEvent, path: string) => {
    if (!isAuthenticated && path === '/loginregistersite') {
      if (onLoginClick) {
        e.preventDefault();
        onLoginClick();
      }
    } else if (isAuthenticated && path === '/DashboardSite') {
      if (onDashboardClick) {
        e.preventDefault();
        onDashboardClick();
      }
    }
  };

  const getLinks = () => {
    const baseLinks = [
      { key: 'home', text: t.home, path: '/' },
      { key: 'search', text: t.search, path: '/SearchSite' },
      { key: 'mostVisited', text: t.mostVisited, path: '/mostVisited' },
      { key: 'categories', text: t.categories, path: '/categories' },
      { key: 'features', text: t.features, path: '/features' },
      { key: 'about', text: t.about, path: '/about' },
    ];

    const userOnlyLinks = isAuthenticated ? [] : [];

    return [...baseLinks, ...userOnlyLinks];
  };

  const links = getLinks();

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const getMobileIcon = (key: string) => {
    const icons: Record<string, string> = {
      'home': '🏠',
      'search': '🔍',
      'mostVisited': '🔥',
      'categories': '📁',
      'features': '⭐',
      'about': 'ℹ️',
      'loginRegister': '👤',
      'dashboard': '📊',
      'adminPanel': '⚙️',
      'adminInvites': '📨',
      'requests': '📋',
    };
    return icons[key] || '🔗';
  };

  return (
    <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} sticky top-0 z-40 shadow`}>
      {/* UPDATED: Added padding to the main container and text-center */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
        <nav className="text-center">
          {/* UPDATED: Changed to flex-wrap for better centering on all screens */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-3">
            {links.map((link) => {
              const active = isActive(link.path);
              
              return (
                <div key={link.key} className="flex-shrink-0">
                  <Link
                    to={link.path}
                    onClick={(e) => handleUserLinkClick(e, link.path)}
                    className={`
                      inline-flex items-center justify-center 
                      text-xs sm:text-sm font-medium 
                      px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 
                      rounded-full transition-all duration-200 
                      min-w-[44px] md:min-w-auto
                      ${active
                        ? isDarkMode
                          ? 'bg-yellow-400 text-gray-900 font-semibold shadow'
                          : 'bg-blue-600 text-white font-semibold shadow'
                        : isDarkMode
                          ? 'text-yellow-300 hover:bg-gray-700 hover:text-yellow-200'
                          : 'text-blue-600 hover:bg-blue-200 hover:text-blue-800'
                      }
                    `}
                    title={link.text}
                  >
                    {/* DESKTOP: TEXT */}
                    <span className="hidden md:inline whitespace-nowrap">
                      {link.text}
                    </span>
                    
                    {/* MOBILE: ICON */}
                    <span className="inline md:hidden text-base">
                      {getMobileIcon(link.key)}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default QuickLinks;