import React, { useState, useEffect } from "react";
import StarIcon from "./assets/star.svg?react";
import FireIcon from "./assets/fire.svg?react";

interface Props {
  isDarkMode: boolean;
  onOpenFull: () => void;
}

const LoyaltyWidget: React.FC<Props> = ({ isDarkMode, onOpenFull }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/loyalty/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.user);
      }
    } catch (err) {
      console.error("Error fetching loyalty widget:", err);
    }
  };

  if (!data) return null;

  return (
    <div
      onClick={onOpenFull}
      className={`p-4 rounded-lg cursor-pointer transition-all hover:scale-105 ${
        isDarkMode
          ? "bg-gradient-to-br from-yellow-900 to-orange-900"
          : "bg-gradient-to-br from-yellow-100 to-orange-100"
      } shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{data.badgeEmoji}</span>
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
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${data.levelProgress}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <FireIcon className="w-4 h-4 text-orange-500" />
          <span>{data.currentStreak} day streak</span>
        </div>
        <button className="text-xs underline hover:no-underline">
          View Rewards →
        </button>
      </div>
    </div>
  );
};

export default LoyaltyWidget;