import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import WelcomeSite from "./WelcomeSite";
import SearchSite from "./SearchSite";
import FunkoDetails from "./FunkoDetails";
import LoginSite from "./LoginSite";
import LoginRegisterSite from "./LoginRegisterSite";
import RegisterSite from "./RegisterSite";
import DashboardSite from "./DashboardSite";
import AdminSite from "./Admin";
import NotFound from "./NotFound";

import { NetworkProvider } from "./NetworkContext";
import { LanguageProvider } from "./LanguageContext";

const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

const PageWrapper = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.4, ease: "easeInOut" }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><WelcomeSite /></PageWrapper>} />
        <Route path="/SearchSite" element={<PageWrapper><SearchSite /></PageWrapper>} />
        <Route path="/funko/:id" element={<PageWrapper><FunkoDetails /></PageWrapper>} />
        <Route path="/LoginSite" element={<PageWrapper><LoginSite /></PageWrapper>} />
        <Route path="/LoginRegisterSite" element={<PageWrapper><LoginRegisterSite /></PageWrapper>} />
        <Route path="/RegisterSite" element={<PageWrapper><RegisterSite /></PageWrapper>} />
        <Route path="/DashboardSite" element={<PageWrapper><DashboardSite /></PageWrapper>} />
        <Route path="/AdminSite" element={<PageWrapper><AdminSite /></PageWrapper>} />
        <Route path="/404" element={<PageWrapper><NotFound /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <NetworkProvider>
      <LanguageProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </LanguageProvider>
    </NetworkProvider>
  </React.StrictMode>
);
// `Added import and route for LoginRegisterSite component` --- IGNORE ---