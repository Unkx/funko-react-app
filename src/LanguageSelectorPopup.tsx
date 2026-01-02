// components/LanguageSelectorPopup.tsx

import React, { useState } from "react";
import useBreakpoints from "./useBreakpoints";
import WorldMap from "/src/Maps/WorldMap"

const LanguageSelectorPopup = ({ onClose }: { onClose: () => void }) => {
  const { isMobile, isTablet } = useBreakpoints();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countryToLanguage = {
    Poland: "PL",
    Germany: "DE",
    France: "FR",
    Spain: "ES",
    Russia: "RU",
    US: "EN",
    Canada: "EN",
  };

  const handleCountryClick = (country: string) => {
    const languageCode = countryToLanguage[country];
    if (languageCode) {
      setSelectedCountry(country);
      localStorage.setItem("preferredLanguage", languageCode);
      setTimeout(() => {
        onClose();
      }, 30000000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      data-testid="language-popup"
    >
      <div className={`bg-white rounded-lg shadow-xl p-4 md:p-6 relative text-center ${
        isMobile ? 'w-full max-w-sm' : 'max-w-md w-full'
      } max-h-[90vh] overflow-auto`}>
        <h2 className="text-lg md:text-xl font-bold mb-4">Select Your Country</h2>

        <div
          onClick={(e) => {
            const target = e.target as SVGElement;
            if (target.tagName === "path") {
              const country = target.getAttribute("data-country");
              if (country) {
                handleCountryClick(country);
              }
            }
          }}
          className="cursor-pointer overflow-auto w-full"
        >
          <WorldMap />
        </div>

        {selectedCountry && (
          <p className="mt-4 text-green-600 font-medium text-sm md:text-base">
            You have selected: <strong>{selectedCountry}</strong>
          </p>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg md:text-xl"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default LanguageSelectorPopup;