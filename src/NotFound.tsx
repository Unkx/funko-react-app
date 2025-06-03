// components/NotFound.tsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  // Lista ścieżek do obrazków Funko Pop
  const images = [
    "/src/assets/funko-pop/EmmettBrown.png",
    "/src/assets/funko-pop/Dogpool.png",
    "/src/assets/funko-pop/DrPhosphorus.png",
    "/src/assets/funko-pop/Lilo.png",
    "/src/assets/funko-pop/Winnie.png",
  ];

  // Stan przechowujący losowy obrazek
  const [randomImage, setRandomImage] = useState<string>(images[0]);

  // Funkcja losująca obrazek
  const pickRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * images.length);
    setRandomImage(images[randomIndex]);
  };

  // Losuj obrazek przy montowaniu komponentu
  useEffect(() => {
    pickRandomImage();
  }, []);

  return (
    <div className="not-found min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      {/* Główny kontener */}
      <div className="text-center space-y-6">
        {/* Losowy obrazek Funko Pop */}
        <img
          src={randomImage} // Wyświetlenie losowego obrazka
          /*alt="Funko Pop Error" */
          className="w-48 h-48 mx-auto"
        />

        {/* Nagłówek */}
        <h1 className="text-5xl font-bold text-red-500">404</h1>

        {/* Komunikat */}
        <p className="text-xl text-gray-600">
          Oops! Looks like the site that You are looking for doesn't exist or You have no connection !
        </p>

        {/* Przycisk powrotu do strony głównej */}
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Wróć do strony głównej
        </Link>
      </div>
    </div>
  );
};

export default NotFound;