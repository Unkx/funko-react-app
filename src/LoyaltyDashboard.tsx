import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StarIcon from "./assets/star.svg?react";
import TrophyIcon from "./assets/trophy.svg?react";
import FireIcon from "./assets/fire.svg?react";
import GiftIcon from "./assets/gift.svg?react";

interface LoyaltyData {
  user: {
    loyaltyPoints: number;
    level: number;
    levelName: string;
    badgeEmoji: string;
    levelProgress: number;
    nextLevelPoints: number;
    currentStreak: number;
    longestStreak: number;
    profileFrame: string;
    activeTitle: string;
    activeTheme: string;
  };
  achievements: Achievement[];
  progress: {
    collection_count: number;
    wishlist_count: number;
    friend_count: number;
  };
  pointsHistory: PointsHistory[];
  rewards: Reward[];
}

interface Achievement {
  achievement_id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  points_reward: number;
  unlocked: boolean;
  is_new?: boolean;
  requirement_value?: number;
}

interface PointsHistory {
  points_change: number;
  reason: string;
  action_type: string;
  created_at: string;
}

interface Reward {
  reward_type: string;
  reward_id: string;
  unlocked_at: string;
}

interface AvailableRewards {
  frames: RewardItem[];
  titles: RewardItem[];
  themes: RewardItem[];
}

interface RewardItem {
  id: string;
  name?: string;
  text?: string;
  reqLevel: number;
  unlocked: boolean;
  color?: string;
  reqPoints?: number;
}

interface Props {
  isDarkMode: boolean;
  onClose: () => void;
}

const LoyaltyDashboard: React.FC<Props> = ({ isDarkMode, onClose }) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "rewards">("overview");
  const [availableRewards, setAvailableRewards] = useState<AvailableRewards | null>(null);
  const [showNewAchievement, setShowNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
    fetchAvailableRewards();
  }, []);

  const fetchLoyaltyData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/loyalty/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
        
        // Sprawdź nowe osiągnięcia
        const newAchievement = data.achievements.find((a: Achievement) => a.is_new && a.unlocked);
        if (newAchievement) {
          setShowNewAchievement(newAchievement);
          setTimeout(() => markAchievementSeen(newAchievement.achievement_id), 3000);
        }
      }
    } catch (err) {
      console.error("Error fetching loyalty data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRewards = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/loyalty/rewards", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableRewards(data);
      }
    } catch (err) {
      console.error("Error fetching rewards:", err);
    }
  };

  const markAchievementSeen = async (achievementId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`http://localhost:5000/api/loyalty/achievements/${achievementId}/mark-seen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNewAchievement(null);
      fetchLoyaltyData();
    } catch (err) {
      console.error("Error marking achievement:", err);
    }
  };

  const activateReward = async (rewardType: string, rewardId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/loyalty/rewards/activate", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rewardType, rewardId })
      });

      if (response.ok) {
        alert("Reward activated!");
        fetchLoyaltyData();
      }
    } catch (err) {
      console.error("Error activating reward:", err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "collection": return "📦";
      case "social": return "👥";
      case "streak": return "🔥";
      case "special": return "⭐";
      default: return "🎯";
    }
  };

  const getProgressForAchievement = (achievement: Achievement): number => {
    if (!loyaltyData || achievement.unlocked) return 100;
    
    const { progress, user } = loyaltyData;
    const reqValue = achievement.requirement_value || 0;

    switch (achievement.achievement_id) {
      case "first_item":
      case "collector_10":
      case "collector_50":
      case "collector_100":
        return Math.min(100, (progress.collection_count / reqValue) * 100);
      
      case "first_friend":
      case "social_5":
      case "social_25":
        return Math.min(100, (progress.friend_count / reqValue) * 100);
      
      case "streak_7":
      case "streak_30":
      case "streak_100":
        return Math.min(100, (user.currentStreak / reqValue) * 100);
      
      case "first_wishlist":
        return Math.min(100, (progress.wishlist_count / reqValue) * 100);
      
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className={`p-8 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className={`w-full max-w-6xl rounded-lg shadow-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 p-6 border-b ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <TrophyIcon className="w-8 h-8 text-yellow-500" />
              Loyalty Rewards
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded ${activeTab === "overview" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-700" : "bg-gray-200")}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-4 py-2 rounded ${activeTab === "achievements" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-700" : "bg-gray-200")}`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`px-4 py-2 rounded ${activeTab === "rewards" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-700" : "bg-gray-200")}`}
            >
              Rewards
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Level Card */}
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gradient-to-br from-yellow-900 to-orange-900" : "bg-gradient-to-br from-yellow-100 to-orange-100"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-6xl mb-2">{loyaltyData.user.badgeEmoji}</div>
                      <h3 className="text-2xl font-bold">{loyaltyData.user.levelName}</h3>
                      <p className="text-sm opacity-75">Level {loyaltyData.user.level}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-yellow-500">
                        {loyaltyData.user.loyaltyPoints}
                      </div>
                      <p className="text-sm opacity-75">Loyalty Points</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress to Level {loyaltyData.user.level + 1}</span>
                      {loyaltyData.user.nextLevelPoints && (
                        <span>{loyaltyData.user.nextLevelPoints} points needed</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${loyaltyData.user.levelProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Streak Card */}
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FireIcon className="w-6 h-6 text-orange-500" />
                    Login Streak
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-500">
                        {loyaltyData.user.currentStreak}
                      </div>
                      <p className="text-sm opacity-75">Current Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-500">
                        {loyaltyData.user.longestStreak}
                      </div>
                      <p className="text-sm opacity-75">Longest Streak</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
                  <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {loyaltyData.pointsHistory.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-center p-3 rounded ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                      >
                        <div>
                          <p className="font-medium">{item.reason}</p>
                          <p className="text-xs opacity-75">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-lg font-bold text-green-500">
                          +{item.points_change}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Trophy Case</h3>
                  <p className="opacity-75">
                    {loyaltyData.achievements.filter(a => a.unlocked).length} / {loyaltyData.achievements.length} Unlocked
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loyaltyData.achievements.map((achievement) => {
                    const progress = getProgressForAchievement(achievement);
                    
                    return (
                      <div
                        key={achievement.achievement_id}
                        className={`relative p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg ${!achievement.unlocked && "opacity-50 grayscale"}`}
                      >
                        {achievement.unlocked && achievement.is_new && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        )}

                        <div className="text-center mb-2">
                          <div className="text-5xl mb-2">{achievement.emoji}</div>
                          <h4 className="font-bold">{achievement.name}</h4>
                          <p className="text-xs opacity-75 mt-1">{achievement.description}</p>
                        </div>

                        {!achievement.unlocked && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-300 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-center mt-1 opacity-75">
                              {Math.round(progress)}% Complete
                            </p>
                          </div>
                        )}

                        <div className="mt-2 text-center">
                          <span className="text-xs text-yellow-500 font-bold">
                            {achievement.points_reward} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "rewards" && availableRewards && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Profile Frames */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Profile Frames</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {availableRewards.frames.map((frame) => (
                      <div
                        key={frame.id}
                        className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg ${!frame.unlocked && "opacity-50"}`}
                      >
                        <div
                          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${frame.color} p-1 mb-2`}
                        >
                          <div className={`w-full h-full rounded-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`} />
                        </div>
                        <p className="font-bold text-sm">{frame.name}</p>
                        {frame.unlocked ? (
                          <button
                            onClick={() => activateReward("frame", frame.id)}
                            className={`mt-2 px-3 py-1 rounded text-xs ${loyaltyData.user.profileFrame === frame.id ? "bg-green-500" : (isDarkMode ? "bg-yellow-500" : "bg-blue-500")} text-white`}
                          >
                            {loyaltyData.user.profileFrame === frame.id ? "Active" : "Activate"}
                          </button>
                        ) : (
                          <p className="text-xs opacity-75 mt-2">Level {frame.reqLevel}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Titles */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Titles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableRewards.titles.map((title) => (
                      <div
                        key={title.id}
                        className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg flex justify-between items-center ${!title.unlocked && "opacity-50"}`}
                      >
                        <div>
                          <p className="font-bold">{title.text}</p>
                          {!title.unlocked && (
                            <p className="text-xs opacity-75">Requires Level {title.reqLevel}</p>
                          )}
                        </div>
                        {title.unlocked && (
                          <button
                            onClick={() => activateReward("title", title.id)}
                            className={`px-3 py-1 rounded text-xs ${loyaltyData.user.activeTitle === title.id ? "bg-green-500" : (isDarkMode ? "bg-yellow-500" : "bg-blue-500")} text-white`}
                          >
                            {loyaltyData.user.activeTitle === title.id ? "Active" : "Activate"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Color Themes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {availableRewards.themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg ${!theme.unlocked && "opacity-50"}`}
                      >
                        <div className="w-full h-20 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 mb-2" />
                        <p className="font-bold text-sm">{theme.name}</p>
                        {theme.unlocked ? (
                          <button
                            onClick={() => activateReward("theme", theme.id)}
                            className={`mt-2 px-3 py-1 rounded text-xs ${loyaltyData.user.activeTheme === theme.id ? "bg-green-500" : (isDarkMode ? "bg-yellow-500" : "bg-blue-500")} text-white`}
                          >
                            {loyaltyData.user.activeTheme === theme.id ? "Active" : "Activate"}
                          </button>
                        ) : (
                          <p className="text-xs opacity-75 mt-2">
                            Level {theme.reqLevel} • {theme.reqPoints} pts
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievement Unlock Notification */}
      <AnimatePresence>
        {showNewAchievement && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]"
          >
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl shadow-2xl text-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-4"
              >
                {showNewAchievement.emoji}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Achievement Unlocked!
              </h2>
              <p className="text-xl text-white/90 mb-4">
                {showNewAchievement.name}
              </p>
              <p className="text-white/75 mb-6">
                +{showNewAchievement.points_reward} Loyalty Points
              </p>
              <button
                onClick={() => markAchievementSeen(showNewAchievement.achievement_id)}
                className="px-6 py-2 bg-white text-orange-500 rounded-full font-bold hover:bg-gray-100"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoyaltyDashboard;