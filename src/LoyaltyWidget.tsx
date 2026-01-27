import React, { useState, useEffect } from "react";
import { Star, Flame } from "lucide-react";

interface Props {
  isDarkMode: boolean;
  onOpenFull: () => void;
}

interface LoyaltyData {
  badgeEmoji: string;
  levelName: string;
  level: number;
  loyaltyPoints: number;
  levelProgress: number;
  currentStreak: number;
}

const LoyaltyWidget: React.FC<Props> = ({ isDarkMode, onOpenFull }) => {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/loyalty/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.user);
      } else {
        setError("Failed to load loyalty data");
      }
    } catch (err) {
      console.error("Error fetching loyalty widget:", err);
      setError("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenFull();
    }
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-lg ${
        isDarkMode ? "bg-gradient-to-br from-yellow-900 to-orange-900" : "bg-gradient-to-br from-yellow-100 to-orange-100"
      } shadow-lg animate-pulse`}>
        <div className="h-24"></div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div
      onClick={onOpenFull}
      onKeyDown={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Loyalty status: ${data.levelName}, Level ${data.level}, ${data.loyaltyPoints} points`}
      className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-yellow-900 to-orange-900"
          : "bg-gradient-to-br from-yellow-100 to-orange-100"
      } shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl lg:text-4xl" aria-hidden="true">{data.badgeEmoji}</span>
          <div>
            <h3 className="font-bold">{data.levelName}</h3>
            <p className="text-xs opacity-75">Level {data.level}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-500">
            {data.loyaltyPoints}
          </div>
          <p className="text-xs opacity-75">points</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div 
          className="w-full bg-gray-300 rounded-full h-2"
          role="progressbar"
          aria-valuenow={data.levelProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Level progress"
        >
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${data.levelProgress}%` }}
          />
        </div>
        <p className="text-xs text-center mt-1 opacity-75">
          {data.levelProgress}% to next level
        </p>
      </div>

      {/* Streak */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
          <span>{data.currentStreak} day streak</span>
        </div>
        <span className="text-xs underline hover:no-underline">
          View Rewards →
        </span>
      </div>
    </div>
  );
};

export default LoyaltyWidget;