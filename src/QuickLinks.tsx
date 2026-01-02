import React from 'react';
import { translations } from "./Translations/TranslationsWelcomeSite";

interface QuickLinksProps {
  isDarkMode?: boolean;
  className?: string;
}

const QuickLinks: React.FC<QuickLinksProps> = ({ isDarkMode = false, className = "" }) => {
  // Assuming translations is an object with language keys
  // You might need to select a specific language, e.g., translations.en
  // If translations is already the object you want, you can use it directly
  const t = translations; // or translations.en or however your translations are structured
  
  return (
    <div className={`px-8 py-2 text-sm ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"} ${className}`}>
      <h3 className="font-bold mb-2">{t.quickLinks || "Quick Links"}</h3>
      <ul className="space-y-1">
        <li><a href="/" className="text-blue-500 hover:underline">{t.home || "Home"}</a></li>
        <li><a href="/searchsite=q" className="text-blue-500 hover:underline">{t.search || "Search"}</a></li>
        <li><a href="/about" className="text-blue-500 hover:underline">{t.about || "About Us"}</a></li> {/* Fixed: Added missing } */}
        <li><a href="/features" className="text-blue-500 hover:underline">{t.features || "Features"}</a></li> {/* Fixed: Removed extra < and added closing </a> */}
      </ul>
    </div>
  );
};

export default QuickLinks;
