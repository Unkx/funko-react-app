import React, { useEffect, useState } from "react";
import BronzeBadge from "./assets/badges/bronze.svg?react";
import SilverBadge from "./assets/badges/silver.svg?react";
import GoldBadge from "./assets/badges/gold.svg?react";
import PlatinumBadge from "./assets/badges/platinum.svg";
import DiamondBadge from "./assets/badges/diamond.svg";

import { translations } from "./Translations/TranslationLoyalty";

interface Props {
  userId: number;
  size?: "small" | "medium" | "large";
  showLevel?: boolean;
}

const LoyaltyBadge: React.FC<Props> = ({ userId, size = "medium", showLevel = true }) => {
  const [badge, setBadge] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(0);
  const [levelName, setLevelName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current language
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
        
        // Map levels to badge images
        const levelBadges: Record<number, string> = {
          1: BronzeBadge,
          2: SilverBadge,
          3: GoldBadge,
          4: PlatinumBadge,
          5: DiamondBadge
        };

        // Get translated level names
        const levelNames: Record<number, string> = {
          1: t.bronze,
          2: t.silver,
          3: t.gold,
          4: t.platinum,
          5: t.diamond
        };

        const userLevel = data.loyalty_level || 1;
        setBadge(levelBadges[userLevel]);
        setLevel(userLevel);
        setLevelName(levelNames[userLevel]);
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

  const getBadgeAltText = () => {
    return t.badgeAlt.replace('{level}', levelName);
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

  if (error || !badge) {
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
      <img 
        src={badge} 
        alt={getBadgeAltText()}
        className={`${sizeClasses[size]} object-contain`}
        title={getLevelTitle()}
      />
      {showLevel && size !== "small" && (
        <span className="text-xs font-semibold opacity-75">
          {t.level} {level}
        </span>
      )}
    </div>
  );
};

export default LoyaltyBadge;