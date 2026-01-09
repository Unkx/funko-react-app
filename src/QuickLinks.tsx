
// import React from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { quickLinksTranslations } from './Translations/QuickLinksTranslations';

// interface QuickLinksProps {
//   isDarkMode?: boolean;
//   language?: keyof typeof quickLinksTranslations;
// }

// const QuickLinks: React.FC<QuickLinksProps> = ({
//   isDarkMode = false,
//   language = 'EN'
// }) => {
//   const location = useLocation();
//   const currentPath = location.pathname;

//   // Pobierz tłumaczenia dla aktualnego języka
//   const t = quickLinksTranslations[language] || quickLinksTranslations.EN;

//   const links = [
//     { key: 'home', text: t.home, path: '/' },
//     { key: 'search', text: t.search, path: '/SearchSite' },
//     { key: 'mostVisited', text: t.mostVisited, path: '/mostVisited' },
//     { key: 'categories', text: t.categories, path: '/categories' },
//     { key: 'features', text: t.features, path: '/features' },
//     { key: 'about', text: t.about, path: '/about' },
//     { key: 'loginRegister', text: t.loginRegister, path: '/loginregistersite' },
//     { key: 'dashboard', text: t.dashboard, path: '/DashboardSite', requiresAuth: true },
//     { key: 'adminPanel', text: t.adminPanel, path: '/AdminSite', requiresAuth: true, isAdmin: true },
//     { key: 'adminInvites', text: t.adminInvites, path: '/admin-management', requiresAuth: true, isAdmin: true },
//     { key: 'requests', text: t.requests, path: '/requests', requiresAuth: true, isAdmin: true },
//   ];

//   // Tutaj możesz dodać logikę sprawdzania autoryzacji
//   const isAuthenticated = false; // Zastąp prawdziwą logiką
//   const isAdmin = false; // Zastąp prawdziwą logiką

//   const filteredLinks = links.filter(link => {
//     if (link.requiresAuth && !isAuthenticated) return false;
//     if (link.isAdmin && !isAdmin) return false;
//     return true;
//   });

//   // Funkcja sprawdzająca, czy link jest aktywny
//   const isActive = (path: string) => {
//     if (path === '/' && currentPath === '/') return true;
//     if (path !== '/' && currentPath.startsWith(path)) return true;
//     return false;
//   };

//   // Mapa ikon dla każdego klucza
//   const iconMap: Record<string, string> = {
//     'home': '🏠',
//     'search': '🔍',
//     'mostVisited': '🔥',
//     'categories': '📂',
//     'features': '⭐',
//     'about': 'ℹ️',
//     'loginRegister': '👤',
//     'dashboard': '📊',
//     'adminPanel': '⚙️',
//     'adminInvites': '📨',
//     'requests': '📋',
//   };

//   // Funkcja do skracania tekstu na mobile
//   const getDisplayText = (key: string, text: string, isMobile: boolean) => {
//     if (!isMobile) return text;
//     return iconMap[key] || text.substring(0, 3);
//   };

//   return (
//     <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} shadow-md sticky top-0 z-40 border-b ${isDarkMode ? 'border-gray-700' : 'border-blue-200'}`}>
//       <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
//         <nav className="py-1.5">
//           <ul className="flex items-center justify-start md:justify-center gap-1 sm:gap-1.5 md:gap-3 overflow-x-auto py-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//             {filteredLinks.map((link, index) => {
//               const active = isActive(link.path);

//               return (
//                 <li key={index} className="flex-shrink-0">
//                   <Link
//                     to={link.path}
//                     className={`flex items-center justify-center text-xs sm:text-sm font-medium px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-1.5 rounded-full transition-all duration-200 min-w-[44px] md:min-w-0
//                       ${active
//                         ? isDarkMode
//                           ? 'bg-yellow-400 text-gray-900 font-semibold shadow'
//                           : 'bg-blue-600 text-white font-semibold shadow'
//                         : isDarkMode
//                           ? 'text-yellow-400 hover:bg-gray-700 hover:text-yellow-300'
//                           : 'text-blue-600 hover:bg-blue-200 hover:text-blue-800'
//                       }`}
//                     title={link.text}
//                   >
//                     {/* Tekst na desktop, ikony na mobile */}
//                     <span className="hidden md:inline">{link.text}</span>
//                     <span className="md:hidden">
//                       {getDisplayText(link.key, link.text, true)}
//                     </span>
//                   </Link>
//                 </li>
//               );
//             })}
//           </ul>
//         </nav>
//       </div>
//     </div>
//   );
// };

// export default QuickLinks;


import React from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
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

  // FUNKCJA DO OBSŁUGI KLIKNIĘCIA LINKU UŻYTKOWNIKA
  const handleUserLinkClick = (e: React.MouseEvent, path: string) => {
    if (!isAuthenticated && path === '/loginregistersite') {
      // Jeśli nie zalogowany i klikamy login/register
      if (onLoginClick) {
        e.preventDefault();
        onLoginClick();
      }
    } else if (isAuthenticated && path === '/DashboardSite') {
      // Jeśli zalogowany i klikamy dashboard
      if (onDashboardClick) {
        e.preventDefault();
        onDashboardClick();
      }
    }
    // W przeciwnym razie standardowa nawigacja Link
  };

  // GENERUJ LINKI Z UWZGLĘDNIENIEM STATUSU UŻYTKOWNIKA
  const getLinks = () => {
    const baseLinks = [
      { key: 'home', text: t.home, path: '/' },
      { key: 'search', text: t.search, path: '/SearchSite' },
      { key: 'mostVisited', text: t.mostVisited, path: '/mostVisited' },
      { key: 'categories', text: t.categories, path: '/categories' },
      { key: 'features', text: t.features, path: '/features' },
      { key: 'about', text: t.about, path: '/about' },
    ];

    // DYNAMICZNY LINK UŻYTKOWNIKA
    const userLink = isAuthenticated 
      ? { 
          key: 'dashboard', 
          text: userName ? `${t.dashboard} (${userName})` : t.dashboard, 
          path: '/DashboardSite',
          requiresAuth: true
        }
      : { 
          key: 'loginRegister', 
          text: t.loginRegister, 
          path: '/loginregistersite',
          requiresAuth: false
        };

    // LINKI ADMINISTRACYJNE (TYLKO DLA ADMINÓW)
    const adminLinks = isAuthenticated && isAdmin ? [
      { key: 'adminPanel', text: t.adminPanel, path: '/AdminSite', requiresAuth: true, isAdmin: true },
      { key: 'adminInvites', text: t.adminInvites, path: '/admin-management', requiresAuth: true, isAdmin: true },
      { key: 'requests', text: t.requests, path: '/requests', requiresAuth: true, isAdmin: true },
    ] : [];

    // LINKI DLA ZALOGOWANYCH UŻYTKOWNIKÓW (OPCJONALNIE)
    const userOnlyLinks = isAuthenticated ? [
      // Możesz dodać dodatkowe linki tylko dla zalogowanych
      // { key: 'profile', text: t.profile, path: '/profile', requiresAuth: true },
    ] : [];

    return [...baseLinks, userLink, ...userOnlyLinks, ...adminLinks];
  };

  const links = getLinks();

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  // IKONY DLA MOBILE
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="py-2">
          <ul className="flex items-center justify-start md:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-1">
            {links.map((link) => {
              const active = isActive(link.path);
              
              return (
                <li key={link.key} className="flex-shrink-0">
                  <Link
                    to={link.path}
                    onClick={(e) => handleUserLinkClick(e, link.path)}
                    className={`
                      flex items-center justify-center 
                      text-xs sm:text-sm font-medium 
                      px-2 sm:px-3 py-1.5 sm:py-2 
                      rounded-full transition-all duration-200 
                      min-w-[44px] md:min-w-[60px]
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
                    {/* DESKTOP: TEKST */}
                    <span className="hidden md:inline whitespace-nowrap">
                      {link.text}
                    </span>
                    
                    {/* MOBILE: IKONA */}
                    <span className="inline md:hidden text-base">
                      {getMobileIcon(link.key)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default QuickLinks;
