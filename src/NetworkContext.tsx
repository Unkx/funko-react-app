// src/NetworkContext.tsx

import React, { createContext, useState, useEffect } from 'react';

// Typ dla wartości kontekstu
interface NetworkContextType {
  isOnline: boolean;
}

// Tworzymy kontekst
export const NetworkContext = createContext<NetworkContextType>({
  isOnline: true, // Wartość domyślna
});

// Provider dla kontekstu
export const NetworkProvider: React.FC = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // Funkcja aktualizująca stan połączenia
    const handleStatusChange = () => setIsOnline(navigator.onLine);

    // Dodaj nasłuchiwania zdarzeń
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Usuń nasłuchiwania przy demontażu komponentu
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};