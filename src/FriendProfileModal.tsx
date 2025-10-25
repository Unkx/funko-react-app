// FriendProfileModal.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FriendProfileModalProps {
  friendId: string;
  isDarkMode: boolean;
  onClose: () => void;
  t: any; // Your translations object
}

const FriendProfileModal: React.FC<FriendProfileModalProps> = ({ friendId, isDarkMode, onClose, t }) => {
  const [activeTab, setActiveTab] = useState<"profile" | "collection" | "wishlist">("profile");
  const [friendData, setFriendData] = useState<any>(null);
  const [collection, setCollection] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch friend's profile data

  useEffect(() => {
    const fetchFriendProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found.");

        // Fetch friend's basic profile
        const profileResponse = await fetch(`http://localhost:5000/api/users/public/${friendId}`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ This was missing!
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch friend profile.");
        const profileData = await profileResponse.json();
        setFriendData(profileData);

        // Fetch friend's collection
        const collectionResponse = await fetch(`http://localhost:5000/api/collection/public/${friendId}`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ This was missing!
        });
        if (collectionResponse.ok) {
          const collectionData = await collectionResponse.json();
          setCollection(collectionData);
        }

        // Fetch friend's wishlist
        const wishlistResponse = await fetch(`http://localhost:5000/api/wishlist/public/${friendId}`, {
          headers: { Authorization: `Bearer ${token}` }, // ✅ This was missing!
        });
        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setWishlist(wishlistData);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading the profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendProfile();
  }, [friendId]); // Re-fetch if friendId changes

  // Render the selected tab content
  const renderContent = () => {
    if (loading) {
      return <p className="text-center py-8">Loading...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500 py-8">{error}</p>;
    }

    if (!friendData) {
      return <p className="text-center py-8">User not found.</p>;
    }

    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
              <h3 className="text-xl font-semibold mb-4">{t.basicInfo || "Basic Info"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t.username || "Username"}</p>
                  <p className="font-medium">{friendData.login}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.name || "Name"}</p>
                  <p className="font-medium">{friendData.name} {friendData.surname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.memberSince || "Member Since"}</p>
                  <p className="font-medium">{new Date(friendData.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.loyaltyScore || "Loyalty Score"}</p>
                  <p className="font-medium flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {friendData.loyalty_score || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Collection Stats */}
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
              <h3 className="text-xl font-semibold mb-4">{t.collectionStats || "Collection Stats"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-500">{collection.length}</p>
                  <p className="text-sm">{t.totalItems || "Total Items"}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{wishlist.length}</p>
                  <p className="text-sm">{t.wishlistItems || "Wishlist Items"}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">
                    {new Set(collection.map((item: any) => item.series)).size}
                  </p>
                  <p className="text-sm">{t.uniqueSeries || "Unique Series"}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "collection":
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
              <h3 className="text-xl font-semibold mb-4">{t.yourCollection || "Collection"}</h3>
              {collection.length === 0 ? (
                <p className="text-center py-8">{t.noItemsInCollection || "No items in collection"}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collection.map((item: any) => (
                    <div key={item.id} className={`rounded-lg overflow-hidden border ${isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}>
                      {item.image_name && (
                        <img src={item.image_name} alt={item.title} className="w-full h-32 object-contain bg-gray-100" />
                      )}
                      <div className="p-3">
                        <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-gray-500">#{item.number}</p>
                        {item.condition && <p className="text-xs">{item.condition}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "wishlist":
        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
              <h3 className="text-xl font-semibold mb-4">{t.yourWishlist || "Wishlist"}</h3>
              {wishlist.length === 0 ? (
                <p className="text-center py-8">{t.noItemsInWishlist || "No items in wishlist"}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item: any) => (
                    <div key={item.id} className={`rounded-lg overflow-hidden border ${isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}>
                      {item.image_name && (
                        <img src={item.image_name} alt={item.title} className="w-full h-32 object-contain bg-gray-100" />
                      )}
                      <div className="p-3">
                        <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-gray-500">#{item.number}</p>
                        {item.priority && (
                          <p className={`text-xs ${item.priority === 'high' ? 'text-red-500' : item.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                            {item.priority}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">{friendData?.login || "User"}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={`px-4 pt-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === "profile"
                  ? isDarkMode
                    ? "bg-gray-800 text-yellow-400 border-b-2 border-yellow-400"
                    : "bg-white text-green-600 border-b-2 border-green-600"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a4 4 0 014-4h4M12 14a4 4 0 01-4-4H4M12 14a4 4 0 01-4-4H4m8 8v6m4-6v6" />
                </svg>
                {t.profile || "Profile"}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("collection")}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === "collection"
                  ? isDarkMode
                    ? "bg-gray-800 text-yellow-400 border-b-2 border-yellow-400"
                    : "bg-white text-green-600 border-b-2 border-green-600"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9M5 11V9m2 2a2 2 0 100 4h12a2 2 0 100-4M5 11a2 2 0 100 4h12a2 2 0 100-4M5 9h12V7M5 11V9" />
                </svg>
                {t.collection || "Collection"} ({collection.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`px-4 py-2 rounded-t-lg font-medium transition ${
                activeTab === "wishlist"
                  ? isDarkMode
                    ? "bg-gray-800 text-yellow-400 border-b-2 border-yellow-400"
                    : "bg-white text-green-600 border-b-2 border-green-600"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 006.364 6.364L12 14.318l1.354 1.354a4.5 4.5 0 006.364-6.364L12 12l-1.354-1.354a4.5 4.5 0 00-6.364 6.364L12 12l-1.354-1.354a4.5 4.5 0 00-6.364-6.364L12 12l-1.354-1.354z" />
                </svg>
                {t.wishlist || "Wishlist"} ({wishlist.length})
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FriendProfileModal;