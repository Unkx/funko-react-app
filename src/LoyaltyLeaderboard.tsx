import React, { useState, useEffect } from "react";
import useBreakpoints from "./useBreakpoints";
import LoyaltyBadge from './LoyaltyBadge';

interface LeaderboardEntry {
  id: number;
  login: string;
  loyalty_points: number;
  loyalty_level: number;
  badge_emoji: string;
  level_name: string;
  collection_size: number;
  period_points?: number;
}

interface Props {
  isDarkMode: boolean;
  currentUserId: number;
}

const LoyaltyLeaderboard: React.FC<Props> = ({ isDarkMode, currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "weekly" | "monthly">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/loyalty/leaderboard?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `#${rank + 1}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0: return "text-yellow-400";
      case 1: return "text-gray-400";
      case 2: return "text-orange-400";
      default: return "";
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"} shadow-lg`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🏆 Loyalty Leaderboard</h2>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded text-sm ${filter === "all" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-600" : "bg-gray-200")}`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter("monthly")}
            className={`px-3 py-1 rounded text-sm ${filter === "monthly" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-600" : "bg-gray-200")}`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter("weekly")}
            className={`px-3 py-1 rounded text-sm ${filter === "weekly" ? (isDarkMode ? "bg-yellow-500 text-black" : "bg-green-600 text-white") : (isDarkMode ? "bg-gray-600" : "bg-gray-200")}`}
          >
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const isCurrentUser = entry.id === currentUserId;
            const rank = idx;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  isCurrentUser
                    ? isDarkMode
                      ? "bg-yellow-900 border-2 border-yellow-500"
                      : "bg-green-100 border-2 border-green-500"
                    : isDarkMode
                    ? "bg-gray-600 hover:bg-gray-550"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {/* Rank */}
                <div className={`text-2xl font-bold w-16 ${getRankColor(rank)}`}>
                  {getRankMedal(rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl lg:text-4xl">{entry.badge_emoji}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isCurrentUser ? "text-lg" : ""}`}>
                        {entry.login}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm opacity-75">
                      {entry.level_name} • {entry.collection_size} items
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-500">
                    {filter === "all" ? entry.loyalty_points : entry.period_points}
                  </div>
                  <div className="text-xs opacity-75">
                    {filter === "all" ? "total points" : "period points"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leaderboard.length === 0 && !loading && (
        <div className="text-center py-8 opacity-75">
          No leaderboard data available yet.
        </div>
      )}
    </div>
  );
};

export default LoyaltyLeaderboard;