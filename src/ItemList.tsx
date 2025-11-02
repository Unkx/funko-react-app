import React, { useState, useEffect, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { useNavigate } from "react-router-dom";
import LeftArrow from "./assets/left-arrow.svg?react";
import RightArrow from "./assets/right-arrow.svg?react";

interface Item {
  id: number | string;
  title: string;
  number: string;
  category: string;
  series: string | string[];
  exclusive: string | boolean;
  imageName: string;
}

interface Translations {
  [key: string]: string;
}

interface ItemListProps {
  token: string | null;
  currentUserRole: string;
  isDarkMode: boolean;
  t: Translations; // Corrected type
}

const ITEMS_PER_PAGE = 50;

const ItemList: React.FC<ItemListProps> = ({ token, currentUserRole, isDarkMode, t }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  const fetchItems = useCallback(async () => {
    if (!token || currentUserRole !== "admin") return;

    setItemsLoading(true);
    setItemsError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/items?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data && data.items && Array.isArray(data.items)) {
        setItems(data.items);
        setTotalItemsCount(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setItems(Array.isArray(data) ? data : []);
        setTotalItemsCount(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setItemsError(err.message || "Failed to load items.");
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [token, currentUserRole, currentPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  // Helper to generate Funko ID
  const generateFunkoId = (title: string, number: string): string => {
    return `${title}-${number}`
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleItemClick = (item: Item) => {
    let funkoId = String(item.id);
    const isCorrectFormat = /^[a-z0-9]+-\d+.*$/.test(funkoId.toLowerCase());
    if (!isCorrectFormat && item.title && item.number) funkoId = generateFunkoId(item.title, item.number);
    navigate(`/item/${encodeURIComponent(funkoId)}`);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    const displayId = item.id || generateFunkoId(item.title, item.number);

    return (
      <div
        style={style}
        onClick={() => handleItemClick(item)}
        className={`flex items-center text-sm sm:text-base cursor-pointer transition-colors ${
          isDarkMode
            ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500"
            : "even:bg-gray-100 odd:bg-white hover:bg-gray-200"
        }`}
      >
        <div className="w-64 px-2 py-2 truncate" title={item.title}>{item.title}</div>
        <div className="w-16 px-2 py-2 text-center font-mono">{displayId}</div>
        <div className="w-16 px-2 py-2 text-center">{item.number}</div>
        <div className="w-32 px-2 py-2 truncate">{item.category}</div>
        <div className="w-32 px-2 py-2 truncate" title={String(item.series)}>
          {Array.isArray(item.series) ? item.series.join(", ") : item.series}
        </div>
        <div className="w-24 px-2 py-2 text-center">
          {(item.exclusive?.toString().toLowerCase() === "true" || item.exclusive?.toString().toLowerCase() === "yes") ? (
            <span className="text-green-500 font-semibold text-xs">Yes</span>
          ) : (
            <span className="text-gray-500 text-xs">No</span>
          )}
        </div>
        <div className="w-24 px-2 py-2 text-center text-xs truncate" title={item.imageName}>{item.imageName || "-"}</div>
      </div>
    );
  };

  if (itemsLoading) return <div className="flex justify-center items-center h-64"><p className="text-lg">{t.loading || "Loading..."}</p></div>;
  if (itemsError) return <div className="flex justify-center items-center h-64"><p className="text-red-500 text-lg">{itemsError}</p></div>;
  if (items.length === 0) return <div className="flex justify-center items-center h-64"><p className="text-gray-500 text-lg">{t.notFound || "No Funko Pops found"}</p></div>;

  return (
    <>
      <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {t.showingItems}: {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItemsCount)} {t.of} {totalItemsCount}
      </p>

      <div className="overflow-x-auto w-full border rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="flex flex-col">
          <div className={`flex items-center text-sm font-semibold ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} sticky top-0 z-10`}>
            <div className="w-64 px-2 py-2 text-left">{t.Title || "Title"}</div>
            <div className="w-16 px-2 py-2 text-center">{t.ID || "ID"}</div>
            <div className="w-16 px-2 py-2 text-center">{t.Number || "Number"}</div>
            <div className="w-32 px-2 py-2 text-center">{t.Category || "Category"}</div>
            <div className="w-32 px-2 py-2 text-center">{t.Series || "Series"}</div>
            <div className="w-24 px-2 py-2 text-center">{t.Exclusives || "Exclusives"}</div>
            <div className="w-24 px-2 py-2 text-center">{t.Image || "Image"}</div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <FixedSizeList height={400} itemCount={items.length} itemSize={50} width="100%">
              {Row}
            </FixedSizeList>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded font-medium ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700" : "bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"} text-black transition`}
          >
            <LeftArrow className="w-6 h-6" />
          </button>
          <span className={`${isDarkMode ? "text-white" : "text-black"}`}>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded font-medium ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700" : "bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"} text-black transition`}
          >
            <RightArrow className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
};

export default ItemList;
