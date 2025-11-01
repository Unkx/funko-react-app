import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FriendProfileModalProps {
  friendId: string;
  isDarkMode: boolean;
  onClose: () => void;
  t: any;
}

interface FriendData {
  id: number;
  login: string;
  name: string;
  surname: string;
  created_at: string;
  loyalty_score?: number;
  nationality?: string;
}

interface CollectionItem {
  id: string;
  title: string;
  number: string;
  image_name?: string;
  series: string[];
  condition?: string;
  added_date?: string;
}

interface WishlistItem {
  id: string;
  title: string;
  number: string;
  image_name?: string;
  series: string[];
  priority?: string;
  added_date?: string;
}

const FriendProfileModal: React.FC<FriendProfileModalProps> = ({ 
  friendId, 
  isDarkMode, 
  onClose, 
  t 
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "collection" | "wishlist">("profile");
  const [friendData, setFriendData] = useState<FriendData | null>(null);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriendProfile = async () => {
      console.log("🔍 FriendProfileModal - Fetching profile for friendId:", friendId);
      
      setLoading(true);
      setError(null);
      setCollectionError(null);
      setWishlistError(null);
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        // Validate and sanitize friendId
        const validatedFriendId = String(friendId).replace(/[{}]/g, '').trim();
        if (!validatedFriendId || validatedFriendId === 'undefined' || validatedFriendId === 'null') {
          throw new Error("Invalid friend ID");
        }

        console.log("✅ Using validated friendId:", validatedFriendId);

        // Fetch friend's basic profile
        const profileUrl = `http://localhost:5000/api/users/public/${validatedFriendId}`;
        console.log("📡 Fetching profile from:", profileUrl);
        
        const profileResponse = await fetch(profileUrl, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log("📡 Profile response status:", profileResponse.status);
        
        if (!profileResponse.ok) {
          if (profileResponse.status === 403) {
            throw new Error("You must be friends with this user to view their profile.");
          }
          if (profileResponse.status === 404) {
            throw new Error("User not found.");
          }
          const errorData = await profileResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to fetch friend profile.");
        }

        const profileData: FriendData = await profileResponse.json();
        console.log("✅ Profile data received:", profileData);
        setFriendData(profileData);

        // Fetch collection with detailed error handling
        const collectionUrl = `http://localhost:5000/api/collection/public/${validatedFriendId}`;
        console.log("📡 Fetching collection from:", collectionUrl);
        
        try {
          const collectionResponse = await fetch(collectionUrl, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          console.log("📡 Collection response status:", collectionResponse.status);

          if (collectionResponse.ok) {
            const collectionData = await collectionResponse.json();
            console.log("✅ Collection data received:", collectionData);
            setCollection(Array.isArray(collectionData) ? collectionData : []);
          } else if (collectionResponse.status === 404) {
            console.warn("⚠️ Collection endpoint not found (404) - endpoint may not exist");
            setCollectionError("Collection feature is not available for this user.");
            setCollection([]);
          } else if (collectionResponse.status === 403) {
            console.warn("⚠️ Collection access forbidden");
            setCollectionError("You don't have permission to view this collection.");
            setCollection([]);
          } else {
            const errorData = await collectionResponse.json().catch(() => ({ error: "Unknown error" }));
            console.warn("⚠️ Collection fetch failed:", errorData);
            setCollectionError(errorData.error || "Failed to load collection");
            setCollection([]);
          }
        } catch (collErr) {
          console.error("❌ Collection fetch error:", collErr);
          setCollectionError("Could not connect to collection service.");
          setCollection([]);
        }

        // Fetch wishlist with detailed error handling
        const wishlistUrl = `http://localhost:5000/api/wishlist/public/${validatedFriendId}`;
        console.log("📡 Fetching wishlist from:", wishlistUrl);
        
        try {
          const wishlistResponse = await fetch(wishlistUrl, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });

          console.log("📡 Wishlist response status:", wishlistResponse.status);

          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            console.log("✅ Wishlist data received:", wishlistData);
            setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
          } else if (wishlistResponse.status === 404) {
            console.warn("⚠️ Wishlist endpoint not found (404) - endpoint may not exist");
            setWishlistError("Wishlist feature is not available for this user.");
            setWishlist([]);
          } else if (wishlistResponse.status === 403) {
            console.warn("⚠️ Wishlist access forbidden");
            setWishlistError("You don't have permission to view this wishlist.");
            setWishlist([]);
          } else {
            const errorData = await wishlistResponse.json().catch(() => ({ error: "Unknown error" }));
            console.warn("⚠️ Wishlist fetch failed:", errorData);
            setWishlistError(errorData.error || "Failed to load wishlist");
            setWishlist([]);
          }
        } catch (wishErr) {
          console.error("❌ Wishlist fetch error:", wishErr);
          setWishlistError("Could not connect to wishlist service.");
          setWishlist([]);
        }

      } catch (err: any) {
        console.error("❌ Error in fetchFriendProfile:", err);
        setError(err.message || "An error occurred while loading the profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendProfile();
  }, [friendId]);

  const getUniqueSeriesCount = (items: CollectionItem[]): number => {
    const allSeries = items.flatMap(item => item.series || []);
    return new Set(allSeries).size;
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-8">
      <div className="text-red-500 text-lg mb-4">⚠️</div>
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry
      </button>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
        <h3 className="text-xl font-semibold mb-4">{t.basicInfo || "Basic Info"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t.username || "Username"}</p>
            <p className="font-medium">{friendData?.login || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t.name || "Name"}</p>
            <p className="font-medium">
              {friendData?.name || "N/A"} {friendData?.surname || ""}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t.memberSince || "Member Since"}</p>
            <p className="font-medium">
              {friendData?.created_at ? new Date(friendData.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t.loyaltyScore || "Loyalty Score"}</p>
            <p className="font-medium flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              {friendData?.loyalty_score || 0}
            </p>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
        <h3 className="text-xl font-semibold mb-4">{t.collectionStats || "Collection Stats"}</h3>
        
        {(collectionError || wishlistError) && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Some features may not be available
            </p>
            {collectionError && <p className="text-xs mt-1">Collection: {collectionError}</p>}
            {wishlistError && <p className="text-xs mt-1">Wishlist: {wishlistError}</p>}
          </div>
        )}
        
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
              {getUniqueSeriesCount(collection)}
            </p>
            <p className="text-sm">{t.uniqueSeries || "Unique Series"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollectionTab = () => (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
        <h3 className="text-xl font-semibold mb-4">{t.yourCollection || "Collection"}</h3>
        
        {collectionError ? (
          <div className="text-center py-8">
            <div className="text-yellow-500 text-lg mb-2">⚠️</div>
            <p className="text-gray-500">{collectionError}</p>
          </div>
        ) : collection.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            {t.noItemsInCollection || "No items in collection"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collection.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-lg overflow-hidden border ${
                  isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"
                } hover:shadow-lg transition-shadow`}
              >
                {item.image_name ? (
                  <img 
                    src={item.image_name} 
                    alt={item.title} 
                    className="w-full h-32 object-contain bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500">#{item.number}</p>
                  {item.condition && (
                    <p className="text-xs mt-1">
                      <span className="font-medium">Condition:</span> {item.condition}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWishlistTab = () => (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow`}>
        <h3 className="text-xl font-semibold mb-4">{t.yourWishlist || "Wishlist"}</h3>
        
        {wishlistError ? (
          <div className="text-center py-8">
            <div className="text-yellow-500 text-lg mb-2">⚠️</div>
            <p className="text-gray-500">{wishlistError}</p>
          </div>
        ) : wishlist.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            {t.noItemsInWishlist || "No items in wishlist"}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-lg overflow-hidden border ${
                  isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"
                } hover:shadow-lg transition-shadow`}
              >
                {item.image_name ? (
                  <img 
                    src={item.image_name} 
                    alt={item.title} 
                    className="w-full h-32 object-contain bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500">#{item.number}</p>
                  {item.priority && (
                    <p className={`text-xs mt-1 ${
                      item.priority === 'high' ? 'text-red-500' : 
                      item.priority === 'medium' ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      <span className="font-medium">Priority:</span> {item.priority}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!friendData) return <p className="text-center py-8">User not found.</p>;

    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "collection":
        return renderCollectionTab();
      case "wishlist":
        return renderWishlistTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-inherit z-20">
          <h2 className="text-xl font-bold">{friendData?.login || "User Profile"}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`px-4 pt-4 sticky top-14 z-10 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <div className="flex space-x-1">
            {[
              { key: "profile", icon: "👤", label: t.profile || "Profile" },
              { key: "collection", icon: "📦", label: `${t.collection || "Collection"} (${collection.length})` },
              { key: "wishlist", icon: "❤️", label: `${t.wishlist || "Wishlist"} (${wishlist.length})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? isDarkMode
                      ? "bg-gray-700 text-yellow-400 shadow"
                      : "bg-white text-green-600 shadow"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FriendProfileModal;