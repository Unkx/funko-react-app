import React, { useEffect, useState } from "react";
import { translations } from "./Translations/TranslationsLoyalty";

interface Props {
  userId: number;
  size?: "small" | "medium" | "large";
  showLevel?: boolean;
}

const LoyaltyBadge: React.FC<Props> = ({ userId, size = "medium", showLevel = true }) => {
  const [level, setLevel] = useState<number>(0);
  const [levelName, setLevelName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'EN';
  });

  const t = translations[language] || translations['EN'];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'EN';
    setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    fetchBadge();
  }, [userId]);

  const fetchBadge = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError(t.errorLoadingBadge);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Get translated level names
        const levelNames: Record<number, string> = {
          1: t.bronze,
          2: t.silver,
          3: t.gold,
          4: t.platinum,
          5: t.diamond
        };

        const userLevel = data.loyalty_level || 1;
        setLevel(userLevel);
        setLevelName(levelNames[userLevel] || t.bronze);
      } else {
        setError(t.errorLoadingBadge);
      }
    } catch (err) {
      console.error("Error fetching badge:", err);
      setError(t.errorLoadingBadge);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-10 h-10",
    large: "w-16 h-16"
  };

  const getBadgeEmoji = (level: number) => {
    switch(level) {
      case 1: return "🥉";
      case 2: return "🥈";
      case 3: return "🥇";
      case 4: return "🏆";
      case 5: return "💎";
      default: return "🛡️";
    }
  };

  const getBadgeColor = (level: number) => {
    switch(level) {
      case 1: return "#CD7F32"; // Bronze
      case 2: return "#C0C0C0"; // Silver
      case 3: return "#FFD700"; // Gold
      case 4: return "#E5E4E2"; // Platinum
      case 5: return "#B9F2FF"; // Diamond
      default: return "#808080";
    }
  };

  const getLevelTitle = () => {
    return t.levelTitle
      .replace('{level}', levelName)
      .replace('{levelNumber}', level.toString());
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse`}></div>
        {showLevel && size !== "small" && (
          <span className="text-xs text-gray-500">{t.loadingBadge}</span>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center`}
          title={t.errorLoadingBadge}
        >
          <span className="text-xs text-gray-600">?</span>
        </div>
        {showLevel && size !== "small" && (
          <span className="text-xs text-red-500">{t.errorLoadingBadge}</span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2`}
        style={{
          backgroundColor: `${getBadgeColor(level)}20`,
          borderColor: getBadgeColor(level)
        }}
        title={getLevelTitle()}
      >
        <span className="text-lg sm:text-xl">
          {getBadgeEmoji(level)}
        </span>
      </div>
      {showLevel && size !== "small" && (
        <span className="text-xs font-semibold opacity-75">
          {t.level} {level}
        </span>
      )}
    </div>
  );
};

export default LoyaltyBadge;
