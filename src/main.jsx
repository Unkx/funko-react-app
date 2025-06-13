// main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import WelcomeSite from "./WelcomeSite";
import SearchSite from "./SearchSite";
import LoginSite from "./LoginSite"
import RegisterSite from "./RegisterSite"
import DashboardSite from "./DashboardSite"
import AdminSite from "./Admin"
import NotFound from './NotFound';
import { NetworkProvider } from './NetworkContext';
import { LanguageProvider } from "./LanguageContext";

import LanguageSelectorPopup from "./LanguageSelectorPopup";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <NetworkProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<WelcomeSite />} />
            <Route path="/SearchSite" element={<SearchSite />} />
            <Route path="/LoginSite" element={<LoginSite />} />
            <Route path="/RegisterSite" element={<RegisterSite />} />
            <Route path="/DashboardSite" element={<DashboardSite />} />
            <Route path="/AdminSite" element={<AdminSite />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </NetworkProvider>
  </React.StrictMode>
);