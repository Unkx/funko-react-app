import React, { useEffect, useState } from "react";

// Translation object (simplified for the artifact)
const translations = {
  EN: {
    pendingItemRequests: "Pending Item Requests",
    loading: "Loading...",
    noPendingRequests: "No pending requests.",
    requestedBy: "Requested by",
    markAsAdded: "Mark as Added",
    failedToLoadRequests: "Failed to load requests",
    failedToResolveRequest: "Failed to resolve request",
    errorResolvingRequest: "Error resolving request",
    allRequests: "All Requests",
    searchRequests: "Search requests...",
    sortBy: "Sort by",
    newest: "Newest First",
    oldest: "Oldest First",
    itemNumber: "Item Number",
    reason: "Reason",
    requestDate: "Request Date",
    filterByUser: "Filter by user",
    allUsers: "All Users",
    totalRequests: "Total Requests",
    clearFilters: "Clear Filters",
    noResultsFound: "No results found",
    confirmResolve: "Are you sure you want to mark this request as resolved?",
    requestResolved: "Request marked as resolved successfully",
    userEmail: "User Email",
    itemDetails: "Item Details"
  }
};

interface RequestItem {
  id: number;
  title: string;
  number: string | null;
  reason: string;
  created_at: string;
  user_login: string;
  user_email?: string;
}

const Requests = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "user">("newest");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const token = localStorage.getItem("token");

  // Detect dark mode from localStorage
  const isDarkMode = localStorage.getItem("preferredTheme") === "dark";

  // Load language (default to EN if not set)
  const language = localStorage.getItem("preferredLanguage") || "EN";
  const t = translations[language] || translations["EN"];

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        alert("Authentication required");
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/admin/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
          setFilteredRequests(data);
        } else {
          alert(t.failedToLoadRequests || "Failed to load requests");
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
        alert(t.failedToLoadRequests || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token, t.failedToLoadRequests]);

  // Filter and sort requests
  useEffect(() => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(query) ||
          req.number?.toLowerCase().includes(query) ||
          req.reason.toLowerCase().includes(query) ||
          req.user_login.toLowerCase().includes(query)
      );
    }

    // User filter
    if (selectedUser !== "all") {
      filtered = filtered.filter((req) => req.user_login === selectedUser);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "user") {
        return a.user_login.localeCompare(b.user_login);
      }
      return 0;
    });

    setFilteredRequests(filtered);
  }, [requests, searchQuery, sortBy, selectedUser]);

  const resolveRequest = async (id: number) => {
    if (!token) return;
    
    if (!confirm(t.confirmResolve)) return;
    
    setProcessingId(id);
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/requests/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setRequests(requests.filter((r) => r.id !== id));
        setFilteredRequests(filteredRequests.filter((r) => r.id !== id));
        alert(t.requestResolved);
      } else {
        const errorText = await res.text();
        alert(`${t.failedToResolveRequest}: ${errorText}`);
      }
    } catch (err) {
      console.error("Error resolving request:", err);
      alert(t.errorResolvingRequest || "Error resolving request");
    } finally {
      setProcessingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setSelectedUser("all");
  };

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(new Set(requests.map((r) => r.user_login)));

  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800 border border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-3xl font-bold mb-2 ${
            isDarkMode ? "text-yellow-400" : "text-blue-600"
          }`}
        >
          {t.pendingItemRequests || "Pending Item Requests"}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {t.totalRequests}:
          </span>
          <span className="text-lg font-bold">{requests.length}</span>
        </div>
      </div>

      {/* Filters and Search */}
      {requests.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchRequests}
              className={`w-full px-4 py-2 pr-10 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                  : "bg-gray-50 text-gray-800 placeholder-gray-500 border-gray-300"
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <svg
              className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Sort By */}
            <div className="flex-1 min-w-[200px]">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-50 text-gray-800 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="newest">{t.newest}</option>
                <option value="oldest">{t.oldest}</option>
                <option value="user">User A-Z</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="flex-1 min-w-[200px]">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t.filterByUser}
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-50 text-gray-800 border-gray-300"
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">{t.allUsers}</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || selectedUser !== "all" || sortBy !== "newest") && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {t.clearFilters}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {searchQuery || selectedUser !== "all"
              ? t.noResultsFound
              : t.noPendingRequests}
          </p>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`p-5 rounded-lg border transition-all hover:shadow-md ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Request Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {req.title}
                    {req.number && (
                      <span
                        className={`ml-2 text-sm font-normal ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        #{req.number}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        isDarkMode
                          ? "bg-blue-900 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {req.user_login}
                    </span>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {new Date(req.created_at).toLocaleDateString()} •{" "}
                      {new Date(req.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Request Reason */}
              <div
                className={`mb-4 p-3 rounded ${
                  isDarkMode ? "bg-gray-600" : "bg-white"
                }`}
              >
                <p
                  className={`text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t.reason}:
                </p>
                <p className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {req.reason}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => resolveRequest(req.id)}
                  disabled={processingId === req.id}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    processingId === req.id
                      ? "opacity-50 cursor-not-allowed bg-gray-400"
                      : isDarkMode
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {processingId === req.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {t.markAsAdded || "Mark as Added"}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;