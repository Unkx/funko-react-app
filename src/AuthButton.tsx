import React from "react";
import { useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationsAuthButton";

interface AuthButtonProps {
  isDarkMode: boolean;
  translations: {
    goToDashboard?: string;
    login?: string;
  };
}

interface UserData {
  role?: "admin" | "user";
  username?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ isDarkMode, translations }) => {
  const navigate = useNavigate();
  
  // Get user data from localStorage
  const getUserData = (): UserData | null => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) return null;
      return JSON.parse(userString);
    } catch {
      return null;
    }
  };

  const user = getUserData();
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  // Determine button styling based on user status
  const getButtonStyles = () => {
    if (isAdmin) {
      // Admin: Purple/Violet
      return "bg-purple-600 text-white hover:bg-purple-700 border-purple-700";
    } else if (isUser) {
      // Regular user: Green
      return "bg-green-600 text-white hover:bg-green-700 border-green-700";
    } else if (isDarkMode) {
      // Not logged in, dark mode: Yellow
      return "bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-600";
    } else {
      // Not logged in, light mode: Blue
      return "bg-blue-600 text-white hover:bg-blue-700 border-blue-700";
    }
  };

  // Determine button text
  const getButtonText = () => {
    if (isLoggedIn) {
      return translations.goToDashboard || "Dashboard";
    }
    return translations.login || "Login";
  };

  // Determine navigation target
  const handleClick = () => {
    if (isAdmin) {
      navigate("/adminSite");
    } else if (isUser) {
      navigate("/dashboardSite");
    } else {
      navigate("/loginRegisterSite");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded transition-all duration-300 ${getButtonStyles()}`}
      aria-label={getButtonText()}
    >
      {/* Icon indicator based on status */}
      {isAdmin && <span>👑</span>}
      {isUser && <span>👤</span>}
      {!isLoggedIn && <span>🔐</span>}
      
      {/* Button text */}
      <span className="font-medium">{getButtonText()}</span>
    </button>
  );
};

export default AuthButton;