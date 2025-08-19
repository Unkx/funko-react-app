import React, { useState, useEffect, useCallback } from "react";
import { FixedSizeList } from "react-window";

interface Item {
  id: number;
  title: string;
  number: string;
  category: string;
  series: string;
  exclusive: string;
  imageName: string;
}

interface ItemListProps {
  token: string | null;
  currentUserRole: string | undefined;
  isDarkMode: boolean;
  t: (key: string) => string;
}

const ITEMS_PER_PAGE = 50;

const ItemList: React.FC<ItemListProps> = ({ token, currentUserRole, isDarkMode, t }) => {
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch items.");
      }

      const data = await response.json();

      const itemsArray = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
      const totalItems = typeof data.totalItems === 'number' ? data.totalItems : itemsArray.length;
      const totalPages = typeof data.totalPages === 'number' ? data.totalPages : Math.ceil(totalItems / ITEMS_PER_PAGE);

      setItems(itemsArray);
      setTotalItemsCount(totalItems);
      setTotalPages(totalPages);
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

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div
        style={style}
        className={`flex items-center text-sm sm:text-base ${isDarkMode ? "even:bg-gray-700 odd:bg-gray-600 hover:bg-gray-500" : "even:bg-gray-100 odd:bg-white hover:bg-gray-200"}`}
      >
        {/* Title */}
        <div className="w-64 px-2 py-2 truncate" title={item.title}>
          {item.title}
        </div>
        {/* ID - Moved to after Title */}
        <div className="w-16 px-2 py-2 text-center font-mono">{item.id}</div>
        {/* Number */}
        <div className="w-16 px-2 py-2 text-center">{item.number}</div>
        {/* Category */}
        <div className="w-32 px-2 py-2 truncate">{item.category}</div>
        {/* Series */}
        <div className="w-32 px-2 py-2 truncate" title={item.series}>
          {item.series}
        </div>
        {/* Exclusive */}
        <div className="w-24 px-2 py-2 text-center">
          {item.exclusive === "Yes" ? (
            <span className="text-green-500 font-semibold text-xs">Yes</span>
          ) : (
            <span className="text-gray-500 text-xs">No</span>
          )}
        </div>
        {/* Image */}
        <div className="w-24 px-2 py-2 text-center text-xs truncate" title={item.imageName}>
          {item.imageName || "-"}
        </div>
      </div>
    );
  };

  if (itemsLoading) {
    return <p className="text-lg">{t("loading") || "Loading..."}</p>;
  }

  if (itemsError) {
    return <p className="text-red-500 text-lg">{itemsError}</p>;
  }

  return (
    <>
      <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
        {t("showingItems")}: {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItemsCount)} {t("of")} {totalItemsCount}
      </p>

      {/* Table Container */}
      <div className="overflow-x-auto w-full border rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="flex flex-col">
          {/* Header - Updated order to match the row */}
          <div className={`flex items-center text-sm font-semibold ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} sticky top-0 z-10`}>
            <div className="w-64 px-2 py-2 text-left">Title</div>
            <div className="w-16 px-2 py-2 text-center">ID</div>
            <div className="w-16 px-2 py-2 text-center">Number</div>
            <div className="w-32 px-2 py-2 text-center">Category</div>
            <div className="w-32 px-2 py-2 text-center">Series</div>
            <div className="w-24 px-2 py-2 text-center">Exclusive</div>
            <div className="w-24 px-2 py-2 text-center">Image</div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-x-auto">
            <FixedSizeList
              height={400}
              itemCount={items.length}
              itemSize={50}
              width="100%"
            >
              {Row}
            </FixedSizeList>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded font-medium ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700" : "bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"} text-black transition`}
          >
            {t("previous") || "Previous"}
          </button>
          <span className={`${isDarkMode ? "text-white" : "text-black"}`}>
            {t("page")} {currentPage} {t.of || "of"} {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded font-medium ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700" : "bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200"} text-black transition`}
          >
            {t("next") || "Next"}
          </button>
        </div>
      )}
    </>
  );
};

export default ItemList;