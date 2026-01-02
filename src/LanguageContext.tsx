// src/LanguageContext.tsx

import React, { createContext, useState, useEffect } from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "EN", // Domyślny język
  setLanguage: () => {},
});

export const LanguageProvider: React.FC = ({ children }) => {
  const [language, setLanguage] = useState<string>("EN");

  // Odczyt języka z localStorage podczas montowania
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Aktualizacja języka i zapisanie go w localStorage
  const updateLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferredLanguage", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};