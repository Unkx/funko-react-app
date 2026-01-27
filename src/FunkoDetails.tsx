// FunkoDetails.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { translations } from "./Translations/TranslationsFunkoDetails";
import useBreakpoints from "./useBreakpoints";
import axios from "axios";

// Icons
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

const baseURL = import.meta.env.VITE_API_BASE_URL;
if (!baseURL) {
  console.warn("VITE_API_BASE_URL is not set, using default localhost URL");
}
const api = axios.create({
  baseURL: baseURL || "http://localhost:5000",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (
    config.url &&
    !config.url.startsWith("/api") &&
    !config.url.startsWith("http")
  ) {
    config.url = `/api${config.url}`;
  }
  return config;
});

// Types
interface FunkoItem {
  title: string;
  number: string;
  category: string;
  series?: string[];
  exclusive?: boolean;
  imageName?: string | null;
}
interface FunkoItemWithId extends FunkoItem {
  id: string;
}
interface PricePoint {
  date: string;
  price: number;
  shop: string;
  country: string;
  currency: string;
}
interface Shop {
  name: string;
  url: string;
  searchUrl: string;
  currency: string;
  priceSelector?: string;
  apiEndpoint?: string;
}
interface ScrapedPrice {
  price: number;
  currency: string;
  shop: string;
  country: string;
  date: string;
}

const FunkoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  
  // State declarations
  const [funkoItem, setFunkoItem] = useState<FunkoItemWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    return savedTheme ? savedTheme === "dark" : true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(
    localStorage.getItem("preferredLanguage") || "EN"
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCollection, setInCollection] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [isScrapingPrices, setIsScrapingPrices] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scrapingResults, setScrapingResults] = useState<ScrapedPrice[]>([]);
  const [selectedCountries, setSelectedCountries] = useState(['poland', 'germany', 'france']);
  const [relatedItems, setRelatedItems] = useState<FunkoItemWithId[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });

  // Refs
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  const t = translations[language] || translations["EN"];

  // Country configuration
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

  // Languages for dropdown
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

  const shops: Record<string, Shop[]> = {
    canada: [
      { 
        name: 'EB Games / GameStop CA', 
        url: 'ebgames.ca', 
        searchUrl: 'https://www.ebgames.ca/SearchResult/Quicksearch?q=', 
        currency: 'CAD',
        priceSelector: '.price'
      },
      { 
        name: 'Amazon Canada', 
        url: 'amazon.ca', 
        searchUrl: 'https://www.amazon.ca/s?k=', 
        currency: 'CAD',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Pop In A Box CA', 
        url: 'popinabox.ca', 
        searchUrl: 'https://www.popinabox.ca/search?q=', 
        currency: 'CAD',
        priceSelector: '.price'
      },
      { 
        name: 'MyPops.ca', 
        url: 'mypops.ca', 
        searchUrl: 'https://www.mypops.ca/search?q=', 
        currency: 'CAD',
        priceSelector: '.price'
      },
      { 
        name: 'Funko Official CA', 
        url: 'funko.com/ca', 
        searchUrl: 'https://funko.com/ca/search?q=', 
        currency: 'CAD',
        priceSelector: '.price'
      }
    ],
    poland: [
      { 
        name: 'Empik', 
        url: 'empik.com', 
        searchUrl: 'https://www.empik.com/szukaj/produkty?q=', 
        currency: 'PLN',
        priceSelector: '.price'
      },
      { 
        name: 'Allegro', 
        url: 'allegro.pl', 
        searchUrl: 'https://allegro.pl/listing?string=', 
        currency: 'PLN',
        priceSelector: '[data-analytics-view-value]'
      },
      { 
        name: 'Media Markt PL', 
        url: 'mediamarkt.pl', 
        searchUrl: 'https://www.mediamarkt.pl/pl/search.html?query=', 
        currency: 'PLN',
        priceSelector: '.whole'
      },
      { 
        name: 'Merlin.pl', 
        url: 'merlin.pl', 
        searchUrl: 'https://merlin.pl/szukaj/?q=', 
        currency: 'PLN',
        priceSelector: '.price'
      }
    ],
    uk: [
      { 
        name: 'Forbidden Planet', 
        url: 'forbiddenplanet.com', 
        searchUrl: 'https://forbiddenplanet.com/catalog/?q=', 
        currency: 'GBP',
        priceSelector: '.price'
      },
      { 
        name: 'Game UK', 
        url: 'game.co.uk', 
        searchUrl: 'https://www.game.co.uk/en/search/?q=', 
        currency: 'GBP',
        priceSelector: '.productPrice'
      },
      { 
        name: 'Amazon UK', 
        url: 'amazon.co.uk', 
        searchUrl: 'https://www.amazon.co.uk/s?k=', 
        currency: 'GBP',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Smyths Toys UK', 
        url: 'smythstoys.com', 
        searchUrl: 'https://www.smythstoys.com/uk/en-gb/search/?text=', 
        currency: 'GBP',
        priceSelector: '.price'
      }
    ],
    usa: [
      { 
        name: 'Hot Topic', 
        url: 'hottopic.com', 
        searchUrl: 'https://www.hottopic.com/search?q=', 
        currency: 'USD',
        priceSelector: '.price'
      },
      { 
        name: 'GameStop US', 
        url: 'gamestop.com', 
        searchUrl: 'https://www.gamestop.com/search/?q=', 
        currency: 'USD',
        priceSelector: '.actual-price'
      },
      { 
        name: 'Target', 
        url: 'target.com', 
        searchUrl: 'https://www.target.com/s?searchTerm=', 
        currency: 'USD',
        priceSelector: '[data-test="product-price"]'
      },
      { 
        name: 'Amazon US', 
        url: 'amazon.com', 
        searchUrl: 'https://www.amazon.com/s?k=', 
        currency: 'USD',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Funko Official', 
        url: 'funko.com', 
        searchUrl: 'https://funko.com/search?q=', 
        currency: 'USD',
        priceSelector: '.price'
      }
    ],
    germany: [
      { 
        name: 'Amazon DE', 
        url: 'amazon.de', 
        searchUrl: 'https://www.amazon.de/s?k=', 
        currency: 'EUR',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'MediaMarkt DE', 
        url: 'mediamarkt.de', 
        searchUrl: 'https://www.mediamarkt.de/de/search.html?query=', 
        currency: 'EUR',
        priceSelector: '.whole'
      },
      { 
        name: 'Saturn', 
        url: 'saturn.de', 
        searchUrl: 'https://www.saturn.de/de/search.html?query=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Müller', 
        url: 'mueller.de', 
        searchUrl: 'https://www.mueller.de/suche/?q=', 
        currency: 'EUR',
        priceSelector: '.price'
      }
    ],
    france: [
      { 
        name: 'Fnac', 
        url: 'fnac.com', 
        searchUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Amazon FR', 
        url: 'amazon.fr', 
        searchUrl: 'https://www.amazon.fr/s?k=', 
        currency: 'EUR',
        priceSelector: '.a-price-whole'
      },
      { 
        name: 'Micromania', 
        url: 'micromania.fr', 
        searchUrl: 'https://www.micromania.fr/search?text=', 
        currency: 'EUR',
        priceSelector: '.price'
      },
      { 
        name: 'Cultura', 
        url: 'cultura.com', 
        searchUrl: 'https://www.cultura.com/catalogsearch/result/?q=', 
        currency: 'EUR',
        priceSelector: '.price'
      }
    ],
    russia: [
      { 
        name: 'Ozon', 
        url: 'ozon.ru', 
        searchUrl: 'https://www.ozon.ru/search/?text=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'Wildberries', 
        url: 'wildberries.ru', 
        searchUrl: 'https://www.wildberries.ru/catalog/0/search.aspx?search=', 
        currency: 'RUB',
        priceSelector: '.price'
      },
      { 
        name: 'Yandex Market', 
        url: 'market.yandex.ru', 
        searchUrl: 'https://market.yandex.ru/search?text=', 
        currency: 'RUB',
        priceSelector: '.price'
      }
    ]
  };

  const shoppingCountries = {
    canada: { name: 'Canada', flag: '🇨🇦' },
    poland: { name: 'Poland', flag: '🇵🇱' },
    uk: { name: 'United Kingdom', flag: '🇬🇧' },
    usa: { name: 'United States', flag: '🇺🇸' },
    germany: { name: 'Germany', flag: '🇩🇪' },
    france: { name: 'France', flag: '🇫🇷' },
    russia: { name: 'Russia', flag: '🇷🇺' }
  };

  const generateId = (title: string, number: string): string => {
    const safeTitle = title ? title.trim() : "";
    const safeNumber = number ? number.trim() : "";
    return `${safeTitle}-${safeNumber}`
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      } else {
        return [...prev, countryCode];
      }
    });
  };

  const findRelatedItems = (currentItem: FunkoItemWithId, allItems: FunkoItemWithId[]) => {
    if (!currentItem || !allItems || allItems.length === 0) return [];
    
    const related = allItems.filter(item => {
      if (item.id === currentItem.id) return false;
      
      const currentSeries = currentItem.series?.map(s => s.toLowerCase()) || [];
      const itemSeries = item.series?.map(s => s.toLowerCase()) || [];
      const sharedSeries = currentSeries.some(series => itemSeries.includes(series));
      
      const sameCategory = currentItem.category?.toLowerCase() === item.category?.toLowerCase();
      
      const titleWords = currentItem.title?.toLowerCase().split(/\s+/) || [];
      const hasCommonWords = titleWords.some(word => 
        word.length > 3 && item.title?.toLowerCase().includes(word)
      );
      
      if (sharedSeries) return true;
      if (sameCategory && hasCommonWords) return true;
      if (hasCommonWords) return true;
      return false;
    });
    
    related.sort((a, b) => {
      const currentSeries = currentItem.series?.map(s => s.toLowerCase()) || [];
      
      const aSeries = a.series?.map(s => s.toLowerCase()) || [];
      const aHasSharedSeries = currentSeries.some(series => aSeries.includes(series));
      
      const bSeries = b.series?.map(s => s.toLowerCase()) || [];
      const bHasSharedSeries = currentSeries.some(series => bSeries.includes(series));
      
      if (aHasSharedSeries && !bHasSharedSeries) return -1;
      if (!aHasSharedSeries && bHasSharedSeries) return 1;
      
      const aSameCategory = currentItem.category?.toLowerCase() === a.category?.toLowerCase();
      const bSameCategory = currentItem.category?.toLowerCase() === b.category?.toLowerCase();
      
      if (aSameCategory && !bSameCategory) return -1;
      if (!aSameCategory && bSameCategory) return 1;
      
      return 0;
    });
    
    return related.slice(0, 6);
  };

  const extractSearchParamsFromId = (id: string) => {
    const parts = id.replace(/[^a-zA-Z0-9\s-]/g, '').split('-').filter(p => p.length > 0);
    
    // Znajdź część numeryczną, ale pomiń "null"
    const numberPart = parts.find(part => /^\d+$/.test(part) && part !== "null") || '';
    
    // Filtruj części, które nie są numerami ani "null"
    const titleParts = parts.filter(part => 
      !/^\d+$/.test(part) && 
      part.toLowerCase() !== "null" && 
      part.toLowerCase() !== "undefined" &&
      part.length > 0
    );
    
    return {
      title: titleParts.join(' ') || id.replace(/-/g, ' '),
      number: numberPart
    };
  };

const fetchData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    if (!id) {
      throw new Error("No ID provided");
    }
    
    const cleanId = id.replace(/[^\w\s-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    console.log("🔍 Original ID:", id);
    console.log("🔍 Clean ID:", cleanId);
    
    const searchParams = extractSearchParamsFromId(cleanId);
    console.log("🔍 Extracted params:", searchParams);
    console.log("🔍 Number valid?", 
      searchParams.number && 
      searchParams.number !== "null" && 
      /^\d+$/.test(searchParams.number)
    );
      try {
        const response = await api.get(`/api/items/${encodeURIComponent(cleanId)}`);
        console.log("✅ Found item in database:", response.data);
        setFunkoItem(response.data);
        
        try {
          const allItemsResponse = await api.get('/api/items');
          if (allItemsResponse.data && Array.isArray(allItemsResponse.data)) {
            const related = findRelatedItems(response.data, allItemsResponse.data);
            setRelatedItems(related);
          }
        } catch (relatedError) {
          console.warn("Could not load related items:", relatedError);
        }
        
        return;
      } catch (apiError: any) {
        console.warn("❌ Database lookup failed:", apiError.response?.status);
      }
      
      console.log("⚠️ Item not in database, fetching from GitHub...");
      const externalResponse = await fetch(
        "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
      );
      
      if (!externalResponse.ok) {
        throw new Error(`GitHub API failed: ${externalResponse.status}`);
      }
      
      const allItems: FunkoItem[] = await externalResponse.json();
      const dataWithIds: FunkoItemWithId[] = allItems.map((item) => ({
        ...item,
        id: generateId(item.title, item.number),
      }));
      
      let foundItem: FunkoItemWithId | undefined;
      
      foundItem = dataWithIds.find((item) => item.id === cleanId);
      
      if (!foundItem) {
        foundItem = dataWithIds.find((item) => 
          item.id.toLowerCase() === cleanId.toLowerCase()
        );
      }
      
      if (!foundItem) {
        const searchParams = extractSearchParamsFromId(cleanId);
        console.log("🔍 Searching with params:", searchParams);
        
        foundItem = dataWithIds.find((item) => {
          const titleMatch = item.title.toLowerCase().includes(searchParams.title.toLowerCase());
          const numberMatch = !searchParams.number || item.number === searchParams.number;
          return titleMatch && numberMatch;
        });
      }
      
      if (!foundItem) {
        const searchParams = extractSearchParamsFromId(cleanId);
        const titleWords = searchParams.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
        foundItem = dataWithIds.find((item) => {
          const itemTitleLower = item.title.toLowerCase();
          return titleWords.every(word => itemTitleLower.includes(word));
        });
      }
      
      if (!foundItem) {
        throw new Error("Item not found in any source");
      }
      
      console.log("✅ Found item in external JSON:", foundItem.title);
      setFunkoItem(foundItem);
      
      const related = findRelatedItems(foundItem, dataWithIds);
      setRelatedItems(related);
      
      try {
        const token = localStorage.getItem("token");
        if (token) {
          await api.post('/api/items/sync-single', {
            item: foundItem
          });
          console.log("✅ Item synced to database");
        }
      } catch (syncError) {
        console.warn("⚠️ Could not sync item to database:", syncError);
      }
      
    } catch (err: any) {
      console.error("❌ All fetch methods failed:", err);
      setError(err.message || "Failed to load item");
    } finally {
      setIsLoading(false);
    }
};

const generateDescription = async (title: string, number: string, category: string = "", targetLang: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error("Brak klucza API (VITE_AI_API_KEY w .env)");

  const langNames: Record<string, string> = {
    PL: "polski",
    EN: "English",
    FR: "français",
    DE: "Deutsch",
    ES: "español",
    RU: "русский",
  };

  const isValidNumber = number && 
                       number.trim() !== "" && 
                       number.toLowerCase() !== "null" && 
                       number.toLowerCase() !== "undefined" &&
                       number.toLowerCase() !== "n/a" &&
                       /^[\d#\-]+$/.test(number.trim());

  const itemType = determineItemType(title, category);
  
  const itemTypeLabels: Record<string, string> = {
    funko_pop: 'Funko Pop! vinyl figure',
    blind_bag: 'blind bag collectible',
    my_moji: 'MyMoji collectible figure',
    action_figure: 'action figure',
    plush_toy: 'plush toy',
    vinyl_figure: 'vinyl figure',
    collectible: 'collectible item'
  };

  const itemTypeLabel = itemTypeLabels[itemType] || 'collectible item';

  const prompt = `Jesteś ekspertem od przedmiotów kolekcjonerskich. Napisz szczegółowy, wciągający opis produktu w języku ${langNames[targetLang] || targetLang.toLowerCase()} dla ${itemTypeLabel}.

PRODUKT: "${title}" ${isValidNumber ? `(numer przedmiotu: ${number})` : ''}
${category ? `KATEGORIA: ${category}` : ''}

=== WYMAGANIA CO DO DŁUGOŚCI I JAKOŚCI ===
1. Napisz 5-8 PEŁNYCH, dobrze rozwiniętych zdań
2. Każde zdanie musi mieć przynajmniej 8-15 słów
3. Opis musi być szczegółowy i informacyjny
4. Zawsze kończ zdania właściwą interpunkcją (. ! ?)
5. NIGDY nie przerywaj w połowie myśli

=== STRUKTURA OPISU ===
1. Wprowadzenie: Przedstaw przedmiot i jego znaczenie w kulturze/fandomie
2. Opis wyglądu: Szczegóły designu, kolory, detale
3. Specjalne cechy: Co wyróżnia ten przedmiot (metallic, glow-in-the-dark, exclusive)
4. Kolekcjonerskość: Rzadkość, limitowane wydanie, numeracja
5. Wartość: Dlaczego kolekcjonerzy tego chcą
6. Zakończenie: Podsumowanie i zachęta dla kolekcjonerów

=== PRZYKŁAD DOBREGO OPISU ===
"The T-1000 Officer (Metallic) Funko Pop! figure is a stunning representation of the iconic liquid metal assassin from Terminator 2: Judgment Day. This exceptional collectible features a brilliant metallic silver finish that perfectly captures the character's shapeshifting abilities and futuristic aesthetic. The detailed sculpting showcases the police uniform with remarkable accuracy, from the badge to the perfectly replicated facial features. As part of the exclusive Metallic series, this figure is highly sought after by both Terminator enthusiasts and serious Funko collectors alike. Its limited production run and special finish make it a standout piece that commands attention in any display. The figure's substantial weight and premium paint application demonstrate the quality craftsmanship that fans have come to expect from these collectibles. Owning this metallic variant represents a significant milestone for collectors pursuing complete Terminator sets. This is undoubtedly a centerpiece item that would elevate any science fiction collection to new heights."

=== INSTRUKCJE SPECJALNE ===
- Bądź entuzjastyczny ale precyzyjny
- Wymień konkretne detale designu
- Opisz uczucia kolekcjonera posiadającego ten przedmiot
- Dodaj kontekst z uniwersum/franczyzy
- Zakończ mocnym, przekonującym zdaniem

Teraz napisz szczegółowy opis dla "${title}". Pamiętaj: 5-8 PEŁNYCH zdań, szczegółowy, bogaty w informacje!`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ 
          role: "system", 
          content: `Jesteś pisarzem specjalizującym się w opisach przedmiotów kolekcjonerskich. Twoje opisy są zawsze:
1. Szczegółowe i informacyjne (5-8 pełnych zdań)
2. Entuzjastyczne ale precyzyjne
3. Zawsze kończysz zdania właściwą interpunkcją
4. Dodajesz kontekst kulturowy/franczyzowy
5. Wspominasz o szczegółach designu i kolekcjonerskości`
        }, { 
          role: "user", 
          content: prompt 
        }],
        max_tokens: 600, // Zwiększono na 600 tokenów dla dłuższych opisów
        temperature: 0.8, // Nieco wyższa temperatura dla bardziej kreatywnych opisów
        top_p: 0.9,
        frequency_penalty: 0.2, // Zmniejsza powtarzanie
        presence_penalty: 0.1, // Zachęca do różnorodności
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      throw new Error("AI description could not be generated");
    }

    const data = await response.json();
    let description = data.choices[0].message.content.trim();
    
    // Sprawdź i popraw kompletność
    description = ensureCompleteDescription(description, title, itemTypeLabel, category);
    
    return description;
  } catch (error) {
    console.error("AI generation error:", error);
    // Dłuższy, bardziej szczegółowy fallback
    return createDetailedFallback(title, itemTypeLabel, category, isValidNumber ? number : '');
  }
};

// Funkcja pomocnicza do zapewnienia kompletności
const ensureCompleteDescription = (description: string, title: string, itemTypeLabel: string, category: string): string => {
  if (!description) {
    return createDetailedFallback(title, itemTypeLabel, category, '');
  }
  
  // Sprawdź czy opis kończy się kropką
  if (!/[.!?]$/.test(description.trim())) {
    description = description.trim() + ".";
  }
  
  // Sprawdź liczbę zdań
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Jeśli mniej niż 4 zdania, rozszerz opis
  if (sentences.length < 4) {
    const extensions = [
      ` ${title} features exceptional attention to detail that collectors truly appreciate.`,
      ` The craftsmanship and quality of this ${itemTypeLabel} make it a standout piece in any collection.`,
      ` Displaying this item would add significant value and visual appeal to any collector's showcase.`,
      ` Its design perfectly captures the essence of what makes collectibles so desirable to enthusiasts.`,
      ` This piece represents not just a purchase, but an investment in pop culture history.`
    ];
    
    // Dodaj 1-2 rozszerzenia losowo
    const randomExtensions = [...extensions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    description += randomExtensions.join('');
  }
  
  // Upewnij się, że ostatnie zdanie jest mocne
  const lastSentence = sentences[sentences.length - 1];
  const strongEndings = [
    "This is undoubtedly a must-have centerpiece for any serious collector.",
    "Every collector would be proud to display this exceptional piece in their collection.",
    "Acquiring this item represents a significant achievement for any collecting enthusiast.",
    "This collectible stands as a testament to fine craftsmanship and pop culture significance."
  ];
  
  if (!lastSentence || lastSentence.length < 15) {
    const randomEnding = strongEndings[Math.floor(Math.random() * strongEndings.length)];
    description = description.replace(/[.!?]*$/, '. ' + randomEnding);
  }
  
  return description;
};

// Funkcja tworząca szczegółowy fallback
const createDetailedFallback = (title: string, itemTypeLabel: string, category: string, number: string): string => {
  const baseDescription = `${title} is an exceptional ${itemTypeLabel} that commands attention with its detailed design and premium craftsmanship. `;
  
  const details = [
    `The figure showcases intricate sculpting and vibrant colors that bring the character to life in stunning detail. `,
    `As ${number ? `item #${number} ` : ''}${category ? `in the ${category} series, ` : ''}this collectible represents a significant piece for any enthusiast. `,
    `Its substantial weight and high-quality materials demonstrate the care put into its production. `,
    `Collectors will appreciate both the aesthetic appeal and investment potential of this remarkable piece. `,
    `Displaying this item would elevate any collection and serve as a conversation starter among fellow enthusiasts. `,
    `The attention to detail in every aspect of this ${itemTypeLabel} makes it a true standout in the world of collectibles. `
  ];
  
  // Wybierz 4-5 losowych szczegółów
  const selectedDetails = [...details]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4 + Math.floor(Math.random() * 2));
  
  const ending = `This is undoubtedly a must-have acquisition for any serious collector seeking to enhance their curated collection with a piece of exceptional quality and cultural significance.`;
  
  return baseDescription + selectedDetails.join('') + ending;
};

// W useEffect dodaj sprawdzanie długości
useEffect(() => {
  const generateIfNeeded = async () => {
    if (!funkoItem || !language) return;
    
    const cacheKey = `ai_desc_${funkoItem.id}_${language}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Sprawdź czy zapisany opis jest wystarczająco długi
    if (cached && isDescriptionSufficient(cached)) {
      setAiDescription(cached);
      return;
    }
    
    // Jeśli zapisany opis jest za krótki, usuń go
    if (cached && !isDescriptionSufficient(cached)) {
      localStorage.removeItem(cacheKey);
    }

    setIsGenerating(true);
    try {
      const isValidNumber = funkoItem.number && 
                           funkoItem.number.trim() !== "" && 
                           funkoItem.number.toLowerCase() !== "null" && 
                           funkoItem.number.toLowerCase() !== "undefined" &&
                           funkoItem.number.toLowerCase() !== "n/a" &&
                           /^[\d#\-]+$/.test(funkoItem.number.trim());
      
      const numberToUse = isValidNumber ? funkoItem.number : "";
      const desc = await generateDescription(
        funkoItem.title, 
        numberToUse, 
        funkoItem.category || "", 
        language
      );
      
      // Sprawdź czy wygenerowany opis jest wystarczający
      if (isDescriptionSufficient(desc)) {
        setAiDescription(desc);
        localStorage.setItem(cacheKey, desc);
      } else {
        // Jeśli nie, użyj rozszerzonego fallbacka
        console.warn("Generated description too short, using enhanced fallback");
        const itemType = determineItemType(funkoItem.title, funkoItem.category || "");
        const itemTypeLabel = {
          funko_pop: 'Funko Pop! vinyl figure',
          blind_bag: 'blind bag collectible',
          my_moji: 'MyMoji collectible figure',
          action_figure: 'action figure',
          plush_toy: 'plush toy',
          vinyl_figure: 'vinyl figure',
          collectible: 'collectible item'
        }[itemType] || 'collectible item';
        
        const enhancedDesc = createDetailedFallback(
          funkoItem.title, 
          itemTypeLabel, 
          funkoItem.category || "", 
          numberToUse
        );
        setAiDescription(enhancedDesc);
        localStorage.setItem(cacheKey, enhancedDesc);
      }
    } catch (err) {
      console.error("Nie udało się wygenerować opisu:", err);
      // Użyj rozszerzonego fallbacka
      const itemType = determineItemType(funkoItem.title, funkoItem.category || "");
      const itemTypeLabel = {
        funko_pop: 'Funko Pop! vinyl figure',
        blind_bag: 'blind bag collectible',
        my_moji: 'MyMoji collectible figure',
        action_figure: 'action figure',
        plush_toy: 'plush toy',
        vinyl_figure: 'vinyl figure',
        collectible: 'collectible item'
      }[itemType] || 'collectible item';
      
      setAiDescription(createDetailedFallback(
        funkoItem.title, 
        itemTypeLabel, 
        funkoItem.category || "", 
        ''
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  generateIfNeeded();
}, [funkoItem, language]);

// Funkcja sprawdzająca czy opis jest wystarczająco długi
const isDescriptionSufficient = (description: string): boolean => {
  if (!description) return false;
  
  // Sprawdź czy kończy się znakiem interpunkcyjnym
  const endsWithPunctuation = /[.!?]$/.test(description.trim());
  
  // Sprawdź czy ma przynajmniej 5 zdań
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 8);
  
  // Sprawdź całkowitą długość (przynajmniej 400 znaków)
  const totalLength = description.length;
  
  return endsWithPunctuation && sentences.length >= 5 && totalLength >= 400;
};

// Dodaj funkcję sprawdzającą czy opis jest kompletny
const isDescriptionComplete = (description: string): boolean => {
  if (!description) return false;
  
  // Sprawdź czy kończy się znakiem interpunkcyjnym
  const endsWithPunctuation = /[.!?]$/.test(description.trim());
  
  // Sprawdź czy ma przynajmniej 3 zdania
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  return endsWithPunctuation && sentences.length >= 3;
};

  const scrapePrices = async () => {
    if (!funkoItem) return;
    setIsScrapingPrices(true);
    setScrapingProgress(0);
    setScrapingResults([]);
    const searchQuery = `${funkoItem.title || ""} ${funkoItem.number || ""} funko pop`.trim();
    const selectedShops = selectedCountries.flatMap(countryCode => 
      shops[countryCode]?.map(shop => ({ ...shop, country: countryCode })) || []
    );
    const results: ScrapedPrice[] = [];
    for (let i = 0; i < selectedShops.length; i++) {
      const shop = selectedShops[i];
      try {
        setScrapingProgress(Math.round((i / selectedShops.length) * 100));
        const response = await api.post('/scrape/price', {
          url: shop.searchUrl + encodeURIComponent(searchQuery),
          shop: shop.name,
          country: shop.country,
          currency: shop.currency,
          priceSelector: shop.priceSelector
        });
        if (response.data && response.data.price) {
          results.push({
            price: response.data.price,
            currency: response.data.currency || shop.currency,
            shop: shop.name,
            country: shop.country,
            date: new Date().toISOString().split('T')[0]
          });
        }
      } catch (error) {
        console.error(`Failed to scrape ${shop.name}:`, error);
      }
    }
    setScrapingResults(results);
    setIsScrapingPrices(false);
    setScrapingProgress(100);
    if (results.length > 0) {
      try {
        await api.post('/prices', {
          funkoId: funkoItem.id,
          prices: results
        });
        const updatedPriceHistory = [...priceHistory, ...results];
        setPriceHistory(updatedPriceHistory);
      } catch (error) {
        console.error("Failed to save prices:", error);
      }
    }
  };

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

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

  // Debug function to check user authentication
  const checkUserAuth = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    console.log("🔐 Auth Check:", {
      hasToken: !!token,
      hasUser: !!userData,
      user: userData ? JSON.parse(userData) : null,
      token: token ? `${token.substring(0, 20)}...` : null
    });
    return token && userData;
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert(t.loginRequiredMessage || "Please log in");
      navigate("/loginregistersite");
      return;
    }
    if (!funkoItem || isUpdatingWishlist) return;
    
    console.log("🔄 Toggling wishlist for:", funkoItem.id);
    setIsUpdatingWishlist(true);
    setCollectionError(null);
    
    try {
      if (inWishlist) {
        console.log("🗑️ Removing from wishlist");
        const response = await api.delete(`/wishlist/${funkoItem.id}`);
        console.log("✅ Wishlist remove response:", response.status);
      } else {
        console.log("➕ Adding to wishlist");
        const response = await api.post("/wishlist", {
          funkoId: funkoItem.id,
          title: funkoItem.title,
          number: funkoItem.number,
          imageName: funkoItem.imageName,
        });
        console.log("✅ Wishlist add response:", response.status);
        await awardPoints("wishlist_add", `Added "${funkoItem.title}" to wishlist`);
      }
      setInWishlist(!inWishlist);
    } catch (err: any) {
      console.error("❌ Wishlist error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Error updating wishlist.";
      setCollectionError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const toggleCollection = async () => {
    if (!user) {
      alert(t.loginRequiredMessage || "Please log in");
      navigate("/loginregistersite");
      return;
    }
    if (!funkoItem || isUpdatingCollection) return;

    setIsUpdatingCollection(true);
    setCollectionError(null);

    try {
      // 🔁 Ensure item exists in DB first
      if (!funkoItem.id.startsWith("http")) {
        try {
          await api.post('/api/items/sync-single', { item: funkoItem });
        } catch (syncErr) {
          console.warn("Sync before collection add failed:", syncErr);
          // Optional: still proceed if backend allows it
        }
      }

      if (inCollection) {
        await api.delete(`/collection/${funkoItem.id}`);
      } else {
        const response = await api.post("/collection", {
          funkoId: funkoItem.id,
          title: funkoItem.title,
          number: funkoItem.number,
          imageName: funkoItem.imageName,
        });
        console.log("✅ Collection add response:", response.data);
        await awardPoints("collection_add", `Added "${funkoItem.title}" to collection`);
      }

      setInCollection(!inCollection);
    } catch (err: any) {
      console.error("❌ Collection toggle error:", err);
      const errorMsg = err.response?.data?.error || err.message || t.updateError || "Error updating collection.";
      setCollectionError(errorMsg); // ✅ Now visible in UI
      alert(errorMsg);
    } finally {
      setIsUpdatingCollection(false);
    }
  };
  
  const loginButtonTo = useMemo(() => {
    if (user?.role === "admin") return "/adminSite";
    if (user?.role === "user") return "/dashboardSite";
    return "/loginregistersite";
  }, [user]);

  const loginButtonText = useMemo(() => {
    return user ? t.goToDashboard || "Dashboard" : t.goToLoginSite || "Log In";
  }, [t, user]);

  const awardPoints = async (actionType: string, details?: string) => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    try {
      await api.post("/loyalty/award-points", {
        actionType,
        details: details || `Performed action: ${actionType}`
      });
    } catch (err) {
      console.warn("Failed to award loyalty points:", err);
    }
  };

  // Check item status in collection and wishlist
  const checkItemStatus = async () => {
    if (!funkoItem || !user) return;
    
    console.log("🔍 Checking item status for:", funkoItem.id);
    
    try {
      const [wishlistRes, collectionRes] = await Promise.all([
        api.get(`/wishlist/check/${funkoItem.id}`),
        api.get(`/collection/check/${funkoItem.id}`),
      ]);
      
      console.log("📊 Item status:", {
        inWishlist: wishlistRes.data.exists,
        inCollection: collectionRes.data.exists
      });
      
      setInWishlist(wishlistRes.data.exists);
      setInCollection(collectionRes.data.exists);
    } catch (err: any) {
      console.error("❌ Error checking item status:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("🔐 Authentication failed, redirecting to login");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }
    }
  };

  // Effects
  useEffect(() => {
    if (id) {
      const visitCount = JSON.parse(localStorage.getItem("funkoVisitCount") || "{}");
      visitCount[id] = (visitCount[id] || 0) + 1;
      localStorage.setItem("funkoVisitCount", JSON.stringify(visitCount));
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (funkoItem && user) {
      checkItemStatus();
    }
  }, [funkoItem, user, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000);
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

  useEffect(() => {
    const awardVisitPoints = async () => {
      if (!user || !funkoItem) return;

      const visitPointsKey = `visit_points_awarded_${funkoItem.id}_${user.id}`;
      const lastAwarded = sessionStorage.getItem(visitPointsKey);

      if (lastAwarded) return;

      try {
        await awardPoints("item_view", `Viewed "${funkoItem.title}"`);
        sessionStorage.setItem(visitPointsKey, "true");
      } catch (err) {
        console.warn("Failed to award visit points:", err);
      }
    };

    awardVisitPoints();
  }, [user, funkoItem]);

  useEffect(() => {
    localStorage.setItem("preferredTheme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageDropdown &&
        languageDropdownRef.current && // POPRAWIONE: było languageDropdownRefopdownRef
        languageButtonRef.current &&
        !languageDropdownRef.current.contains(event.target as Node) && // POPRAWIONE
        !languageButtonRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLanguageDropdown]);

// W useEffect dodaj sprawdzanie długości
useEffect(() => {
  const generateIfNeeded = async () => {
    if (!funkoItem || !language) return;
    
    const cacheKey = `ai_desc_${funkoItem.id}_${language}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Sprawdź czy zapisany opis jest wystarczająco długi
    if (cached && isDescriptionSufficient(cached)) {
      setAiDescription(cached);
      return;
    }
    
    // Jeśli zapisany opis jest za krótki, usuń go
    if (cached && !isDescriptionSufficient(cached)) {
      localStorage.removeItem(cacheKey);
    }

    setIsGenerating(true);
    try {
      const isValidNumber = funkoItem.number && 
                           funkoItem.number.trim() !== "" && 
                           funkoItem.number.toLowerCase() !== "null" && 
                           funkoItem.number.toLowerCase() !== "undefined" &&
                           funkoItem.number.toLowerCase() !== "n/a" &&
                           /^[\d#\-]+$/.test(funkoItem.number.trim());
      
      const numberToUse = isValidNumber ? funkoItem.number : "";
      const desc = await generateDescription(
        funkoItem.title, 
        numberToUse, 
        funkoItem.category || "", 
        language
      );
      
      // Sprawdź czy wygenerowany opis jest wystarczający
      if (isDescriptionSufficient(desc)) {
        setAiDescription(desc);
        localStorage.setItem(cacheKey, desc);
      } else {
        // Jeśli nie, użyj rozszerzonego fallbacka
        console.warn("Generated description too short, using enhanced fallback");
        const itemType = determineItemType(funkoItem.title, funkoItem.category || "");
        const itemTypeLabel = {
          funko_pop: 'Funko Pop! vinyl figure',
          blind_bag: 'blind bag collectible',
          my_moji: 'MyMoji collectible figure',
          action_figure: 'action figure',
          plush_toy: 'plush toy',
          vinyl_figure: 'vinyl figure',
          collectible: 'collectible item'
        }[itemType] || 'collectible item';
        
        const enhancedDesc = createDetailedFallback(
          funkoItem.title, 
          itemTypeLabel, 
          funkoItem.category || "", 
          numberToUse
        );
        setAiDescription(enhancedDesc);
        localStorage.setItem(cacheKey, enhancedDesc);
      }
    } catch (err) {
      console.error("Nie udało się wygenerować opisu:", err);
      // Użyj rozszerzonego fallbacka
      const itemType = determineItemType(funkoItem.title, funkoItem.category || "");
      const itemTypeLabel = {
        funko_pop: 'Funko Pop! vinyl figure',
        blind_bag: 'blind bag collectible',
        my_moji: 'MyMoji collectible figure',
        action_figure: 'action figure',
        plush_toy: 'plush toy',
        vinyl_figure: 'vinyl figure',
        collectible: 'collectible item'
      }[itemType] || 'collectible item';
      
      setAiDescription(createDetailedFallback(
        funkoItem.title, 
        itemTypeLabel, 
        funkoItem.category || "", 
        ''
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  generateIfNeeded();
}, [funkoItem, language]);

// Helper function poza komponentem
const determineItemType = (title: string, category?: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerCategory = category ? category.toLowerCase() : "";
  
  if (lowerTitle.includes('funko') || lowerTitle.includes('pop!') || lowerCategory.includes('funko')) {
    return 'funko_pop';
  }
  if (lowerTitle.includes('blind bag') || lowerTitle.includes('mystery box') || lowerCategory.includes('blind')) {
    return 'blind_bag';
  }
  if (lowerTitle.includes('my moji') || lowerCategory.includes('mymoji')) {
    return 'my_moji';
  }
  if (lowerTitle.includes('action figure') || lowerCategory.includes('figure')) {
    return 'action_figure';
  }
  if (lowerTitle.includes('plush') || lowerCategory.includes('plush')) {
    return 'plush_toy';
  }
  return 'collectible';
};

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800" : "bg-neutral-100"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${
            isDarkMode ? "border-yellow-500" : "border-green-600"
          }`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-100 text-black"
        }`}
      >
        <div className="text-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-yellow-500 text-black"
                : "bg-green-600 text-white"
            }`}
          >
            {t.backButton}
          </button>
        </div>
      </div>
    );
  }

  if (!funkoItem) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-neutral-100 text-black"
        }`}
      >
        <p>Error: Funko Pop data not available.</p>
        <button
          onClick={() => navigate(-1)}
          className={`px-4 py-2 rounded ${
            isDarkMode
              ? "bg-yellow-500 text-black"
              : "bg-green-600 text-white"
          }`}
        >
          {t.backButton}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-blue-100 text-black"
      }`}
    >
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

                      {/* <button
                        onClick={() => navigate(loginButtonTo)}
                        className={`flex items-center gap-2 px-4 py-2 rounded ${
                          isDarkMode
                            ? "bg-yellow-500 text-black hover:bg-yellow-600"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {loginButtonText}
                      </button> */}
                      <AuthButton isDarkMode={isDarkMode} translations={t} />
                    </div>
          </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Product Overview Section */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Section - First column */}
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-lg ${
                isDarkMode 
                  ? "bg-gray-600 border border-gray-500" 
                  : "bg-white border-2 border-green-100 shadow-md"
              }`}>
                {funkoItem.imageName ? (
                  <img
                    src={funkoItem.imageName}
                    alt={funkoItem.title}
                    className={`rounded-lg w-full h-auto max-h-96 object-contain transition-all duration-300 ${
                      isDarkMode 
                        ? "filter brightness-90" 
                        : "filter brightness-105 shadow-lg"
                    }`}
                  />
                ) : (
                  <div className={`w-full h-64 rounded-lg flex items-center justify-center ${
                    isDarkMode ? "bg-gray-500" : "bg-green-50 border-2 border-green-200"
                  }`}>
                    <p className={isDarkMode ? "text-gray-300" : "text-green-600"}>
                      {t.noImageAvailable}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details Section - Second column */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-4">{funkoItem.title}</h1>
              
              {/* Error Message */}
              {collectionError && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
                }`}>
                  <p className="text-sm">{collectionError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={toggleWishlist}
                  disabled={isUpdatingWishlist}
                  className={`px-6 py-3 rounded-lg flex-1 font-semibold transition-all ${
                    inWishlist
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-purple-500 hover:bg-purple-600 text-white"
                  } ${isUpdatingWishlist ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isUpdatingWishlist ? "..." : (inWishlist ? t.removeFromWishlist : t.addToWishlist)}
                </button>
                <button
                  onClick={toggleCollection}
                  disabled={isUpdatingCollection}
                  className={`px-6 py-3 rounded-lg flex-1 font-semibold transition-all ${
                    inCollection
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  } ${isUpdatingCollection ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isUpdatingCollection ? "..." : (inCollection ? t.removeFromCollection : t.addToCollection)}
                </button>
              </div>

              {/* Debug Info (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className={`mb-4 p-3 rounded text-xs ${
                  isDarkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-600"
                }`}>
                  <p>Item ID: {funkoItem.id}</p>
                  <p>Status: {inCollection ? "In Collection" : "Not in Collection"}</p>
                  <p>User: {user ? user.login : "Not logged in"}</p>
                </div>
              )}

              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-green-400">{t.details}</h2>
                  <div className="space-y-3">
                    <p><span className="font-medium">{t.number}:</span> <span className="text-lg font-bold">{funkoItem.number}</span></p>
                    <p><span className="font-medium">{t.category}:</span> {funkoItem.category}</p>
                    <p><span className="font-medium">{t.series}:</span> {funkoItem.series?.join(", ")}</p>
                    {funkoItem.exclusive && (
                      <span className="inline-block px-3 py-1 rounded-full text-sm bg-yellow-500 text-black font-semibold">
                        ⭐ {t.exclusive}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-green-400">{t.additionalInformation}</h2>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-600" : "bg-green-50 border border-green-100"
                  }`}>
                    <p className="text-sm">
                      This collectible figure features detailed design and is part of the popular Funko Pop! vinyl collection.
                      Perfect for display and adding to your growing collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Description Section */}
        {(isGenerating || aiDescription) && (
          <div className={`p-6 rounded-lg shadow-lg mb-8 ${
            isDarkMode ? "bg-gray-700 border-l-4 border-purple-400" : "bg-white border-l-4 border-purple-500"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-purple-400" : "bg-purple-500"
              }`}>
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h2 className="text-xl font-semibold">
                {isGenerating ? "Generating Description..." : "AI-Powered Description"}
              </h2>
            </div>
            
            {isGenerating && (
              <div className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-600" : "bg-blue-50 border border-blue-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  <p className="text-purple-600 dark:text-purple-300">
                    Analyzing collectible information...
                  </p>
                </div>
              </div>
            )}
            
            {aiDescription && (
              <div className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-600" : "bg-gray-50 border border-gray-200"
              }`}>
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {aiDescription}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-500">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    🤖 AI-generated description for collectors • Refresh page to regenerate
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shopping Links Section */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🛒</span>
            {t.searchOnShoppingSites}
          </h2>
          
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">{t.searchInCountries}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(shoppingCountries).map(([code, country]) => (
                <button
                  key={code}
                  onClick={() => handleCountryToggle(code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCountries.includes(code)
                      ? isDarkMode 
                        ? "bg-yellow-500 text-black shadow-lg" 
                        : "bg-green-600 text-white shadow-lg"
                      : isDarkMode 
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {country.flag} {country.name}
                </button>
              ))}
            </div>
          </div>

          {scrapingResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">💰 {t.currentPrices}</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {scrapingResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      isDarkMode 
                        ? "border-green-400 bg-gray-600" 
                        : "border-green-500 bg-green-50 shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{result.shop}</h3>
                        <p className="text-xs text-gray-500">
                          {shoppingCountries[result.country as keyof typeof shoppingCountries]?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {result.price} {result.currency}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {t.updated}: {result.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedCountries.flatMap(countryCode => {
              const countryShops = shops[countryCode];
              if (!countryShops) return [];
              return countryShops.map((shop, index) => {
                const searchQuery = `${funkoItem.title || ""} ${funkoItem.number || ""} funko pop`.trim();
                const searchUrl = shop.searchUrl + encodeURIComponent(searchQuery);
                return (
                  <div
                    key={`${countryCode}-${index}`}
                    className={`p-4 rounded-lg border-l-4 transition-all ${
                      isDarkMode 
                        ? "border-gray-500 bg-gray-600 hover:bg-gray-500" 
                        : "border-gray-300 bg-gray-50 hover:bg-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {shop.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          {shoppingCountries[countryCode as keyof typeof shoppingCountries].flag} 
                          {shoppingCountries[countryCode as keyof typeof shoppingCountries].name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isDarkMode ? "bg-gray-500 text-white" : "bg-gray-200 text-gray-700"
                        }`}>
                          {shop.currency}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-xs text-gray-400">
                        {t.directSearchLink}
                      </p>
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                          isDarkMode 
                            ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow" 
                            : "bg-green-600 text-white hover:bg-green-700 shadow hover:shadow-lg"
                        }`}
                      >
                        🔍 Search
                      </a>
                    </div>
                  </div>
                );
              });
            })}
          </div>

          {selectedCountries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>{t.selectCountriesToSeeLinks}</p>
            </div>
          )}
        </div>

        {/* Related items section */}
        <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-700" : "bg-white border border-gray-200"}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span>
            {t.relatedItems || "Related Items"}
          </h2>
          {relatedItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/funko/${item.id}`}
                  className={`block rounded-lg p-3 transition-all ${
                    isDarkMode 
                      ? "border border-gray-600 hover:border-green-400 hover:shadow-lg" 
                      : "border border-gray-200 hover:border-green-300 hover:shadow-lg"
                  }`}
                >
                  {item.imageName ? (
                    <img
                      src={item.imageName}
                      alt={item.title}
                      className={`w-full h-32 object-contain mb-2 rounded ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-100"
                      }`}
                    />
                  ) : (
                    <div className={`w-full h-32 rounded flex items-center justify-center ${
                      isDarkMode ? "bg-gray-600" : "bg-gray-100"
                    }`}>
                      {t.noImageAvailable}
                    </div>
                  )}
                  <h3 className="text-sm font-medium line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500">#{item.number}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t.noRelatedItems || "No related items found."}</p>
              <Link 
                to="/searchsite" 
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  isDarkMode 
                    ? "bg-yellow-500 text-black hover:bg-yellow-400" 
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Browse All Items
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`text-center text-1xl py-6 ${
          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-800"
        }`}
      >
        {t.copyright}
      </footer>
    </div>
  );
};

export default FunkoDetails;
