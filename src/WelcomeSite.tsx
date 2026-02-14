// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { translations } from "./Translations/TranslationsWelcomeSite";
// import { useMemo } from "react";
// import useBreakpoints from "./useBreakpoints";

// import "./WelcomeSite.css";
// import MoonIcon from "/src/assets/moon.svg?react";
// import SunIcon from "/src/assets/sun.svg?react";
// import SearchIcon from "/src/assets/search.svg?react";
// import GlobeIcon from "/src/assets/globe.svg?react";
// import ChevronDownIcon from "/src/assets/chevron-down.svg?react";
// import QuickLinks from "./QuickLinks";

// // Flags
// import UKFlag from "/src/assets/flags/uk.svg?react";
// import USAFlag from "/src/assets/flags/usa.svg?react";
// import PolandFlag from "/src/assets/flags/poland.svg?react";
// import RussiaFlag from "/src/assets/flags/russia.svg?react";
// import FranceFlag from "/src/assets/flags/france.svg?react";
// import GermanyFlag from "/src/assets/flags/germany.svg?react";
// import SpainFlag from "/src/assets/flags/spain.svg?react";
// import CanadaFlag from "/src/assets/flags/canada.svg?react";

// // Map import
// import WorldMap from "./Maps/WorldMap"; // ✅ Import map

// interface FunkoItem {
//   title: string;
//   number: string;
//   series: string[];
//   exclusive: boolean;
//   imageName: string;
// }

// interface FunkoItemWithId extends FunkoItem {
//   id: string;
// }

// // 📚 Language display names
// const languageNames = {
//   EN: "English",
//   PL: "Polski",
//   RU: "Русский",
//   FR: "Français",
//   DE: "Deutsch",
//   ES: "Español",
// };

// // 🔢 Generate unique ID for Funko items
// const generateId = (title: string, number: string): string => {
//   const safeTitle = title?.trim() || "";
//   const safeNumber = number?.trim() || "";
  
//   // Combine title and number
//   const combined = `${safeTitle}-${safeNumber}`;
  
//   // Clean and normalize
//   return combined
//     .replace(/[^\w\s-]/g, '')  // Remove special characters except word chars, spaces, hyphens
//     .replace(/\s+/g, '-')       // Replace spaces with hyphens
//     .toLowerCase()              // Convert to lowercase
//     .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
//     .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
// };
// const WelcomeSite: React.FC = () => {
//   // ✅ MOVED: All state declarations inside the component
//   const { isMobile, isTablet, isDesktop } = useBreakpoints();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isDarkMode, setIsDarkMode] = useState(() => {
//     const saved = localStorage.getItem("preferredTheme");
//     return saved ? saved === "dark" : true;
//   });
//   const [selectedCountry, setSelectedCountry] = useState<string>("USA");
//   const [language, setLanguage] = useState(() => {
//     return localStorage.getItem("preferredLanguage") || "EN";
//   });
//   const [region, setRegion] = useState<string>("North America");
//   const [showCountryDropdown, setShowCountryDropdown] = useState(false);
//   const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
//   const [shouldShowPopup, setShouldShowPopup] = useState(false);
//   const [funkoData, setFunkoData] = useState<FunkoItemWithId[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showWorldMapFirstTime, setShowWorldMapFirstTime] = useState(false);

//   const navigate = useNavigate();

//   useEffect(() => {
//     localStorage.setItem("preferredLanguage", language);
//   }, [language]);

//   const t = translations[language] || translations["EN"];

//   // Refs for dropdowns
//   const countrylanguageDropdownRef = useRef<HTMLDivElement>(null);
//   const countryButtonRef = useRef<HTMLButtonElement>(null);
//   const languageDropdownRef = useRef<HTMLDivElement>(null);
//   const languageButtonRef = useRef<HTMLButtonElement>(null);

//   // Toggle language dropdown
//   const toggleLanguageDropdown = () => {
//     setShowLanguageDropdown((prev) => !prev);
//   };

//   // 💬 Chatbot state
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
//   const [inputValue, setInputValue] = useState("");
//   const chatContainerRef = useRef<HTMLDivElement>(null);

//   // 💬 Smart bot response logic (enhanced)
//   const getBotResponse = (userInput: string): { text: string; buttons?: Array<{ label: string; action: () => void }> } => {
//     const lower = userInput.toLowerCase().trim();

//     // Greetings
//     if (/^(hi|hello|hey|howdy)/i.test(lower)) {
//       return {
//         text: t.chatGreeting || "Hi there! 😊 I'm PopBot! Ask me to search, browse categories, or find popular items!",
//         buttons: [
//           { label: t.buttonDashboard || "Take me to the dashboard!", action: () => navigate("/dashboardSite") },
//           { label: t.buttonLogin || "Take me to the login page", action: () => navigate("/loginRegisterSite") },
//           { label: t.buttonSearch || "Search for something", action: () => {
//             setIsChatOpen(false);
//             navigate("/searchsite");
//           } }
//         ]
//       };
//     }

//     // Help
//     if (/(help|what can you do)/i.test(lower)) {
//       return {
//         text: t.chatHelp || "I can help you:\n• Search for any Funko Pop\n• Go to Dashboard or Login\n• Browse Categories\n• Find Popular Items",
//         buttons: [
//           { label: t.buttonDashboard || "Go to Dashboard", action: () => navigate("/dashboardSite") },
//           { label: t.buttonLogin || "Login/Register", action: () => navigate("/loginRegisterSite") },
//           { label: t.buttonCategories || "Browse Categories", action: () => navigate("/categories") },
//           { label: t.buttonPopular || "See Most Visited", action: () => navigate("/mostVisited") }
//         ]
//       };
//     }

//     // Search intent
//     const searchMatch = lower.match(/(?:search|find|show me|look for)\s+(?:for\s+)?(.+)/i);
//     if (searchMatch) {
//       const query = searchMatch[1].trim();
//       if (query) {
//         navigate(`/searchsite?q=${encodeURIComponent(query)}`);
//         setIsChatOpen(false);
//         return {
//           text: t.chatSearching?.replace("{query}", query) || `Searching for "${query}"...`,
//           buttons: []
//         };
//       }
//     }

//     // Dashboard
//     if (/(dashboard|admin|profile|account)/i.test(lower)) {
//       navigate("/dashboardSite");
//       setIsChatOpen(false);
//       return {
//         text: t.chatGoingToDashboard || "Taking you to your dashboard!",
//         buttons: []
//       };
//     }

//     // Login/Register
//     if (/(login|register|sign in|sign up)/i.test(lower)) {
//       navigate("/loginRegisterSite");
//       setIsChatOpen(false);
//       return {
//         text: t.chatGoingToLogin || "Taking you to the login page!",
//         buttons: []
//       };
//     }

//     // Categories
//     if (/(category|browse|list|show.*categories)/i.test(lower)) {
//       navigate("/categories");
//       setIsChatOpen(false);
//       return {
//         text: t.chatGoingToCategories || "Taking you to categories!",
//         buttons: []
//       };
//     }

//     // Most visited / popular
//     if (/(popular|most visited|trending|hot)/i.test(lower)) {
//       navigate("/mostVisited");
//       setIsChatOpen(false);
//       return {
//         text: t.chatGoingToPopular || "Showing the most popular Funko Pops!",
//         buttons: []
//       };
//     }

//     // Exclusive items
//     if (/(exclusive|limited|special)/i.test(lower)) {
//       const exclusives = funkoData.filter(item => item.exclusive);
//       if (exclusives.length > 0) {
//         const sample = exclusives.slice(0, 2).map(i => i.title).join(", ");
//         return {
//           text: t.chatExclusivesFound?.replace("{count}", exclusives.length.toString()).replace("{examples}", sample) ||
//               `I found ${exclusives.length} exclusive Pops! Examples: ${sample}. View them in search.`,
//           buttons: [
//             { label: t.buttonSearchExclusives || "Show All Exclusives", action: () => {
//               setIsChatOpen(false);
//               navigate("/searchsite?q=exclusive");
//             } }
//           ]
//         };
//       }
//       return {
//         text: t.chatNoExclusives || "No exclusive items found right now.",
//         buttons: []
//       };
//     }

//     // Item-specific search (e.g., "Open the rapunzel funko")
//     const itemNameMatch = lower.match(/(?:open|show me|find|search for)\s+(.+?)(?:\s+funko|\s+pop|$)/i);
//     if (itemNameMatch) {
//       const itemName = itemNameMatch[1].trim();
//       if (itemName) {
//         // Try to find exact match first
//         const exactMatch = funkoData.find(item =>
//           item.title.toLowerCase().includes(itemName.toLowerCase())
//         );
//         if (exactMatch) {
//           navigate(`/funko/${exactMatch.id}`);
//           setIsChatOpen(false);
//           return {
//             text: t.chatFoundItem?.replace("{item}", itemName) || `Found "${itemName}"! Taking you there...`,
//             buttons: []
//           };
//         }

//         // Fallback: search for it
//         navigate(`/searchsite?q=${encodeURIComponent(itemName)}`);
//         setIsChatOpen(false);
//         return {
//           text: t.chatSearching?.replace("{query}", itemName) || `Searching for "${itemName}"...`,
//           buttons: []
//         };
//       }
//     }

//     // Default fallback
//     return {
//       text: t.chatFallback || "I can help you search, browse categories, or find popular Funko Pops! Try saying \"Search for Batman\" or \"Take me to dashboard\".",
//       buttons: [
//         { label: t.buttonDashboard || "Take me to dashboard", action: () => navigate("/dashboardSite") },
//         { label: t.buttonLogin || "Login/Register", action: () => navigate("/loginRegisterSite") },
//         { label: t.buttonSearch || "Search for something", action: () => {
//           setIsChatOpen(false);
//           navigate("/searchsite");
//         } }
//       ]
//     };
//   };

//   // 🌐 Centralized country configuration
//   const countries = {
//     USA: {
//       name: "USA",
//       flag: <USAFlag className="w-5 h-5" />,
//       region: "North America",
//       language: "EN",
//     },
//     CA: {
//       name: "Canada",
//       flag: <CanadaFlag className="w-5 h-5" />,
//       region: "North America",
//       language : "EN",
//     },
//     UK: {
//       name: "UK",
//       flag: <UKFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "EN",
//     },
//     PL: {
//       name: "Poland",
//       flag: <PolandFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "PL",
//     },
//     RU: {
//       name: "Russia",
//       flag: <RussiaFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "RU",
//     },
//     FR: {
//       name: "France",
//       flag: <FranceFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "FR",
//     },
//     DE: {
//       name: "Germany",
//       flag: <GermanyFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "DE",
//     },
//     ES: {
//       name: "Spain",
//       flag: <SpainFlag className="w-5 h-5" />,
//       region: "Europe",
//       language: "ES",
//     },
//   };

//   // 🌍 Languages for dropdown (with flag)
//   const languages = {
//     US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
//     EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
//     CA: { name: "Canada", flag: <CanadaFlag className="w-5 h-5" /> },
//     PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
//     RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
//     FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
//     DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
//     ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
//   };

//   // 🌐 Detect country from browser language
//   const detectCountryFromLocale = (locale: string): string | null => {
//     const map: Record<string, string> = {
//       us: "USA",
//       "en-US": "USA",
//       en:"UK",
//       "en-GB": "UK",
//       pl: "PL",
//       "pl-PL": "PL",
//       ru: "RU",
//       "ru-RU": "RU",
//       fr: "FR",
//       "fr-FR": "FR",
//       de: "DE",
//       "de-DE": "DE",
//       es: "ES",
//       "es-ES": "ES",
//     };
//     return map[locale] || map[locale.split("-")[0]] || null;
//   };

//   // 🧩 Initial setup: load preferences or detect locale
//   useEffect(() => {
//   const savedLang = localStorage.getItem("preferredLanguage");
//   const savedCountry = localStorage.getItem("preferredCountry");

//   // Jeśli użytkownik ma zapisany język → użyj go
//   if (savedLang) {
//     setLanguage(savedLang);
//   }

//   // Jeśli ma zapisany kraj → ustaw region i kraj
//   const countryData = savedCountry && countries[savedCountry as keyof typeof countries]
//     ? countries[savedCountry as keyof typeof countries]
//     : null;

//   if (countryData && savedCountry) {
//     setSelectedCountry(savedCountry);
//     if (!savedLang) setLanguage(countryData.language); // tylko jeśli język nie był ustawiony wcześniej
//     setRegion(countryData.region);
//   } else {
//     // Automatyczne wykrycie z przeglądarki
//     const detected = detectCountryFromLocale(navigator.language);
//     const detectedData = detected ? countries[detected as keyof typeof countries] : null;
//     if (detectedData && detected) {
//       setSelectedCountry(detected);
//       if (!savedLang) setLanguage(detectedData.language);
//       setRegion(detectedData.region);
//     }
//   }
  

//   // Reszta logiki (popup, mapa, motyw)
//   const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
//   if (!hasSeenPopup) {
//     setShouldShowPopup(true);
//     localStorage.setItem("hasSeenLanguagePopup", "true");
//   }

//   if (isDarkMode) document.documentElement.classList.add("dark");
//   else document.documentElement.classList.remove("dark");

//   const hasSeenMap = localStorage.getItem("hasSeenWorldMap");
//   if (!hasSeenMap) {
//     setShowWorldMapFirstTime(true);
//     localStorage.setItem("hasSeenWorldMap", "true");
//   }
// }, [isDarkMode]);

// const incrementVisitCount = (id: string) => {
//   const today = new Date().toDateString();
//   const globalClickKey = `global_click_${id}_${today}`;
  
//   // Sprawdź czy już dzisiaj zwiększono licznik
//   if (!localStorage.getItem(globalClickKey)) {
//     const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
//     visitCount[id] = (visitCount[id] || 0) + 1;
//     localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
//     localStorage.setItem(globalClickKey, "true");
    
//     // Poinformuj inne komponenty
//     window.dispatchEvent(new CustomEvent('funkoVisitUpdated'));
//     window.dispatchEvent(new CustomEvent('globalFunkoVisit', { detail: { id } }));
    
//     // Ustaw wygaśnięcie na północ
//     const midnight = new Date();
//     midnight.setHours(24, 0, 0, 0);
//     const timeUntilMidnight = midnight.getTime() - Date.now();
    
//     setTimeout(() => {
//       localStorage.removeItem(globalClickKey);
//     }, timeUntilMidnight);
    
//     return true;
//   }
//   return false;
// };

//   // 🌙 Theme sync
//   useEffect(() => {
//       localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
//       if (isDarkMode) {
//         document.documentElement.classList.add("dark");
//       } else {
//         document.documentElement.classList.remove("dark");
//       }
//   }, [isDarkMode]);

//   // 📥 Fetch Funko data


//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true);
        
//         // Try to fetch from backend first
//         const token = localStorage.getItem("token");
        
//         if (token) {
//           try {
//             const backendResponse = await fetch("http://localhost:5000/api/items?limit=30", {
//               headers: {
//                 "Authorization": `Bearer ${token}`
//               }
//             });
            
//             if (backendResponse.ok) {
//               const backendData = await backendResponse.json();
              
//               // Only use backend data if it has items
//               if (backendData && backendData.length > 0) {
//                 const dataWithIds = backendData.map((item: any) => ({
//                   ...item,
//                   // Use the ID from database, but ensure consistency
//                   id: item.id || generateId(item.title, item.number),
//                   series: Array.isArray(item.series) ? item.series : 
//                         (typeof item.series === 'string' ? JSON.parse(item.series) : [])
//                 }));
                
//                 console.log("✅ Loaded items from database:", dataWithIds.length);
//                 setFunkoData(dataWithIds);
//                 setIsLoading(false);
//                 return; // Success! Exit here
//               }
//             }
//           } catch (backendErr) {
//             console.warn("⚠️ Backend unavailable, using external data");
//           }
//         }
        
//         // Fallback: Fetch from external JSON
//         console.log("📡 Fetching from external JSON...");
//         const response = await fetch(
//           "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
//         );
//         if (!response.ok) throw new Error("Failed to fetch data");
//         const rawData: FunkoItem[] = await response.json();
        
//         const dataWithIds = rawData.map((item) => ({
//           ...item,
//           id: generateId(item.title, item.number),
//         }));
        
//         console.log("✅ Loaded items from external JSON:", dataWithIds.length);
//         setFunkoData(dataWithIds);
        
//       } catch (err) {
//         console.error("Error loading Funko data:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//     // Auto-logout after 10 minutes of inactivity
//   useEffect(() => {
//     let timer: NodeJS.Timeout;

//     const resetTimer = () => {
//       if (timer) clearTimeout(timer);
//       timer = setTimeout(() => {
//         // Perform logout
//         localStorage.removeItem("user");
//         localStorage.removeItem("token");
//         navigate("/loginregistersite");
//       }, 10 * 60 * 1000); // 10 minutes = 600,000 ms
//     };

//     // Initial setup
//     resetTimer();

//     // List of events to consider as "user activity"
//     const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];

//     // Attach event listeners
//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer, true);
//     });

//     // Cleanup on unmount
//     return () => {
//       clearTimeout(timer);
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer, true);
//       });
//     };
//   }, [navigate]);

//   // 🎲 Get 3 random items
//   const getRandomItems = (): FunkoItemWithId[] => {
//     if (funkoData.length === 0) return [];
//     const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
//     return shuffled.slice(0, 3);
//   };

//   // 🔥 Get most visited items
//   const getMostVisitedItems = (): FunkoItemWithId[] => {
//     const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
//     return [...funkoData]
//       .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
//       .sort((a, b) => b.visits - a.visits)
//       .filter((item) => item.visits > 0)
//       .slice(0, 3);
//   };

//   // 🌍 Handle country selection
//   const handleCountryChange = (countryCode: string) => {
//     const countryData = countries[countryCode as keyof typeof countries];
//     if (countryData) {
//       setSelectedCountry(countryCode);
//       setLanguage(countryData.language);
//       setRegion(countryData.region);
//       localStorage.setItem("preferredCountry", countryCode);
//       localStorage.setItem("preferredLanguage", countryData.language);
//       setShowCountryDropdown(false);
//     }
//   };

//   // 🗺️ Handle map click
//   const handleMapCountryClick = (mapCode: string) => {
//     const codeMap: Record<string, string> = {
//       US: "USA",
//       GB: "UK",
//       DE: "DE",
//       FR: "FR",
//       PL: "PL",
//       RU: "RU",
//       ES: "ES",
//       CA: "USA", // Canada → North America
//     };
//     const appCode = codeMap[mapCode];
//     if (appCode) handleCountryChange(appCode);
//   };

//   // 🔍 Handle search
//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
//   };

//   // 👁️ Track item visits
//   const handleItemClick = (id: string) => {
//     const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
//     visitCount[id] = (visitCount[id] || 0) + 1;
//     localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
//   };

//   // 🌙 Toggle theme
//   const toggleTheme = () => setIsDarkMode((prev) => !prev);

//   // Select language
//   const selectLanguage = (lang: string) => {
//     setLanguage(lang);
//     localStorage.setItem("preferredLanguage", lang);
//     setShowLanguageDropdown(false);
//   };

// // Memoize random items — only change when funkoData changes
// const randomItems = useMemo(() => {
//   if (funkoData.length === 0) return [];
//   const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, 3);
// }, [funkoData]); // Only recompute when funkoData changes

// // Memoize most visited items — recompute when funkoData or visit counts change
// const mostVisitedItems = useMemo(() => {
//   const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
//   return [...funkoData]
//     .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
//     .sort((a, b) => b.visits - a.visits)
//     .filter((item) => item.visits > 0)
//     .slice(0, 3);
// }, [funkoData]); // Note: localStorage isn't reactive, so this won't auto-update on visit

//   return (
//     <div
//       className={`welcome-site min-h-screen flex flex-col ${
//         isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"
//       }`}
//     >
//       {/* 🌍 First-Time World Map Popup */}
//       {showWorldMapFirstTime && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
//           <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full">
//             <button
//               onClick={() => setShowWorldMapFirstTime(false)}
//               className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
//               aria-label="Close map"
//             >
//               ✕
//             </button>
//             <h2 className="text-2xl font-bold mb-4 text-center">
//               {t.regionMapTitle || "Explore by Region"}
//             </h2>
//             <WorldMap
//               onSelectCountry={(code) => {
//                 handleMapCountryClick(code);
//                 setShowWorldMapFirstTime(false);
//               }}
//             />
//           </div>
//         </div>
//       )}
//       {/* 🔝 Header */}
//       <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
//         <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
//           <Link to="/" className="no-underline">
//             <h1
//               className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
//                 isDarkMode ? "text-yellow-400" : "text-blue-600"
//               }`}
//             >
//               Pop&Go!
//             </h1>
//           </Link>
//         </div>

//         {/* 🔍 Search */}
//         <form
//           onSubmit={handleSearch}
//           className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden ${
//             isDarkMode ? "bg-gray-700" : "bg-white"
//           }`}
//         >
//           <input
//             type="text"
//             placeholder={t.searchPlaceholder}
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className={`flex-grow px-4 py-2 outline-none ${
//               isDarkMode
//                 ? "bg-gray-700 text-white placeholder-gray-400"
//                 : "bg-white text-black placeholder-gray-500"
//             }`}
//             aria-label="Search for Funkos"
//           />
//           <button
//             type="submit"
//             className={`px-4 py-2 ${
//               isDarkMode
//                 ? "bg-yellow-500 hover:bg-yellow-600"
//                 : "bg-blue-600 hover:bg-blue-700"
//             } text-white`}
//             aria-label="Search"
//           >
//             <SearchIcon className="w-5 h-5" />
//           </button>
//         </form>

//         {/* 🌐 Country, 🌙 Theme, 🔐 Login */}
//           <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0 min-w-0 items-center">
//                   {/* Language Dropdown */}
//                   <div className="relative">
//                     <button
//                       ref={languageButtonRef}
//                       onClick={toggleLanguageDropdown}
//                       className={`p-2 rounded-full flex items-center gap-1 min-w-0 ${
//                         isDarkMode
//                           ? "bg-gray-700 hover:bg-gray-600"
//                           : "bg-gray-200 hover:bg-neutral-600"
//                       }`}
//                       aria-label="Select language"
//                       aria-expanded={showLanguageDropdown}
//                     >
//                       <GlobeIcon className="w-5 h-5" />
//                       <span className="hidden sm:inline text-sm font-medium">{language}</span>
//                       <ChevronDownIcon
//                         className={`w-4 h-4 transition-transform ${
//                           showLanguageDropdown ? "rotate-180" : ""
//                         }`}
//                       />
//                     </button>
        
//                     {showLanguageDropdown && (
//                           <div
//                             ref={languageDropdownRef}
//                             className={`absolute mt-2 z-50 lang-dropdown variant-b rounded-lg shadow-xl py-2 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto ${
//                               isDarkMode 
//                                 ? 'border-yellow-500 bg-gray-800' 
//                                 : 'border-blue-500 bg-white'
//                             }`}
//                             onClick={(e) => e.stopPropagation()}
//                           >
//                         {Object.entries(languages).map(([code, { name, flag }]) => (
//                           <button
//                             key={code}
//                             onClick={() => selectLanguage(code)}
//                             className={`lang-item w-full text-left px-4 py-2 flex items-center gap-2 whitespace-nowrap ${
//                               language === code
//                                 ? isDarkMode
//                                   ? "bg-yellow-500 text-black"
//                                   : "bg-green-600 text-white"
//                                 : isDarkMode
//                                 ? "hover:bg-gray-600"
//                                 : "hover:bg-neutral-500"
//                             }`}
//                           >
//                             <span className="w-5 h-5">{flag}</span>
//                             <span>{name}</span>
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
        

//           {/* 🌙 Theme Toggle */}
//           <button
//             onClick={toggleTheme}
//             className={`p-2 rounded-full ${
//               isDarkMode
//                 ? "bg-gray-700 hover:bg-gray-600"
//                 : "bg-gray-200 hover:bg-gray-600"
//             }`}
//             aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
//           >
//             {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
//           </button>

//           {/* 🔐 Dashboard/Login */}
//           <button
//             onClick={() => {
//               const user = JSON.parse(localStorage.getItem("user") || "{}");
//               navigate(user.role === "admin" ? "/adminSite" : user.role === "user" ? "/dashboardSite" : "/loginRegisterSite");
//             }}
//             className={`flex items-center gap-2 px-4 py-2 rounded ${
//               isDarkMode
//                 ? "bg-yellow-500 text-black hover:bg-yellow-600"
//                 : "bg-blue-600 text-white hover:bg-blue-700"
//             }`}
//           >
//             {t.goToDashboard || "Dashboard"}
//           </button>
//         </div>
// 	      <QuickLinks isDarkMode={isDarkMode} language={language as any} />
//       </header>

//       {/* 🧭 Main Content */}
//       <main className="flex-grow p-4 sm:p-8 flex flex-col items-center">
//         {/* 📍 Current language & region */}
//         {/* <div className={`mb-6 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
//           <p className="text-sm">
//             {languageNames[t.language] || "Unknown"} • {region}
//           </p>
//         </div> */}


//         {/* 🎲 Random Items */}
//         <section className="w-full max-w-4xl mt-10 mb-10">
//           <h2 className="text-2xl font-bold mb-4 text-center">{t.randomItems || "Random Items"}</h2>
//           {isLoading ? (
//             <div className="flex justify-center">
//               <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//               {randomItems.map((item) => (
//                 <Link
//                   key={item.id}
//                   to={`/funko/${item.id}`}
//                   onClick={() => handleItemClick(item.id)}
//                   className={`block p-4 rounded-lg ${
//                     isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
//                   } shadow transition-transform hover:scale-105`}
//                 >
//                   <img
//                     src={item.imageName || "/src/assets/placeholder.png"}
//                     alt={item.title}
//                     className="w-full h-48 object-contain rounded-md mb-3"
//                     onError={(e) => {
//                       e.currentTarget.src = "/src/assets/placeholder.png";
//                     }}
//                   />
//                   <h3 className="font-bold text-center">{item.title}</h3>
//                   <p className="text-sm text-center">
//                     #{item.number} • {item.series.join(", ")}
//                   </p>
//                   {item.exclusive && (
//                     <span
//                       className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
//                         isDarkMode ? "bg-yellow-600" : "bg-blue-600"
//                       } text-white`}
//                     >
//                       {t.exclusive || "Exclusive"}
//                     </span>
//                   )}
//                 </Link>
//               ))}
//               <Link
//                 to="/categories"
//                 className={`block p-4 rounded-lg flex items-center justify-center h-full ${
//                   isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
//                 } shadow transition-transform hover:scale-105`}
//               >
//                 <h2 className="text-xl font-bold">{t.goToCategories || "Browse Categories"}</h2>
//               </Link>
//             </div>
//           )}
//         </section>

//         {/* 🔥 Most Visited */}
//         <section className="w-full max-w-4xl">
//           <h2 className="text-2xl font-bold mb-4 text-center">{t.mostVisited || "Most Visited"}</h2>
//           {mostVisitedItems.length === 0 ? (
//             <p className="text-center text-gray-500">{t.noVisitsYet || "No items visited yet."}</p>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//               {mostVisitedItems.map((item) => (
//                 <Link
//                   key={item.id}
//                   to={`/funko/${item.id}`}
//                   onClick={() => handleItemClick(item.id)}
//                   className={`block p-4 rounded-lg ${
//                     isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
//                   } shadow transition-transform hover:scale-105`}
//                 >
//                   <img
//                     src={item.imageName || "/src/assets/placeholder.png"}
//                     alt={item.title}
//                     className="w-full h-48 object-contain rounded-md mb-3"
//                     onError={(e) => {
//                       e.currentTarget.src = "/src/assets/placeholder.png";
//                     }}
//                   />
//                   <h3 className="font-bold text-center">{item.title}</h3>
//                   <p className="text-sm text-center">
//                     #{item.number} • {item.series.join(", ")}
//                   </p>
//                   {item.exclusive && (
//                     <span
//                       className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
//                         isDarkMode ? "bg-yellow-600" : "bg-blue-600"
//                       } text-white`}
//                     >
//                       {t.exclusive || "Exclusive"}
//                     </span>
//                   )}
//                 </Link>
//               ))}
//               <Link
//                 to="/mostVisited"
//                 className={`block p-4 rounded-lg flex items-center justify-center h-full ${
//                   isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
//                 } shadow transition-transform hover:scale-105`}
//               >
//                 <h2 className="text-xl font-bold">{t.goToMostVisited || "View All Popular"}</h2>
//               </Link>
//             </div>
//           )}
//         </section>
        

//         {/* 💬 Enhanced Chatbot */}
//         {isChatOpen && (
//           <div 
//             className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
//             onClick={() => setIsChatOpen(false)}
//           >
//             <div 
//               className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col h-[70vh] max-h-[600px] border border-gray-300 dark:border-gray-600"
//               onClick={(e) => e.stopPropagation()}
//             >
//               {/* Header */}
//               <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-yellow-500 dark:to-amber-500 text-white font-bold rounded-t-xl flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <span>🤖 PopBot</span>
//                   <span className="text-xs opacity-90">Your Funko Assistant</span>
//                 </div>
//                 <button
//                   onClick={() => setIsChatOpen(false)}
//                   className="text-white hover:text-gray-200 text-xl transition-colors"
//                   aria-label="Close chat"
//                 >
//                   ✕
//                 </button>
//               </div>

//               {/* Messages */}
//               <div 
//                 ref={chatContainerRef}
//                 className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900"
//               >
//                 {messages.length === 0 ? (
//                   <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
//                     {t.chatWelcome || "Hello! Ask me anything about Funko Pops. Try: \"Search for Marvel\""}
//                   </div>
//                 ) : (
//                   messages.map((msg, i) => (
//                     <div
//                       key={i}
//                       className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//                     >
//                       <div
//                         className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
//                           msg.sender === 'user'
//                             ? 'bg-blue-600 text-white rounded-br-none'
//                             : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none'
//                         }`}
//                       >
//                         {/* Text */}
//                         {typeof msg.text === 'string' ? (
//                           msg.text.split('\n').map((line, j) => (
//                             <p key={j} className={j > 0 ? "mt-1" : ""}>
//                               {line.startsWith('•') ? (
//                                 <span className="inline-block ml-2">{line}</span>
//                               ) : (
//                                 line
//                               )}
//                             </p>
//                           ))
//                         ) : (
//                           <div>{msg.text}</div>
//                         )}

//                         {/* Buttons (if any) */}
//                         {msg.buttons && msg.buttons.length > 0 && (
//                           <div className="mt-2 flex flex-col gap-2">
//                             {msg.buttons.map((btn, idx) => (
//                               <button
//                                 key={idx}
//                                 onClick={() => {
//                                   btn.action();
//                                   setIsChatOpen(false);
//                                 }}
//                                 className={`w-full text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
//                                     isDarkMode
//                                       ? "bg-yellow-500 hover:bg-yellow-600 text-black"
//                                       : "bg-blue-600 hover:bg-blue-700 text-white"
//                                   }`}
//                               >
//                                 {btn.label}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>

//               {/* Input */}
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   if (!inputValue.trim()) return;

//                   const userMsg = inputValue.trim();
//                   setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
//                   setInputValue("");

//                   setTimeout(() => {
//                     const botReply = getBotResponse(userMsg);
//                     setMessages(prev => [...prev, { ...botReply, sender: 'bot' }]);
//                   }, 600);
//                 }}
//                 className="p-3 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
//               >
//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     value={inputValue}
//                     onChange={(e) => setInputValue(e.target.value)}
//                     placeholder={t.chatPlaceholder || "Ask about Funko Pops..."}
//                     className="flex-grow px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500"
//                     aria-label="Chat input"
//                     onKeyDown={(e) => {
//                       if (e.key === 'Escape') setIsChatOpen(false);
//                     }}
//                   />
//                   <button
//                     type="submit"
//                     className={`${
//                       isDarkMode
//                         ? "bg-yellow-500 hover:bg-yellow-600 text-black"
//                         : "bg-blue-600 hover:bg-blue-700 text-white"
//                     } px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
//                   >
//                     Send
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* 🤖 Chatbot Toggle Button - Hidden when chat is open */}
//         {!isChatOpen && (
//           <button
//             onClick={() => {
//               setIsChatOpen(true);
//               if (messages.length === 0) {
//                 setMessages([
//                   { 
//                     text: t.chatWelcome || "Hello! Ask me anything about Funko Pops!", 
//                     sender: 'bot',
//                     buttons: [
//                       { label: t.buttonDashboard || "Take me to the dashboard!", action: () => navigate("/dashboardSite") },
//                       { label: t.buttonLogin || "Take me to the login page", action: () => navigate("/loginRegisterSite") },
//                       { label: t.buttonSearch || "Search for something", action: () => navigate("/searchsite") }
//                     ]
//                   }
//                 ]);
//               }
//             }}
//             className={`fixed bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 transition-all duration-300 hover:scale-110 ${
//               isDarkMode 
//                 ? "bg-yellow-500 hover:bg-yellow-600 text-black" 
//                 : "bg-blue-600 hover:bg-blue-700 text-white"
//             }`}
//             aria-label="Open chat"
//           >
//             💬
//           </button>
//         )}

//       </main>

//       {/* 📝 Footer */}
//       <footer
//         className={`text-center py-4 ${
//           isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-700"
//         }`}
//       >
//         {t.copyright}
//       </footer>
//     </div>
//   );
// };

// export default WelcomeSite ;

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsWelcomeSite";
import useBreakpoints from "./useBreakpoints";

import "./WelcomeSite.css";
import MoonIcon from "/src/assets/moon.svg?react";
import SunIcon from "/src/assets/sun.svg?react";
import SearchIcon from "/src/assets/search.svg?react";
import GlobeIcon from "/src/assets/globe.svg?react";
import ChevronDownIcon from "/src/assets/chevron-down.svg?react";

// Flags
import UKFlag from "/src/assets/flags/uk.svg?react";
import USAFlag from "/src/assets/flags/usa.svg?react";
import PolandFlag from "/src/assets/flags/poland.svg?react";
import RussiaFlag from "/src/assets/flags/russia.svg?react";
import FranceFlag from "/src/assets/flags/france.svg?react";
import GermanyFlag from "/src/assets/flags/germany.svg?react";
import SpainFlag from "/src/assets/flags/spain.svg?react";
import CanadaFlag from "/src/assets/flags/canada.svg?react";


import AuthButton from "./AuthButton";
// (lazy components declared above)

interface FunkoItem {
  title: string;
  number: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

interface FunkoItemWithId extends FunkoItem {
  id: string;
}

// 📚 Language display names
const languageNames = {
  EN: "English",
  PL: "Polski",
  RU: "Русский",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
};

// 🔢 Generate unique ID for Funko items
const generateId = (title: string, number: string): string => {
  const safeTitle = title?.trim() || "";
  const safeNumber = number?.trim() || "";

  // Combine title and number
  const combined = `${safeTitle}-${safeNumber}`;

  // Clean and normalize
  return combined
    .replace(/[^\w\s-]/g, '')  // Remove special characters except word chars, spaces, hyphens
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .toLowerCase()              // Convert to lowercase
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
};
// Lazy-load heavier components to improve initial bundle size and startup time
const QuickLinks = React.lazy(() => import('./QuickLinks'));
const WorldMap = React.lazy(() => import('./Maps/WorldMap'));

const WelcomeSite: React.FC = () => {
  // ✅ MOVED: All state declarations inside the component
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("preferredTheme");
    return saved ? saved === "dark" : true;
  });
  const [selectedCountry, setSelectedCountry] = useState<string>("USA");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("preferredLanguage") || "EN";
  });
  const [region, setRegion] = useState<string>("North America");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [funkoData, setFunkoData] = useState<FunkoItemWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorldMapFirstTime, setShowWorldMapFirstTime] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  const t = translations[language] || translations["EN"];

  // Refs for dropdowns
  const countrylanguageDropdownRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // Toggle language dropdown
  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prev) => !prev);
  };

  // Handle click outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        languageButtonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) &&
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

  // 💬 Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 💬 Smart bot response logic (ENHANCED with multilingual support)
// 💬 Smart bot response logic (ENHANCED with multilingual support)
const getBotResponse = (userInput: string): { text: string; buttons?: Array<{ label: string; action: () => void }> } => {
  const lower = userInput.toLowerCase().trim();
  const currentT = translations[language] || translations["EN"];
  
  // === MULTILINGUAL QUICK ACTIONS ===
  const quickActions = {
    // Search Batman
    'search batman': { action: 'search', query: 'batman' },
    'szukaj batmana': { action: 'search', query: 'batman' },
    'найти batman': { action: 'search', query: 'batman' },
    'chercher batman': { action: 'search', query: 'batman' },
    'suche batman': { action: 'search', query: 'batman' },
    'buscar batman': { action: 'search', query: 'batman' },
    
    // Show Categories
    'show categories': { action: 'categories' },
    'pokaż kategorie': { action: 'categories' },
    'показать категории': { action: 'categories' },
    'montrer catégories': { action: 'categories' },
    'kategorien zeigen': { action: 'categories' },
    'mostrar categorías': { action: 'categories' },
    
    // Popular
    'popular': { action: 'popular' },
    'popularne': { action: 'popular' },
    'популярные': { action: 'popular' },
    'populaire': { action: 'popular' },
    'beliebt': { action: 'popular' },
    
    // Dashboard
    'dashboard': { action: 'dashboard' },
    'panel': { action: 'dashboard' },
    'панель': { action: 'dashboard' },
    'tableau de bord': { action: 'dashboard' },
    
    // Login
    'login': { action: 'login' },
    'zaloguj': { action: 'login' },
    'войти': { action: 'login' },
    'connexion': { action: 'login' },
    'anmelden': { action: 'login' },
    'iniciar sesión': { action: 'login' }
  };

  // Check if input matches any quick action
  if (quickActions[lower]) {
    const action = quickActions[lower];
    
    // Response texts for each action in all languages
    const responseTexts = {
      search: {
        EN: `Searching for "${action.query}"...`,
        PL: `Szukam "${action.query}"...`,
        RU: `Ищу "${action.query}"...`,
        FR: `Recherche de "${action.query}"...`,
        DE: `Suche nach "${action.query}"...`,
        ES: `Buscando "${action.query}"...`
      },
      categories: {
        EN: "Going to categories...",
        PL: "Przechodzę do kategorii...",
        RU: "Перехожу к категориям...",
        FR: "Aller aux catégories...",
        DE: "Gehe zu Kategorien...",
        ES: "Yendo a categorías..."
      },
      popular: {
        EN: "Showing popular items...",
        PL: "Pokazuję popularne...",
        RU: "Показываю популярные...",
        FR: "Afficher les articles populaires...",
        DE: "Zeige beliebte Artikel...",
        ES: "Mostrando artículos populares..."
      },
      dashboard: {
        EN: "Going to dashboard...",
        PL: "Przechodzę do panelu...",
        RU: "Перехожу на панель...",
        FR: "Aller au tableau de bord...",
        DE: "Gehe zum Dashboard...",
        ES: "Yendo al panel..."
      },
      login: {
        EN: "Going to login page...",
        PL: "Przechodzę do logowania...",
        RU: "Перехожу на страницу входа...",
        FR: "Aller à la page de connexion...",
        DE: "Gehe zur Login-Seite...",
        ES: "Yendo a la página de inicio de sesión..."
      }
    };
    
    // Perform the action
    switch(action.action) {
      case 'search':
        navigate(`/searchsite?q=${encodeURIComponent(action.query)}`);
        setIsChatOpen(false);
        return {
          text: responseTexts.search[language as keyof typeof responseTexts.search] || responseTexts.search.EN,
          buttons: []
        };
        
      case 'categories':
        navigate("/categories");
        setIsChatOpen(false);
        return {
          text: responseTexts.categories[language as keyof typeof responseTexts.categories] || responseTexts.categories.EN,
          buttons: []
        };
        
      case 'popular':
        navigate("/mostVisited");
        setIsChatOpen(false);
        return {
          text: responseTexts.popular[language as keyof typeof responseTexts.popular] || responseTexts.popular.EN,
          buttons: []
        };
        
      case 'dashboard':
        navigate("/dashboardSite");
        setIsChatOpen(false);
        return {
          text: responseTexts.dashboard[language as keyof typeof responseTexts.dashboard] || responseTexts.dashboard.EN,
          buttons: []
        };
        
      case 'login':
        navigate("/loginRegisterSite");
        setIsChatOpen(false);
        return {
          text: responseTexts.login[language as keyof typeof responseTexts.login] || responseTexts.login.EN,
          buttons: []
        };
    }
  }
  
  // ========== HELPER FUNCTIONS ==========
  
  // Helper function to find search queries in multiple languages
  const extractSearchQuery = (text: string): string | null => {
    // English patterns
    const enPatterns = [
      /(?:search|find|show me|look for|find me|i want to see)\s+(?:for\s+)?(?:a\s+)?(?:the\s+)?(.+)/i,
      /(?:i'm looking for|i need|i want)\s+(?:a\s+)?(?:the\s+)?(.+)/i,
      /(.+?)(?:\s+(?:funko|pop|figure|toy))$/i
    ];
    
    // Polish patterns
    const plPatterns = [
      /(?:szukaj|znajdź|pokaż|znajdź mi|chcę zobaczyć)\s+(?:dla\s+)?(?:jakiegoś\s+)?(.+)/i,
      /(?:szukam|potrzebuję|chcę)\s+(?:jakiegoś\s+)?(.+)/i,
      /(.+?)(?:\s+(?:funkopop|figurkę|figurka))$/i
    ];
    
    // Russian patterns
    const ruPatterns = [
      /(?:найти|поиск|покажи|ищи|ищу)\s+(?:для\s+)?(.+)/i,
      /(?:я ищу|мне нужно|хочу)\s+(?:какой-то\s+)?(.+)/i
    ];
    
    // French patterns
    const frPatterns = [
      /(?:chercher|trouver|montre|recherche)\s+(?:pour\s+)?(?:un\s+)?(?:le\s+)?(.+)/i,
      /(?:je cherche|j'ai besoin|je veux)\s+(?:un\s+)?(.+)/i
    ];
    
    // German patterns
    const dePatterns = [
      /(?:suche|finde|zeig mir|suchen)\s+(?:für\s+)?(?:ein\s+)?(?:das\s+)?(.+)/i,
      /(?:ich suche|ich brauche|ich möchte)\s+(?:ein\s+)?(.+)/i
    ];
    
    // Spanish patterns
    const esPatterns = [
      /(?:buscar|encontrar|muéstrame|buscando)\s+(?:para\s+)?(?:un\s+)?(?:el\s+)?(.+)/i,
      /(?:estoy buscando|necesito|quiero)\s+(?:un\s+)?(.+)/i
    ];
    
    // Combine patterns based on current language
    let patterns = enPatterns;
    switch(language) {
      case 'PL': patterns = plPatterns; break;
      case 'RU': patterns = ruPatterns; break;
      case 'FR': patterns = frPatterns; break;
      case 'DE': patterns = dePatterns; break;
      case 'ES': patterns = esPatterns; break;
      default: patterns = enPatterns;
    }
    
    // Try all patterns
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches, check if it's just a single word/noun (like "batman")
    const words = text.split(/\s+/);
    if (words.length === 1 || words.length === 2) {
      // Check if it's not a command word
      const commandWords = [
        'hi', 'hello', 'hey', 'help', 'dashboard', 'login', 'register',
        'categories', 'popular', 'exclusive', 'search', 'find',
        'cześć', 'witaj', 'pomoc', 'kategorie', 'popularne',
        'привет', 'помощь', 'категории',
        'bonjour', 'aide', 'catégories',
        'hallo', 'hilfe', 'kategorien',
        'hola', 'ayuda', 'categorías'
      ];
      
      if (!commandWords.includes(words[0].toLowerCase())) {
        return text; // Assume it's a search query
      }
    }
    
    return null;
  };

  // Helper to check for greetings in multiple languages
  const isGreeting = (text: string): boolean => {
    const greetings = {
      EN: ['hi', 'hello', 'hey', 'howdy', 'greetings', 'good morning', 'good afternoon', 'good evening'],
      PL: ['cześć', 'witaj', 'hej', 'dzień dobry', 'siema'],
      RU: ['привет', 'здравствуйте', 'добрый день', 'хай'],
      FR: ['bonjour', 'salut', 'coucou', 'bonsoir'],
      DE: ['hallo', 'guten tag', 'servus', 'moin'],
      ES: ['hola', 'buenos días', 'buenas tardes', 'qué tal']
    };
    
    const langGreetings = greetings[language as keyof typeof greetings] || greetings.EN;
    return langGreetings.some(greet => text.toLowerCase().includes(greet));
  };

  // Helper to check for help requests
  const isHelpRequest = (text: string): boolean => {
    const helpPhrases = {
      EN: ['help', 'what can you do', 'what do you do', 'assist', 'support'],
      PL: ['pomoc', 'pomóż', 'co potrafisz', 'co umiesz'],
      RU: ['помощь', 'помоги', 'что ты умеешь'],
      FR: ['aide', 'aider', 'que peux-tu faire'],
      DE: ['hilfe', 'hilf', 'was kannst du'],
      ES: ['ayuda', 'ayudar', 'qué puedes hacer']
    };
    
    const langHelp = helpPhrases[language as keyof typeof helpPhrases] || helpPhrases.EN;
    return langHelp.some(phrase => text.toLowerCase().includes(phrase));
  };

  // Helper to check for dashboard requests
  const isDashboardRequest = (text: string): boolean => {
    const dashboardPhrases = {
      EN: ['dashboard', 'profile', 'account', 'my page', 'admin'],
      PL: ['panel', 'profil', 'konto', 'moja strona'],
      RU: ['панель', 'профиль', 'аккаунт', 'админ'],
      FR: ['tableau de bord', 'profil', 'compte'],
      DE: ['dashboard', 'profil', 'konto'],
      ES: ['panel', 'perfil', 'cuenta']
    };
    
    const langDashboard = dashboardPhrases[language as keyof typeof dashboardPhrases] || dashboardPhrases.EN;
    return langDashboard.some(phrase => text.toLowerCase().includes(phrase));
  };

  // Helper to check for login requests
  const isLoginRequest = (text: string): boolean => {
    const loginPhrases = {
      EN: ['login', 'log in', 'sign in', 'register', 'sign up', 'create account'],
      PL: ['zaloguj', 'logowanie', 'rejestracja', 'załóż konto'],
      RU: ['войти', 'логин', 'регистрация', 'зарегистрироваться'],
      FR: ['connexion', 'se connecter', 'inscription'],
      DE: ['anmelden', 'login', 'registrieren'],
      ES: ['iniciar sesión', 'registrarse', 'crear cuenta']
    };
    
    const langLogin = loginPhrases[language as keyof typeof loginPhrases] || loginPhrases.EN;
    return langLogin.some(phrase => text.toLowerCase().includes(phrase));
  };

  // Helper to check for categories requests
  const isCategoriesRequest = (text: string): boolean => {
    const categoriesPhrases = {
      EN: ['categories', 'category', 'browse', 'list', 'show categories', 'types'],
      PL: ['kategorie', 'kategoria', 'przeglądaj', 'lista', 'rodzaje'],
      RU: ['категории', 'категория', 'просмотреть', 'список'],
      FR: ['catégories', 'catégorie', 'parcourir', 'liste'],
      DE: ['kategorien', 'kategorie', 'durchsuchen', 'liste'],
      ES: ['categorías', 'categoría', 'explorar', 'lista']
    };
    
    const langCategories = categoriesPhrases[language as keyof typeof categoriesPhrases] || categoriesPhrases.EN;
    return langCategories.some(phrase => text.toLowerCase().includes(phrase));
  };

  // Helper to check for popular requests
  const isPopularRequest = (text: string): boolean => {
    const popularPhrases = {
      EN: ['popular', 'most visited', 'trending', 'hot', 'top', 'best'],
      PL: ['popularne', 'najczęściej odwiedzane', 'trendy', 'top', 'najlepsze'],
      RU: ['популярные', 'трендовые', 'топ', 'лучшие'],
      FR: ['populaire', 'tendance', 'meilleur', 'top'],
      DE: ['beliebt', 'trend', 'top', 'besten'],
      ES: ['popular', 'tendencia', 'top', 'mejor']
    };
    
    const langPopular = popularPhrases[language as keyof typeof popularPhrases] || popularPhrases.EN;
    return langPopular.some(phrase => text.toLowerCase().includes(phrase));
  };

  // Helper to check for exclusive requests
  const isExclusiveRequest = (text: string): boolean => {
    const exclusivePhrases = {
      EN: ['exclusive', 'limited', 'special edition', 'rare', 'collector'],
      PL: ['ekskluzywne', 'limitowane', 'specjalne', 'kolekcjonerskie'],
      RU: ['эксклюзивные', 'ограниченные', 'коллекционные'],
      FR: ['exclusif', 'limitée', 'édition spéciale'],
      DE: ['exklusiv', 'limitiert', 'sonderausgabe'],
      ES: ['exclusivo', 'limitado', 'edición especial']
    };
    
    const langExclusive = exclusivePhrases[language as keyof typeof exclusivePhrases] || exclusivePhrases.EN;
    return langExclusive.some(phrase => text.toLowerCase().includes(phrase));
  };

  // ========== MAIN LOGIC ==========
  
  // Greetings in multiple languages
  if (isGreeting(lower)) {
    return {
      text: currentT.chatGreeting || "Hi there! 😊 I'm PopBot! Ask me to search, browse categories, or find popular items!",
      buttons: [
        { label: currentT.buttonDashboard || "Take me to the dashboard!", action: () => navigate("/dashboardSite") },
        { label: currentT.buttonLogin || "Take me to the login page", action: () => navigate("/loginRegisterSite") },
        { label: currentT.buttonSearch || "Search for something", action: () => {
          setIsChatOpen(false);
          navigate("/searchsite");
        } }
      ]
    };
  }

  // Help in multiple languages
  if (isHelpRequest(lower)) {
    return {
      text: currentT.chatHelp || "I can help you:\n• Search for any Funko Pop\n• Go to Dashboard or Login\n• Browse Categories\n• Find Popular Items",
      buttons: [
        { label: currentT.buttonDashboard || "Go to Dashboard", action: () => navigate("/dashboardSite") },
        { label: currentT.buttonLogin || "Login/Register", action: () => navigate("/loginRegisterSite") },
        { label: currentT.buttonCategories || "Browse Categories", action: () => navigate("/categories") },
        { label: currentT.buttonPopular || "See Most Visited", action: () => navigate("/mostVisited") }
      ]
    };
  }

  // Search intent (improved with multilingual support)
  const searchQuery = extractSearchQuery(userInput);
  if (searchQuery) {
    navigate(`/searchsite?q=${encodeURIComponent(searchQuery)}`);
    setIsChatOpen(false);
    return {
      text: currentT.chatSearching?.replace("{query}", searchQuery) || `Searching for "${searchQuery}"...`,
      buttons: []
    };
  }

  // Dashboard in multiple languages
  if (isDashboardRequest(lower)) {
    navigate("/dashboardSite");
    setIsChatOpen(false);
    return {
      text: currentT.chatGoingToDashboard || "Taking you to your dashboard!",
      buttons: []
    };
  }

  // Login/Register in multiple languages
  if (isLoginRequest(lower)) {
    navigate("/loginRegisterSite");
    setIsChatOpen(false);
    return {
      text: currentT.chatGoingToLogin || "Taking you to the login page!",
      buttons: []
    };
  }

  // Categories in multiple languages
  if (isCategoriesRequest(lower)) {
    navigate("/categories");
    setIsChatOpen(false);
    return {
      text: currentT.chatGoingToCategories || "Taking you to categories!",
      buttons: []
    };
  }

  // Most visited / popular in multiple languages
  if (isPopularRequest(lower)) {
    navigate("/mostVisited");
    setIsChatOpen(false);
    return {
      text: currentT.chatGoingToPopular || "Showing the most popular Funko Pops!",
      buttons: []
    };
  }

  // Exclusive items in multiple languages
  if (isExclusiveRequest(lower)) {
    const exclusives = funkoData.filter(item => item.exclusive);
    if (exclusives.length > 0) {
      const sample = exclusives.slice(0, 2).map(i => i.title).join(", ");
      return {
        text: currentT.chatExclusivesFound?.replace("{count}", exclusives.length.toString()).replace("{examples}", sample) ||
            `I found ${exclusives.length} exclusive Pops! Examples: ${sample}. View them in search.`,
        buttons: [
          { label: currentT.buttonSearchExclusives || "Show All Exclusives", action: () => {
            setIsChatOpen(false);
            navigate("/searchsite?q=exclusive");
          } }
        ]
      };
    }
    return {
      text: currentT.chatNoExclusives || "No exclusive items found right now.",
      buttons: []
    };
  }

  // Try direct item match
  const directMatch = funkoData.find(item =>
    item.title.toLowerCase().includes(lower) ||
    item.series.some(s => s.toLowerCase().includes(lower))
  );
  if (directMatch) {
    navigate(`/funko/${directMatch.id}`);
    setIsChatOpen(false);
    return {
      text: currentT.chatFoundItem?.replace("{item}", directMatch.title) || `Found "${directMatch.title}"! Taking you there...`,
      buttons: []
    };
  }

  // Default fallback with language-specific suggestions
  const fallbackTexts = {
    EN: "I can help you search, browse categories, or find popular Funko Pops! Try saying \"Search for Batman\" or \"Take me to dashboard\".",
    PL: "Mogę pomóc Ci wyszukać, przeglądać kategorie lub znaleźć popularne Funko Popy! Spróbuj powiedzieć \"Szukaj Batmana\" lub \"Pokaż mi panel\".",
    RU: "Я могу помочь вам найти, просмотреть категории или найти популярные Funko Pops! Попробуйте сказать \"Найти Бэтмена\" или \"Перейти в панель управления\".",
    FR: "Je peux vous aider à rechercher, parcourir les catégories ou trouver des Funko Pops populaires! Essayez de dire \"Rechercher Batman\" ou \"Aller au tableau de bord\".",
    DE: "Ich kann Ihnen helfen, zu suchen, Kategorien zu durchsuchen или beliebte Funko Pops zu finden! Versuchen Sie, \"Suche nach Batman\" oder \"Zum Dashboard gehen\" zu sagen.",
    ES: "¡Puedo ayudarte a buscar, explorar categorías o encontrar Funko Pops populares! Intenta decir \"Buscar Batman\" o \"Ir al panel de control\"."
  };

  return {
    text: currentT.chatFallback || fallbackTexts[language as keyof typeof fallbackTexts] || fallbackTexts.EN,
    buttons: [
      { label: currentT.buttonDashboard || "Take me to dashboard", action: () => navigate("/dashboardSite") },
      { label: currentT.buttonLogin || "Login/Register", action: () => navigate("/loginRegisterSite") },
      { label: currentT.buttonSearch || "Search for something", action: () => {
        setIsChatOpen(false);
        navigate("/searchsite");
      } }
    ]
  };
};

  
  // 🌐 Centralized country configuration
  const countries = {
    USA: {
      name: "USA",
      flag: <USAFlag className="w-5 h-5" />,
      region: "North America",
      language: "EN",
    },
    CA: {
      name: "Canada",
      flag: <CanadaFlag className="w-5 h-5" />,
      region: "North America",
      language : "EN",
    },
    UK: {
      name: "UK",
      flag: <UKFlag className="w-5 h-5" />,
      region: "Europe",
      language: "EN",
    },
    PL: {
      name: "Poland",
      flag: <PolandFlag className="w-5 h-5" />,
      region: "Europe",
      language: "PL",
    },
    RU: {
      name: "Russia",
      flag: <RussiaFlag className="w-5 h-5" />,
      region: "Europe",
      language: "RU",
    },
    FR: {
      name: "France",
      flag: <FranceFlag className="w-5 h-5" />,
      region: "Europe",
      language: "FR",
    },
    DE: {
      name: "Germany",
      flag: <GermanyFlag className="w-5 h-5" />,
      region: "Europe",
      language: "DE",
    },
    ES: {
      name: "Spain",
      flag: <SpainFlag className="w-5 h-5" />,
      region: "Europe",
      language: "ES",
    },
  };

  // 🌍 Languages for dropdown (with flag)
  const languages = {
    US: { name: "USA", flag: <USAFlag className="w-5 h-5" /> },
    EN: { name: "UK", flag: <UKFlag className="w-5 h-5" /> },
    CA: { name: "Canada", flag: <CanadaFlag className="w-5 h-5" /> },
    PL: { name: "Polski", flag: <PolandFlag className="w-5 h-5" /> },
    RU: { name: "Русский", flag: <RussiaFlag className="w-5 h-5" /> },
    FR: { name: "Français", flag: <FranceFlag className="w-5 h-5" /> },
    DE: { name: "Deutsch", flag: <GermanyFlag className="w-5 h-5" /> },
    ES: { name: "Español", flag: <SpainFlag className="w-5 h-5" /> },
  };

  // 🌐 Detect country from browser language
  const detectCountryFromLocale = (locale: string): string | null => {
    const map: Record<string, string> = {
      us: "USA",
      "en-US": "USA",
      en:"UK",
      "en-GB": "UK",
      pl: "PL",
      "pl-PL": "PL",
      ru: "RU",
      "ru-RU": "RU",
      fr: "FR",
      "fr-FR": "FR",
      de: "DE",
      "de-DE": "DE",
      es: "ES",
      "es-ES": "ES",
    };
    return map[locale] || map[locale.split("-")[0]] || null;
  };

  // 🧩 Initial setup: load preferences or detect locale
  useEffect(() => {
  const savedLang = localStorage.getItem("preferredLanguage");
  const savedCountry = localStorage.getItem("preferredCountry");

  // Jeśli użytkownik ma zapisany język → użyj go
  if (savedLang) {
    setLanguage(savedLang);
  }

  // Jeśli ma zapisany kraj → ustaw region i kraj
  const countryData = savedCountry && countries[savedCountry as keyof typeof countries]
    ? countries[savedCountry as keyof typeof countries]
    : null;

  if (countryData && savedCountry) {
    setSelectedCountry(savedCountry);
    if (!savedLang) setLanguage(countryData.language); // tylko jeśli język nie był ustawiony wcześniej
    setRegion(countryData.region);
  } else {
    // Automatyczne wykrycie z przeglądarki
    const detected = detectCountryFromLocale(navigator.language);
    const detectedData = detected ? countries[detected as keyof typeof countries] : null;
    if (detectedData && detected) {
      setSelectedCountry(detected);
      if (!savedLang) setLanguage(detectedData.language);
      setRegion(detectedData.region);
    }
  }


  // Reszta logiki (popup, mapa, motyw)
  const hasSeenPopup = localStorage.getItem("hasSeenLanguagePopup");
  if (!hasSeenPopup) {
    setShouldShowPopup(true);
    localStorage.setItem("hasSeenLanguagePopup", "true");
  }

  if (isDarkMode) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");

  const hasSeenMap = localStorage.getItem("hasSeenWorldMap");
  if (!hasSeenMap) {
    setShowWorldMapFirstTime(true);
    localStorage.setItem("hasSeenWorldMap", "true");
  }
}, [isDarkMode]);

const incrementVisitCount = (id: string) => {
  const today = new Date().toDateString();
  const globalClickKey = `global_click_${id}_${today}`;

  // Sprawdź czy już dzisiaj zwiększono licznik
  if (!localStorage.getItem(globalClickKey)) {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    localStorage.setItem(globalClickKey, "true");

    // Poinformuj inne komponenty
    window.dispatchEvent(new CustomEvent('funkoVisitUpdated'));
    window.dispatchEvent(new CustomEvent('globalFunkoVisit', { detail: { id } }));

    // Ustaw wygaśnięcie na północ
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - Date.now();

    setTimeout(() => {
      localStorage.removeItem(globalClickKey);
    }, timeUntilMidnight);

    return true;
  }
  return false;
};

  // 🌙 Theme sync
  useEffect(() => {
      localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
  }, [isDarkMode]);

  // 📥 Fetch Funko data


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1) Try cached copy (24h)
        try {
          const cached = localStorage.getItem('funkoCache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = Date.now() - (parsed.ts || 0);
            if (age < 24 * 60 * 60 * 1000 && parsed.data && parsed.data.length) {
              setFunkoData(parsed.data);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          // ignore cache parse errors
        }

        // 2) Try backend (if token)
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const backendResponse = await fetch("http://localhost:5000/api/items?limit=30", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (backendResponse.ok) {
              const backendData = await backendResponse.json();
              if (backendData && backendData.length > 0) {
                const dataWithIds = backendData.map((item: any) => ({
                  ...item,
                  id: item.id || generateId(item.title, item.number),
                  series: Array.isArray(item.series)
                    ? item.series
                    : typeof item.series === 'string'
                    ? JSON.parse(item.series)
                    : [],
                }));
                setFunkoData(dataWithIds);
                localStorage.setItem(
                  'funkoCache',
                  JSON.stringify({ ts: Date.now(), data: dataWithIds })
                );
                setIsLoading(false);
                return;
              }
            }
          } catch (backendErr) {
            // backend not available, fall through to external
          }
        }

        // 3) Fallback: external JSON
        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        const rawData: FunkoItem[] = await response.json();
        const dataWithIds = rawData.map((item) => ({ ...item, id: generateId(item.title, item.number) }));
        // Do not store or render the full huge dataset on the welcome page to improve startup on mobile.
        // Keep a small initial slice and cache that slice only.
        const DISPLAY_LIMIT = 50;
        const initialSlice = dataWithIds.slice(0, DISPLAY_LIMIT);
        setFunkoData(initialSlice);
        try {
          localStorage.setItem('funkoCache', JSON.stringify({ ts: Date.now(), data: initialSlice }));
        } catch (e) {
          // ignore localStorage set errors
        }
      } catch (err) {
        // keep quiet; show minimal console output only when needed
        console.warn('Failed to load Funko data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

    // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // Perform logout
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000); // 10 minutes = 600,000 ms
    };

    // Initial setup
    resetTimer();

    // List of events to consider as "user activity"
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate]);

  // 🎲 Get 3 random items
  const getRandomItems = (): FunkoItemWithId[] => {
    if (funkoData.length === 0) return [];
    const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // 🔥 Get most visited items
  const getMostVisitedItems = (): FunkoItemWithId[] => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    return [...funkoData]
      .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
      .sort((a, b) => b.visits - a.visits)
      .filter((item) => item.visits > 0)
      .slice(0, 3);
  };

  // 🌍 Handle country selection
  const handleCountryChange = (countryCode: string) => {
    const countryData = countries[countryCode as keyof typeof countries];
    if (countryData) {
      setSelectedCountry(countryCode);
      setLanguage(countryData.language);
      setRegion(countryData.region);
      localStorage.setItem("preferredCountry", countryCode);
      localStorage.setItem("preferredLanguage", countryData.language);
      setShowCountryDropdown(false);
    }
  };

  // 🗺️ Handle map click
  const handleMapCountryClick = (mapCode: string) => {
    const codeMap: Record<string, string> = {
      US: "USA",
      GB: "UK",
      DE: "DE",
      FR: "FR",
      PL: "PL",
      RU: "RU",
      ES: "ES",
      CA: "USA", // Canada → North America
    };
    const appCode = codeMap[mapCode];
    if (appCode) handleCountryChange(appCode);
  };

  // 🔍 Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/searchsite?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // 👁️ Track item visits
  const handleItemClick = (id: string) => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    visitCount[id] = (visitCount[id] || 0) + 1;
    localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
  };

  // 🌙 Toggle theme
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Select language
  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
    setShowLanguageDropdown(false);
  };

// Memoize random items — only change when funkoData changes
const randomItems = useMemo(() => {
  if (funkoData.length === 0) return [];
  const shuffled = [...funkoData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}, [funkoData]); // Only recompute when funkoData changes

// Memoize most visited items — recompute when funkoData or visit counts change
const mostVisitedItems = useMemo(() => {
  const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
  return [...funkoData]
    .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
    .sort((a, b) => b.visits - a.visits)
    .filter((item) => item.visits > 0)
    .slice(0, 3);
}, [funkoData]); // Note: localStorage isn't reactive, so this won't auto-update on visit

  return (
    <div
      className={`welcome-site w-full max-w-full overflow-x-hidden min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"
      }`}
    >
      {/* 🌍 First-Time World Map Popup */}
      {showWorldMapFirstTime && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full">
            <button
              onClick={() => setShowWorldMapFirstTime(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
              aria-label="Close map"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              {t.regionMapTitle || "Explore by Region"}
            </h2>
            <React.Suspense fallback={<div style={{height:300}}/>}>
              <WorldMap
                onSelectCountry={(code) => {
                  handleMapCountryClick(code);
                  setShowWorldMapFirstTime(false);
                }}
              />
            </React.Suspense>
          </div>
        </div>
      )}
      {/* 🔝 Header */}
      <header className="py-4 px-4 md:px-8 flex flex-wrap justify-between items-center gap-4">
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
          <Link to="/" className="no-underline">
            <h1
              className={`text-2xl sm:text-3xl font-bold font-[Special_Gothic_Expanded_One] ${
                isDarkMode ? "text-yellow-400" : "text-blue-600"
              }`}
            >
              Pop&Go!
            </h1>
          </Link>
        </div>

        {/* 🔍 Search */}
        <form
          onSubmit={handleSearch}
          className={`w-full sm:max-w-md mx-auto flex rounded-lg overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-white"
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
                : "bg-white text-black placeholder-gray-500"
            }`}
            aria-label="Search for Funkos"
          />
          <button
            type="submit"
            className={`px-4 py-2 ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </form>


        {/* 🌐 Country, 🌙 Theme, 🔐 Login */}
          <div className="flex-shrink-0 flex gap-4 mt-2 md:mt-0 min-w-0 items-center">
                  {/* Language Dropdown */}
                  <div className="relative">
                    <button
                      ref={languageButtonRef}
                      onClick={toggleLanguageDropdown}
                      className={`p-2 rounded-full flex items-center gap-1 min-w-0 ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-200 hover:bg-neutral-600"
                      }`}
                      aria-label="Select language"
                      aria-expanded={showLanguageDropdown}
                    >
                      <GlobeIcon className="w-5 h-5" />
                      <span className="hidden sm:inline text-sm font-medium">{language}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${
                          showLanguageDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showLanguageDropdown && (
                          <div
                            ref={languageDropdownRef}
                            className={`absolute mt-2 z-50 lang-dropdown variant-b rounded-lg shadow-xl py-2 sm:right-0 right-2 left-2 w-[200px] sm:w-48 min-w-[160px] max-h-[90vh] overflow-auto ${
                              isDarkMode
                                ? 'border-yellow-500 bg-gray-800'
                                : 'border-blue-500 bg-white'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                        {Object.entries(languages).map(([code, { name, flag }]) => (
                          <button
                            key={code}
                            onClick={() => selectLanguage(code)}
                            className={`lang-item w-full text-left px-4 py-2 flex items-center gap-2 whitespace-nowrap ${
                              language === code
                                ? isDarkMode
                                  ? "bg-yellow-500 text-black"
                                  : "bg-green-600 text-white"
                                : isDarkMode
                                ? "hover:bg-gray-600"
                                : "hover:bg-neutral-500"
                            }`}
                          >
                            <span className="w-5 h-5">{flag}</span>
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>


          {/* 🌙 Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-600"
            }`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>

          {/* 🔐 Dashboard/Login */}
          {/* <button
            onClick={() => {
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              navigate(user.role === "admin" ? "/adminSite" : user.role === "user" ? "/dashboardSite" : "/loginRegisterSite");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {t.goToDashboard || "Dashboard"}
          </button> */}
          <AuthButton isDarkMode={isDarkMode} translations={t} />
        </div>
              <React.Suspense fallback={<div style={{width:80,height:20}}/>}>
                <QuickLinks isDarkMode={isDarkMode} language={language as any} />
              </React.Suspense>
      </header>

      {/* 🧭 Main Content */}
      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center">
        {/* 📍 Current language & region */}
        {/* <div className={`mb-6 text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
          <p className="text-sm">
            {languageNames[t.language] || "Unknown"} • {region}
          </p>
        </div> */}


        {/* 🎲 Random Items */}
        <section className="w-full max-w-4xl mt-10 mb-10">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.randomItems || "Random Items"}</h2>
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {randomItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                  <img
                    src={item.imageName || "/src/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                    }}
                  />
                  <h3 className="font-bold text-center">{item.title}</h3>
                  <p className="text-sm text-center">
                    #{item.number} • {item.series.join(", ")}
                  </p>
                  {item.exclusive && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-yellow-600" : "bg-blue-600"
                      } text-white`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                to="/categories"
                className={`block p-4 rounded-lg flex items-center justify-center h-full ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                } shadow transition-transform hover:scale-105`}
              >
                <h2 className="text-xl font-bold">{t.goToCategories || "Browse Categories"}</h2>
              </Link>
            </div>
          )}
        </section>

        {/* 🔥 Most Visited */}
        <section className="w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.mostVisited || "Most Visited"}</h2>
          {mostVisitedItems.length === 0 ? (
            <p className="text-center text-gray-500">{t.noVisitsYet || "No items visited yet."}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {mostVisitedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`block p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                  } shadow transition-transform hover:scale-105`}
                >
                  <img
                    src={item.imageName || "/src/assets/placeholder.png"}
                    alt={item.title}
                    className="w-full h-48 object-contain rounded-md mb-3"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = "/src/assets/placeholder.png";
                    }}
                  />
                  <h3 className="font-bold text-center">{item.title}</h3>
                  <p className="text-sm text-center">
                    #{item.number} • {item.series.join(", ")}
                  </p>
                  {item.exclusive && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        isDarkMode ? "bg-yellow-600" : "bg-blue-600"
                      } text-white`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </Link>
              ))}
              <Link
                to="/mostVisited"
                className={`block p-4 rounded-lg flex items-center justify-center h-full ${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"
                } shadow transition-transform hover:scale-105`}
              >
                <h2 className="text-xl font-bold">{t.goToMostVisited || "View All Popular"}</h2>
              </Link>
            </div>
          )}
        </section>



        {/* 💬 Enhanced Chatbot - MULTILINGUAL DIRECT ACTIONS */}
        {isChatOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
            onClick={() => setIsChatOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col h-[70vh] max-h-[600px] border border-gray-300 dark:border-gray-600"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-yellow-500 dark:to-amber-500 text-white font-bold rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>🤖 PopBot</span>
                  <span className="text-xs opacity-90">Your Funko Assistant</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                    {language}
                  </span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-white hover:text-gray-200 text-xl transition-colors"
                  aria-label="Close chat"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900"
              >
                {messages.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    {t.chatWelcome || "Hello! Ask me anything about Funko Pops. Try: \"Search for Marvel\""}
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                        }`}
                      >
                        {/* Text */}
                        {typeof msg.text === 'string' ? (
                          msg.text.split('\n').map((line, j) => (
                            <p key={j} className={j > 0 ? "mt-1" : ""}>
                              {line.startsWith('•') ? (
                                <span className="inline-block ml-2">{line}</span>
                              ) : (
                                line
                              )}
                            </p>
                          ))
                        ) : (
                          <div>{msg.text}</div>
                        )}

                        {/* Buttons (if any) */}
                        {msg.buttons && msg.buttons.length > 0 && (
                          <div className="mt-2 flex flex-col gap-2">
                            {msg.buttons.map((btn, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  btn.action();
                                  setIsChatOpen(false);
                                }}
                                className={`w-full text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                                    isDarkMode
                                      ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input - MULTILINGUAL DIRECT ACTION BUTTONS */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputValue.trim()) return;

                  const userMsg = inputValue.trim();
                  setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
                  setInputValue("");

                  setTimeout(() => {
                    const botReply = getBotResponse(userMsg);
                    setMessages(prev => [...prev, { ...botReply, sender: 'bot' }]);
                  }, 600);
                }}
                className="p-3 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t.chatPlaceholder || "Ask about Funko Pops..."}
                    className="flex-grow px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-yellow-500"
                    aria-label="Chat input"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsChatOpen(false);
                    }}
                  />
                  <button
                    type="submit"
                    className={`${
                      isDarkMode
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                  >
                    Send
                  </button>
                </div>
                
                {/* MULTILINGUAL: Direct action buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* 🔍 Search Batman - ALL LANGUAGES */}
                  <button
                    type="button"
                    onClick={() => {
                      // Get text based on language
                      const searchTexts = {
                        EN: 'search batman',
                        PL: 'szukaj batmana',
                        RU: 'найти batman',
                        FR: 'chercher batman',
                        DE: 'suche batman',
                        ES: 'buscar batman'
                      };
                      const searchTerm = 'batman';
                      const searchText = searchTexts[language as keyof typeof searchTexts] || searchTexts.EN;
                      
                      // Response texts
                      const responseTexts = {
                        EN: `Searching for "batman"...`,
                        PL: `Szukam "batman"...`,
                        RU: `Ищу "batman"...`,
                        FR: `Recherche de "batman"...`,
                        DE: `Suche nach "batman"...`,
                        ES: `Buscando "batman"...`
                      };
                      
                      // Show user message
                      setMessages(prev => [...prev, { text: searchText, sender: 'user' }]);
                      
                      // Show bot response before redirecting
                      setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          text: responseTexts[language as keyof typeof responseTexts] || responseTexts.EN,
                          sender: 'bot' 
                        }]);
                        
                        // Redirect to search after short delay
                        setTimeout(() => {
                          navigate(`/searchsite?q=${encodeURIComponent(searchTerm)}`);
                          setIsChatOpen(false);
                        }, 800);
                      }, 600);
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                      isDarkMode
                        ? "bg-blue-700 hover:bg-blue-600 text-white"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300"
                    }`}
                    aria-label={
                      language === 'PL' ? 'Szukaj batmana' :
                      language === 'RU' ? 'Найти batman' :
                      language === 'FR' ? 'Chercher batman' :
                      language === 'DE' ? 'Suche batman' :
                      language === 'ES' ? 'Buscar batman' :
                      'Search batman'
                    }
                  >
                    <span>🔍</span>
                    <span>
                      {language === 'PL' ? 'szukaj batmana' :
                      language === 'RU' ? 'найти batman' :
                      language === 'FR' ? 'chercher batman' :
                      language === 'DE' ? 'suche batman' :
                      language === 'ES' ? 'buscar batman' :
                      'search batman'}
                    </span>
                  </button>
                  
                  {/* 📁 Show Categories - ALL LANGUAGES */}
                  <button
                    type="button"
                    onClick={() => {
                      // Get text based on language
                      const categoryTexts = {
                        EN: 'show categories',
                        PL: 'pokaż kategorie',
                        RU: 'показать категории',
                        FR: 'montrer catégories',
                        DE: 'kategorien zeigen',
                        ES: 'mostrar categorías'
                      };
                      
                      // Response texts
                      const responseTexts = {
                        EN: 'Going to categories...',
                        PL: 'Przechodzę do kategorii...',
                        RU: 'Перехожу к категориям...',
                        FR: 'Aller aux catégories...',
                        DE: 'Gehe zu Kategorien...',
                        ES: 'Yendo a categorías...'
                      };
                      
                      const categoryText = categoryTexts[language as keyof typeof categoryTexts] || categoryTexts.EN;
                      
                      // Show user message
                      setMessages(prev => [...prev, { text: categoryText, sender: 'user' }]);
                      
                      // Show bot response before redirecting
                      setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          text: responseTexts[language as keyof typeof responseTexts] || responseTexts.EN,
                          sender: 'bot' 
                        }]);
                        
                        // Redirect to categories after short delay
                        setTimeout(() => {
                          navigate("/categories");
                          setIsChatOpen(false);
                        }, 800);
                      }, 600);
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                      isDarkMode
                        ? "bg-green-700 hover:bg-green-600 text-white"
                        : "bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"
                    }`}
                    aria-label={
                      language === 'PL' ? 'Pokaż kategorie' :
                      language === 'RU' ? 'Показать категории' :
                      language === 'FR' ? 'Montrer catégories' :
                      language === 'DE' ? 'Kategorien zeigen' :
                      language === 'ES' ? 'Mostrar categorías' :
                      'Show categories'
                    }
                  >
                    <span>📁</span>
                    <span>
                      {language === 'PL' ? 'pokaż kategorie' :
                      language === 'RU' ? 'показать категории' :
                      language === 'FR' ? 'montrer catégories' :
                      language === 'DE' ? 'kategorien zeigen' :
                      language === 'ES' ? 'mostrar categorías' :
                      'show categories'}
                    </span>
                  </button>
                  
                  {/* 🔥 Popular Items - ALL LANGUAGES */}
                  <button
                    type="button"
                    onClick={() => {
                      // Get text based on language
                      const popularTexts = {
                        EN: 'popular',
                        PL: 'popularne',
                        RU: 'популярные',
                        FR: 'populaire',
                        DE: 'beliebt',
                        ES: 'popular'
                      };
                      
                      // Response texts
                      const responseTexts = {
                        EN: 'Showing popular items...',
                        PL: 'Pokazuję popularne...',
                        RU: 'Показываю популярные...',
                        FR: 'Afficher les articles populaires...',
                        DE: 'Zeige beliebte Artikel...',
                        ES: 'Mostrando artículos populares...'
                      };
                      
                      const popularText = popularTexts[language as keyof typeof popularTexts] || popularTexts.EN;
                      
                      // Show user message
                      setMessages(prev => [...prev, { text: popularText, sender: 'user' }]);
                      
                      // Show bot response before redirecting
                      setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          text: responseTexts[language as keyof typeof responseTexts] || responseTexts.EN,
                          sender: 'bot' 
                        }]);
                        
                        // Redirect to most visited after short delay
                        setTimeout(() => {
                          navigate("/mostVisited");
                          setIsChatOpen(false);
                        }, 800);
                      }, 600);
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                      isDarkMode
                        ? "bg-purple-700 hover:bg-purple-600 text-white"
                        : "bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300"
                    }`}
                    aria-label={
                      language === 'PL' ? 'Popularne itemy' :
                      language === 'RU' ? 'Популярные товары' :
                      language === 'FR' ? 'Articles populaires' :
                      language === 'DE' ? 'Beliebte Artikel' :
                      language === 'ES' ? 'Artículos populares' :
                      'Popular items'
                    }
                  >
                    <span>🔥</span>
                    <span>
                      {language === 'PL' ? 'popularne' :
                      language === 'RU' ? 'популярные' :
                      language === 'FR' ? 'populaire' :
                      language === 'DE' ? 'beliebt' :
                      language === 'ES' ? 'popular' :
                      'popular'}
                    </span>
                  </button>
                  
                  {/* 📊 Dashboard - ALL LANGUAGES */}
                  <button
                    type="button"
                    onClick={() => {
                      // Get text based on language
                      const dashboardTexts = {
                        EN: 'dashboard',
                        PL: 'panel',
                        RU: 'панель',
                        FR: 'tableau de bord',
                        DE: 'dashboard',
                        ES: 'panel'
                      };
                      
                      // Response texts
                      const responseTexts = {
                        EN: 'Going to dashboard...',
                        PL: 'Przechodzę do panelu...',
                        RU: 'Перехожу на панель...',
                        FR: 'Aller au tableau de bord...',
                        DE: 'Gehe zum Dashboard...',
                        ES: 'Yendo al panel...'
                      };
                      
                      const dashboardText = dashboardTexts[language as keyof typeof dashboardTexts] || dashboardTexts.EN;
                      
                      // Show user message
                      setMessages(prev => [...prev, { text: dashboardText, sender: 'user' }]);
                      
                      // Show bot response before redirecting
                      setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          text: responseTexts[language as keyof typeof responseTexts] || responseTexts.EN,
                          sender: 'bot' 
                        }]);
                        
                        // Redirect to dashboard after short delay
                        setTimeout(() => {
                          const user = JSON.parse(localStorage.getItem("user") || "{}");
                          navigate(user.role === "admin" ? "/adminSite" : user.role === "user" ? "/dashboardSite" : "/loginRegisterSite");
                          setIsChatOpen(false);
                        }, 800);
                      }, 600);
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                      isDarkMode
                        ? "bg-amber-700 hover:bg-amber-600 text-white"
                        : "bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
                    }`}
                    aria-label={
                      language === 'PL' ? 'Panel użytkownika' :
                      language === 'RU' ? 'Панель управления' :
                      language === 'FR' ? 'Tableau de bord' :
                      language === 'DE' ? 'Dashboard' :
                      language === 'ES' ? 'Panel de control' :
                      'User dashboard'
                    }
                  >
                    <span>📊</span>
                    <span>
                      {language === 'PL' ? 'panel' :
                      language === 'RU' ? 'панель' :
                      language === 'FR' ? 'tableau de bord' :
                      language === 'DE' ? 'dashboard' :
                      language === 'ES' ? 'panel' :
                      'dashboard'}
                    </span>
                  </button>
                  
                  {/* 🔐 Login/Register - ALL LANGUAGES */}
                  <button
                    type="button"
                    onClick={() => {
                      // Get text based on language
                      const loginTexts = {
                        EN: 'login',
                        PL: 'zaloguj',
                        RU: 'войти',
                        FR: 'connexion',
                        DE: 'anmelden',
                        ES: 'iniciar sesión'
                      };
                      
                      // Response texts
                      const responseTexts = {
                        EN: 'Going to login page...',
                        PL: 'Przechodzę do logowania...',
                        RU: 'Перехожу на страницу входа...',
                        FR: 'Aller à la page de connexion...',
                        DE: 'Gehe zur Login-Seite...',
                        ES: 'Yendo a la página de inicio de sesión...'
                      };
                      
                      const loginText = loginTexts[language as keyof typeof loginTexts] || loginTexts.EN;
                      
                      // Show user message
                      setMessages(prev => [...prev, { text: loginText, sender: 'user' }]);
                      
                      // Show bot response before redirecting
                      setTimeout(() => {
                        setMessages(prev => [...prev, { 
                          text: responseTexts[language as keyof typeof responseTexts] || responseTexts.EN,
                          sender: 'bot' 
                        }]);
                        
                        // Redirect to login after short delay
                        setTimeout(() => {
                          navigate("/loginRegisterSite");
                          setIsChatOpen(false);
                        }, 800);
                      }, 600);
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                      isDarkMode
                        ? "bg-red-700 hover:bg-red-600 text-white"
                        : "bg-red-100 hover:bg-red-200 text-red-800 border border-red-300"
                    }`}
                    aria-label={
                      language === 'PL' ? 'Zaloguj się' :
                      language === 'RU' ? 'Войти' :
                      language === 'FR' ? 'Se connecter' :
                      language === 'DE' ? 'Anmelden' :
                      language === 'ES' ? 'Iniciar sesión' :
                      'Login'
                    }
                  >
                    <span>🔐</span>
                    <span>
                      {language === 'PL' ? 'zaloguj' :
                      language === 'RU' ? 'войти' :
                      language === 'FR' ? 'connexion' :
                      language === 'DE' ? 'anmelden' :
                      language === 'ES' ? 'iniciar sesión' :
                      'login'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {!isChatOpen && (
          <button
            onClick={() => {
              setIsChatOpen(true);
              if (messages.length === 0) {
                setMessages([
                  {
                    text: t.chatWelcome || "Hello! Ask me anything about Funko Pops!",
                    sender: 'bot',
                    buttons: [
                      { label: t.buttonDashboard || "Take me to the dashboard!", action: () => navigate("/dashboardSite") },
                      { label: t.buttonLogin || "Take me to the login page", action: () => navigate("/loginRegisterSite") },
                      { label: t.buttonSearch || "Search for something", action: () => navigate("/searchsite") }
                    ]
                  }
                ]);
              }
            }}
            className={`fixed bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            aria-label="Open chat"
          >
            💬
          </button>
        )}

      </main>

      {/* 📝 Footer */}
      <footer
        className={`text-center py-4 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-700"
        }`}
      >
        {t.copyright}
      </footer>
    </div>
  );
};

export default WelcomeSite;