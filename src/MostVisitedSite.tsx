// src/pages/MostVisitedSite.tsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsMostVisitedSite";
import Layout from './Layout';
import { useTheme } from './ThemeContext';
import { LanguageContext } from './LanguageContext';

// Match your backend item shape (without visits)
interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

// Extended with visits (client-only)
interface FunkoItemWithVisits extends FunkoItem {
  visits: number;
}


const MostVisitedSite: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { language } = useContext(LanguageContext);

  const [allItems, setAllItems] = useState<FunkoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"visits" | "title" | "category">("visits");
  const [visitCountVersion, setVisitCountVersion] = useState(0);

  const t = translations[language] || translations["EN"];

  const navigate = useNavigate();
  
  // Fetch all items from your backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json");
        if (!response.ok) throw new Error("Failed to fetch items");
        const items: FunkoItem[] = await response.json();
        
        // Generate IDs for items (same logic as WelcomeSite)
        const itemsWithIds = items.map(item => ({
          ...item,
          id: generateItemId(item.title, item.number)
        }));
        
        setAllItems(itemsWithIds);
      } catch (err) {
        console.error("Error loading items:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Track localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setVisitCountVersion(prev => prev + 1);
    };
  
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom funkoVisitUpdated event (from same tab)
    window.addEventListener('funkoVisitUpdated', handleStorageChange);

    // Also refresh on focus (when user returns to this tab)
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('funkoVisitUpdated', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);
  
  // Auto-logout after 10 minutes of inactivity — only if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Only activate auto-logout if user is authenticated
    if (!token || !user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000); // 10 minutes
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate]);

  // Helper function to generate consistent item IDs
  const generateItemId = (title: string, number: string): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };
  
  // ✅ Compute visited items from localStorage
  const mostVisitedItems = useMemo(() => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    return allItems
      .map(item => ({
        ...item,
        visits: visitCount[item.id] || 0,
      }))
      .filter((item): item is FunkoItemWithVisits => item.visits > 0 && !!item.imageName);
  }, [allItems, visitCountVersion]);

  const sortedItems = useMemo(() => {
    return [...mostVisitedItems].sort((a, b) => {
      switch (sortBy) {
        case "visits": return b.visits - a.visits;
        case "title": return a.title.localeCompare(b.title);
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
  }, [mostVisitedItems, sortBy]);

  // Get translated popularity badges
  const getPopularityBadge = (visits: number) => {
    if (visits >= 20) return { text: t.veryPopular || "🔥 Very Popular", color: "bg-red-500" };
    if (visits >= 10) return { text: t.popular || "⭐ Popular", color: "bg-orange-500" };
    if (visits >= 5) return { text: t.trending || "📈 Trending", color: "bg-blue-500" };
    return { text: t.gettingViews || "👀 Getting views", color: "bg-green-500" };
  };

  // ✅ Track item clicks - tylko zwiększ licznik, jeśli nie był dzisiaj kliknięty
  const handleItemClick = (id: string) => {
    // Sprawdź czy już dzisiaj kliknięto ten przedmiot
    const today = new Date().toDateString();
    const dailyClickKey = `daily_click_${id}_${today}`;
    const alreadyClickedToday = localStorage.getItem(dailyClickKey);
    
    // Jeśli jeszcze dzisiaj nie kliknięto, zwiększ licznik
    if (!alreadyClickedToday) {
      const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
      visitCount[id] = (visitCount[id] || 0) + 1;
      localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
      
      // Zapisz że dzisiaj już kliknięto
      localStorage.setItem(dailyClickKey, "true");
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('funkoVisitUpdated'));
      
      // Usuń dzienne kliki po północy (opcjonalnie)
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight.getTime() - Date.now();
      
      setTimeout(() => {
        localStorage.removeItem(dailyClickKey);
      }, timeUntilMidnight);
    }
    
    // Log dla debugowania
    console.log("Item clicked:", id, "Already clicked today:", alreadyClickedToday);
  };

  // Dodaj także funkcję synchronizującą z FunkoDetails
  const syncVisitWithFunkoDetails = (id: string) => {
    // Ta sama logika co w FunkoDetails
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    const currentCount = visitCount[id] || 0;
    
    // Zwiększ tylko jeśli różne komponenty nie zwiększyły już dzisiaj
    const today = new Date().toDateString();
    const globalClickKey = `global_click_${id}_${today}`;
    
    if (!localStorage.getItem(globalClickKey)) {
      visitCount[id] = currentCount + 1;
      localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
      localStorage.setItem(globalClickKey, "true");
      
      // Ustaw wygaśnięcie na północ
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight.getTime() - Date.now();
      
      setTimeout(() => {
        localStorage.removeItem(globalClickKey);
      }, timeUntilMidnight);
    }
  };

  // Dodaj efekt który synchronizuje z innymi stronami
  useEffect(() => {
    // Nasłuchuj zdarzeń z innych komponentów
    const handleGlobalVisit = (e: CustomEvent) => {
      if (e.detail && e.detail.id) {
        setVisitCountVersion(prev => prev + 1);
      }
    };

    window.addEventListener('globalFunkoVisit', handleGlobalVisit as EventListener);

    return () => {
      window.removeEventListener('globalFunkoVisit', handleGlobalVisit as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-slate-900 text-white" : "bg-neutral-400 text-black"
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <Layout translations={t}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t.mostVisited || "Most Visited Items"}</h1>
          <p className="text-lg opacity-80">
            {mostVisitedItems.length === 0 
              ? t.noVisitsYet || "No items have been visited yet. Start browsing!"
              : t.discoverPopularItems?.replace("{count}", mostVisitedItems.length.toString()) || `Discover the ${mostVisitedItems.length} most popular Funko Pops in the community`
            }
          </p>
        </div>

        {mostVisitedItems.length > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 rounded-lg ${
            isDarkMode ? "bg-slate-800" : "bg-white"
          }`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{mostVisitedItems.length}</div>
              <div className="text-sm">{t.totalVisited || "Total Visited Items"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Math.max(...mostVisitedItems.map(item => item.visits))}
              </div>
              <div className="text-sm">{t.mostViews || "Most Views on Single Item"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(mostVisitedItems.reduce((sum, item) => sum + item.visits, 0) / mostVisitedItems.length)}
              </div>
              <div className="text-sm">{t.averageViews || "Average Views per Item"}</div>
            </div>
          </div>
        )}

        {mostVisitedItems.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span>{t.sortBy || "Sort by"}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "visits" | "title" | "category")}
                className={`px-3 py-2 rounded border ${
                  isDarkMode 
                    ? "bg-slate-800 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-black"
                }`}
              >
                <option value="visits">{t.mostVisited || "Most Visited"}</option>
                <option value="title">{t.title || "Title"}</option>
              </select>
            </div>
            <div className="text-sm opacity-75">
              {t.showing?.replace("{count}", mostVisitedItems.length.toString()) || `Showing ${mostVisitedItems.length} items`}
            </div>
          </div>
        )}

        {mostVisitedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-4">{t.noVisitsTitle || "No Visits Yet"}</h2>
            <p className="text-lg mb-6 max-w-md mx-auto">
              {t.noVisitsDescription || "Start browsing Funko Pops to build your most visited list. Items you view will appear here!"}
            </p>
            <Link
              to="/categories"
              className={`inline-block px-6 py-3 rounded-lg font-bold ${
                isDarkMode 
                  ? "bg-amber-400 text-black hover:bg-amber-500" 
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {t.browseCategories || "Browse Categories"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item, index) => {
              const popularity = getPopularityBadge(item.visits);
              return (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg relative ${
                    isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-white hover:bg-gray-100"
                  } shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
                >
                  {sortBy === "visits" && index < 3 && (
                    <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? "bg-amber-400" : 
                      index === 1 ? "bg-gray-400" : 
                      "bg-orange-500"
                    }`}>
                      #{index + 1}
                    </div>
                  )}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded text-xs text-white ${popularity.color}`}>
                    {popularity.text}
                  </div>
                  
                  <img
                    src={item.imageName || "/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/placeholder.png";
                    }}
                  />
                  
                  <h3 className="font-bold text-lg mb-2 text-center">{item.title}</h3>
                  <div className="text-center mb-2">
                    <span className="text-sm opacity-75">#{item.number}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm opacity-75">{item.category}</span>
                  </div>
                  {item.series.length > 0 && (
                    <p className="text-sm text-center mb-2 opacity-75">
                      {item.series.join(", ")}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">👁️</span>
                      <span className="font-bold">{item.visits}</span>
                      <span className="text-xs opacity-75">{t.views || "views"}</span>
                    </div>
                    {item.exclusive && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-amber-500" : "bg-green-600"
                      } text-white`}>
                        {t.exclusive || "Exclusive"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {mostVisitedItems.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/categories"
              className={`inline-block px-6 py-3 rounded-lg font-bold ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700" 
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              {t.browseAllItems?.replace("{count}", allItems.length.toString()) || `Browse All Items (${allItems.length})`}
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MostVisitedSite;