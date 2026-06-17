import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NetworkProvider } from "./NetworkContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./ThemeContext";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <NetworkProvider>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </NetworkProvider>
  </React.StrictMode>
);
