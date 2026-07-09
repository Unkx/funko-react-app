import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsWelcomeSite";
import { LanguageContext } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import Layout from "./Layout";
import {
  Search, Folder, Flame, LayoutDashboard, LogIn,
  MessageCircle, X, Send, Sparkles, TrendingUp
} from "lucide-react";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://funko-backend.onrender.com";

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

const generateId = (title: string, number: string): string => {
  const safeTitle = title?.trim() || "";
  const safeNumber = number?.trim() || "";
  return `${safeTitle}-${safeNumber}`
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const WelcomeSite: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const { isDarkMode } = useTheme();
  const [funkoData, setFunkoData] = useState<FunkoItemWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set());
  const markImageBroken = (id: string) =>
    setBrokenImageIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  const [showOpenSourceBanner, setShowOpenSourceBanner] = useState(
    () => !sessionStorage.getItem("openSourceDismissed")
  );

  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "bot"; buttons?: Array<{ label: string; action: () => void }> }[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        try {
          const cached = localStorage.getItem("funkoCache");
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = Date.now() - (parsed.ts || 0);
            if (age < 24 * 60 * 60 * 1000 && parsed.data?.length) {
              setFunkoData(parsed.data);
              setIsLoading(false);
              return;
            }
          }
        } catch {}

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const backendResponse = await fetch(`${baseURL}/api/items?limit=30`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (backendResponse.ok) {
              const backendData = await backendResponse.json();
              if (backendData?.length > 0) {
                const dataWithIds = backendData.map((item: any) => ({
                  ...item,
                  id: item.id || generateId(item.title, item.number),
                  series: Array.isArray(item.series)
                    ? item.series
                    : typeof item.series === "string"
                      ? JSON.parse(item.series)
                      : [],
                }));
                setFunkoData(dataWithIds);
                localStorage.setItem("funkoCache", JSON.stringify({ ts: Date.now(), data: dataWithIds }));
                setIsLoading(false);
                return;
              }
            }
          } catch {}
        }

        const response = await fetch(
          "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        const rawData: FunkoItem[] = await response.json();
        const dataWithIds = rawData.map((item) => ({ ...item, id: generateId(item.title, item.number) }));
        const initialSlice = dataWithIds.slice(0, 50);
        setFunkoData(initialSlice);
        try {
          localStorage.setItem("funkoCache", JSON.stringify({ ts: Date.now(), data: initialSlice }));
        } catch {}
      } catch (err) {
        console.warn("Failed to load Funko data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const incrementVisitCount = (id: string) => {
    const today = new Date().toDateString();
    const globalClickKey = `global_click_${id}_${today}`;
    if (!localStorage.getItem(globalClickKey)) {
      const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
      visitCount[id] = (visitCount[id] || 0) + 1;
      localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
      localStorage.setItem(globalClickKey, "true");
      window.dispatchEvent(new CustomEvent("funkoVisitUpdated"));
      window.dispatchEvent(new CustomEvent("globalFunkoVisit", { detail: { id } }));
    }
  };

  const randomItems = useMemo(() => {
    const withImage = funkoData.filter((item) => !!item.imageName && !brokenImageIds.has(item.id));
    if (withImage.length === 0) return [];
    const shuffled = [...withImage].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [funkoData, brokenImageIds]);

  const mostVisitedItems = useMemo(() => {
    const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
    return [...funkoData]
      .map((item) => ({ ...item, visits: visitCount[item.id] || 0 }))
      .sort((a, b) => b.visits - a.visits)
      .filter((item) => item.visits > 0 && !!item.imageName && !brokenImageIds.has(item.id))
      .slice(0, 3);
  }, [funkoData, brokenImageIds]);

  // Chatbot response logic
  const getBotResponse = (
    userInput: string
  ): { text: string; buttons?: Array<{ label: string; action: () => void }> } => {
    const lower = userInput.toLowerCase().trim();
    const currentT = translations[language] || translations["EN"];

    const greetings = ["hi", "hello", "hey", "howdy", "cześć", "witaj", "привет", "bonjour", "hallo", "hola"];
    if (greetings.some((g) => lower.includes(g))) {
      return {
        text: currentT.chatGreeting || "Hi there! I'm PopBot! Ask me to search, browse categories, or find popular items!",
        buttons: [
          { label: currentT.buttonDashboard || "Dashboard", action: () => navigate("/dashboardSite") },
          { label: currentT.buttonLogin || "Login", action: () => navigate("/loginRegisterSite") },
          {
            label: currentT.buttonSearch || "Search",
            action: () => {
              setIsChatOpen(false);
              navigate("/searchsite");
            },
          },
        ],
      };
    }

    const helpPhrases = ["help", "what can you do", "pomoc", "помощь", "aide", "hilfe", "ayuda"];
    if (helpPhrases.some((p) => lower.includes(p))) {
      return {
        text:
          currentT.chatHelp ||
          "I can help you:\n• Search for any Funko Pop\n• Go to Dashboard or Login\n• Browse Categories\n• Find Popular Items",
        buttons: [
          { label: currentT.buttonDashboard || "Dashboard", action: () => navigate("/dashboardSite") },
          { label: currentT.buttonCategories || "Categories", action: () => navigate("/categories") },
          { label: currentT.buttonPopular || "Popular", action: () => navigate("/mostVisited") },
        ],
      };
    }

    const dashboardPhrases = ["dashboard", "panel", "панель", "tableau de bord"];
    if (dashboardPhrases.some((p) => lower.includes(p))) {
      navigate("/dashboardSite");
      setIsChatOpen(false);
      return { text: currentT.chatGoingToDashboard || "Taking you to your dashboard!" };
    }

    const loginPhrases = ["login", "log in", "sign in", "zaloguj", "войти", "connexion", "anmelden"];
    if (loginPhrases.some((p) => lower.includes(p))) {
      navigate("/loginRegisterSite");
      setIsChatOpen(false);
      return { text: currentT.chatGoingToLogin || "Taking you to the login page!" };
    }

    const categoryPhrases = ["categories", "category", "kategorie", "категории", "catégories", "kategorien", "categorías"];
    if (categoryPhrases.some((p) => lower.includes(p))) {
      navigate("/categories");
      setIsChatOpen(false);
      return { text: currentT.chatGoingToCategories || "Taking you to categories!" };
    }

    const popularPhrases = ["popular", "most visited", "trending", "popularne", "популярные", "populaire", "beliebt"];
    if (popularPhrases.some((p) => lower.includes(p))) {
      navigate("/mostVisited");
      setIsChatOpen(false);
      return { text: currentT.chatGoingToPopular || "Showing the most popular Funko Pops!" };
    }

    // Direct search for short inputs
    if (lower.length > 1 && lower.length <= 30) {
      const directMatch = funkoData.find(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.series.some((s) => s.toLowerCase().includes(lower))
      );
      if (directMatch) {
        navigate(`/funko/${directMatch.id}`);
        setIsChatOpen(false);
        return {
          text: currentT.chatFoundItem?.replace("{item}", directMatch.title) || `Found "${directMatch.title}"! Taking you there...`,
        };
      }

      navigate(`/searchsite?q=${encodeURIComponent(lower)}`);
      setIsChatOpen(false);
      return {
        text: currentT.chatSearching?.replace("{query}", lower) || `Searching for "${lower}"...`,
      };
    }

    return {
      text:
        currentT.chatFallback ||
        'I can help you search, browse categories, or find popular Funko Pops! Try "Search Batman" or "Categories".',
      buttons: [
        { label: currentT.buttonDashboard || "Dashboard", action: () => navigate("/dashboardSite") },
        {
          label: currentT.buttonSearch || "Search",
          action: () => {
            setIsChatOpen(false);
            navigate("/searchsite");
          },
        },
      ],
    };
  };

  const handleChatSend = (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { text: msg, sender: "user" }]);
    setInputValue("");
    setTimeout(() => {
      const botReply = getBotResponse(msg);
      setMessages((prev) => [...prev, { ...botReply, sender: "bot" }]);
    }, 400);
  };

  const quickActions = [
    { label: language === "PL" ? "Szukaj" : language === "RU" ? "Поиск" : "Search", icon: Search, action: () => handleChatSend("search batman") },
    { label: language === "PL" ? "Kategorie" : language === "RU" ? "Категории" : "Categories", icon: Folder, action: () => handleChatSend("categories") },
    { label: language === "PL" ? "Popularne" : language === "RU" ? "Популярные" : "Popular", icon: Flame, action: () => handleChatSend("popular") },
    { label: language === "PL" ? "Panel" : language === "RU" ? "Панель" : "Dashboard", icon: LayoutDashboard, action: () => handleChatSend("dashboard") },
  ];

  return (
    <Layout translations={t}>
      {/* Open-source banner */}
      {showOpenSourceBanner && (
        <div
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
            isDarkMode ? "bg-slate-800 text-slate-300" : "bg-blue-600 text-white"
          }`}
        >
          <span>
            This is an open-source project.{" "}
            <a
              href="https://github.com/Unkx/funko-react-app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80 transition-opacity"
            >
              View on GitHub
            </a>
            {" "}&mdash; contributions welcome!
          </span>
          <button
            onClick={() => {
              sessionStorage.setItem("openSourceDismissed", "1");
              setShowOpenSourceBanner(false);
            }}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-4 pt-12 pb-8 sm:pt-16 sm:pb-12 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className={`w-6 h-6 ${isDarkMode ? "text-amber-400" : "text-blue-500"}`} />
          <span className={`text-sm font-medium tracking-wide uppercase ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
            {t.welcomeSubtitle || "Your Funko Collection Hub"}
          </span>
        </div>
        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-['Righteous'] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {t.welcomeTitle || "Discover & Collect"}
        </h2>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          {t.welcomeDescription || "Browse thousands of Funko Pop figures, track your collection, and find your next favorite."}
        </p>
      </section>

      {/* Random Items */}
      <section className="px-4 pb-12 max-w-6xl mx-auto w-full">
        <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center font-['Righteous'] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {t.randomItems || "Random Items"}
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className={`animate-spin rounded-full h-10 w-10 border-2 border-t-transparent ${isDarkMode ? "border-amber-400" : "border-blue-600"}`} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {randomItems.map((item) => (
              <Link
                key={item.id}
                to={`/funko/${item.id}`}
                onClick={() => incrementVisitCount(item.id)}
                className={`group block rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:border-amber-400/30"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-blue-100"
                }`}
              >
                <div className={`p-4 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                  <img
                    src={item.imageName}
                    alt={item.title}
                    className="w-full h-44 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={() => markImageBroken(item.id)}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    #{item.number} &middot; {item.series.join(", ")}
                  </p>
                  {item.exclusive && (
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {t.exclusive || "Exclusive"}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            <Link
              to="/categories"
              className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 hover:-translate-y-1 min-h-[200px] ${
                isDarkMode
                  ? "border-slate-700 hover:border-amber-400/50 text-slate-400 hover:text-amber-400"
                  : "border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600"
              }`}
            >
              <LayoutDashboard className="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
              <span className="font-semibold text-sm">{t.goToCategories || "Browse Categories"}</span>
            </Link>
          </div>
        )}
      </section>

      {/* Most Visited */}
      <section className={`px-4 py-12 ${isDarkMode ? "bg-slate-800/50" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center font-['Righteous'] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {t.mostVisited || "Most Visited"}
          </h2>
          {mostVisitedItems.length === 0 ? (
            <p className={`text-center text-sm ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              {t.noVisitsYet || "No items visited yet. Start exploring!"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {mostVisitedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  onClick={() => incrementVisitCount(item.id)}
                  className={`group block rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 hover:border-amber-400/30"
                      : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-blue-100"
                  }`}
                >
                  <div className={`p-4 ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}>
                    <img
                      src={item.imageName}
                      alt={item.title}
                      className="w-full h-44 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={() => markImageBroken(item.id)}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                    <p className={`text-xs mt-1 truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      #{item.number} &middot; {item.series.join(", ")}
                    </p>
                    {item.exclusive && (
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode ? "bg-amber-400/15 text-amber-400" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {t.exclusive || "Exclusive"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              <Link
                to="/mostVisited"
                className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 hover:-translate-y-1 min-h-[200px] ${
                  isDarkMode
                    ? "border-slate-700 hover:border-amber-400/50 text-slate-400 hover:text-amber-400"
                    : "border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600"
                }`}
              >
                <TrendingUp className="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
                <span className="font-semibold text-sm">{t.goToMostVisited || "View All Popular"}</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Chatbot */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6" onClick={() => setIsChatOpen(false)}>
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col h-[70vh] max-h-[600px] border overflow-hidden ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div
              className={`px-4 py-3 flex justify-between items-center ${
                isDarkMode ? "bg-amber-400 text-slate-900" : "bg-blue-600 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">PopBot</span>
                <span className="text-xs opacity-75">{language}</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 rounded hover:opacity-70 transition-opacity" aria-label="Close chat">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className={`flex-grow p-4 overflow-y-auto space-y-3 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
              {messages.length === 0 ? (
                <div className={`text-sm text-center py-8 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  {t.chatWelcome || 'Hello! Ask me anything about Funko Pops. Try: "Search for Marvel"'}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === "user"
                          ? isDarkMode
                            ? "bg-amber-400 text-slate-900 rounded-br-md"
                            : "bg-blue-600 text-white rounded-br-md"
                          : isDarkMode
                            ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {typeof msg.text === "string"
                        ? msg.text.split("\n").map((line, j) => (
                            <p key={j} className={j > 0 ? "mt-1" : ""}>
                              {line}
                            </p>
                          ))
                        : msg.text}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {msg.buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                btn.action();
                                setIsChatOpen(false);
                              }}
                              className={`w-full text-xs font-medium py-2 px-3 rounded-lg transition-colors ${
                                isDarkMode
                                  ? "bg-amber-400/15 hover:bg-amber-400/25 text-amber-400"
                                  : "bg-blue-50 hover:bg-blue-100 text-blue-700"
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

            {/* Chat Input */}
            <div className={`p-3 border-t ${isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChatSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.chatPlaceholder || "Ask about Funko Pops..."}
                  className={`flex-grow px-3 py-2 rounded-lg text-sm outline-none border transition-colors ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400/50"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400"
                  }`}
                  aria-label="Chat input"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsChatOpen(false);
                  }}
                />
                <button
                  type="submit"
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickActions.map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      isDarkMode
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat FAB */}
      {!isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            if (messages.length === 0) {
              setMessages([
                {
                  text: t.chatWelcome || "Hello! Ask me anything about Funko Pops!",
                  sender: "bot",
                  buttons: [
                    { label: t.buttonDashboard || "Dashboard", action: () => navigate("/dashboardSite") },
                    { label: t.buttonLogin || "Login", action: () => navigate("/loginRegisterSite") },
                    { label: t.buttonSearch || "Search", action: () => navigate("/searchsite") },
                  ],
                },
              ]);
            }
          }}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </Layout>
  );
};

export default WelcomeSite;
