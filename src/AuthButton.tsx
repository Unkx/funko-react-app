import React from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LayoutDashboard, Shield } from "lucide-react";

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

  const getButtonStyles = () => {
    if (isAdmin) {
      return "bg-purple-600 text-white hover:bg-purple-700";
    } else if (isUser) {
      return "bg-emerald-600 text-white hover:bg-emerald-700";
    } else if (isDarkMode) {
      return "bg-amber-400 text-slate-900 hover:bg-amber-500";
    } else {
      return "bg-blue-600 text-white hover:bg-blue-700";
    }
  };

  const getButtonText = () => {
    if (isLoggedIn) return translations.goToDashboard || "Dashboard";
    return translations.login || "Login";
  };

  const handleClick = () => {
    if (isAdmin) navigate("/adminSite");
    else if (isUser) navigate("/dashboardSite");
    else navigate("/loginRegisterSite");
  };

  const Icon = isAdmin ? Shield : isUser ? LayoutDashboard : LogIn;

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${getButtonStyles()}`}
      aria-label={getButtonText()}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{getButtonText()}</span>
    </button>
  );
};

export default AuthButton;
