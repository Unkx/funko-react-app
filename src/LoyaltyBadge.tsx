import React, { useEffect, useState } from "react";

interface Props {
  userId: number;
  size?: "small" | "medium" | "large";
  showLevel?: boolean;
}

const LoyaltyBadge: React.FC<Props> = ({ userId, size = "medium", showLevel = true }) => {
  const [badge, setBadge] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(0);
  const [levelName, setLevelName] = useState<string>("");

  useEffect(() => {
    fetchBadge();
  }, [userId]);

  const fetchBadge = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Pobierz badge emoji na podstawie poziomu
        const levelBadges: Record<number, string> = {
          1: "🌱",
          2: "📦",
          3: "⭐",
          4: "🏆",
          5: "👑"
        };

        const levelNames: Record<number, string> = {
          1: "Beginner",
          2: "Collector",
          3: "Expert",
          4: "Master",
          5: "Legend"
        };

        setBadge(levelBadges[data.loyalty_level || 1]);
        setLevel(data.loyalty_level || 1);
        setLevelName(levelNames[data.loyalty_level || 1]);
      }
    } catch (err) {
      console.error("Error fetching badge:", err);
    }
  };

  const sizeClasses = {
    small: "text-sm",
    medium: "text-xl",
    large: "text-3xl"
  };

  if (!badge) return null;

  return (
    <div className="inline-flex items-center gap-1">
      <span className={sizeClasses[size]} title={`${levelName} (Level ${level})`}>
        {badge}
      </span>
      {showLevel && size !== "small" && (
        <span className="text-xs opacity-75">{level}</span>
      )}
    </div>
  );
};

export default LoyaltyBadge;