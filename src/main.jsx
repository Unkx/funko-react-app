// With page transition animations (commented out for now)

// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";

// import WelcomeSite from "./WelcomeSite";
// import SearchSite from "./SearchSite";
// import FunkoDetails from "./FunkoDetails";
// import LoginSite from "./LoginSite";
// import LoginRegisterSite from "./LoginRegisterSite";
// import RegisterSite from "./RegisterSite";
// import DashboardSite from "./DashboardSite";
// import AdminSite from "./Admin";
// import NotFound from "./NotFound";

// import { NetworkProvider } from "./NetworkContext";
// import { LanguageProvider } from "./LanguageContext";

// const pageVariants = {
//   initial: { opacity: 0, x: 100 },
//   animate: { opacity: 1, x: 0 },
//   exit: { opacity: 0, x: -100 },
// };

// const PageWrapper = ({ children }) => (
//   <motion.div
//     variants={pageVariants}
//     initial="initial"
//     animate="animate"
//     exit="exit"
//     transition={{ duration: 0.4, ease: "easeInOut" }}
//     className="min-h-screen"
//   >
//     {children}
//   </motion.div>
// );

// function AnimatedRoutes() {
//   const location = useLocation();

//   return (
//     <AnimatePresence mode="wait">
//       <Routes location={location} key={location.pathname}>
//         <Route path="/" element={<PageWrapper><WelcomeSite /></PageWrapper>} />
//         <Route path="/SearchSite" element={<PageWrapper><SearchSite /></PageWrapper>} />
//         <Route path="/funko/:id" element={<PageWrapper><FunkoDetails /></PageWrapper>} />
//         <Route path="/LoginSite" element={<PageWrapper><LoginSite /></PageWrapper>} />
//         <Route path="/LoginRegisterSite" element={<PageWrapper><LoginRegisterSite /></PageWrapper>} />
//         <Route path="/RegisterSite" element={<PageWrapper><RegisterSite /></PageWrapper>} />
//         <Route path="/DashboardSite" element={<PageWrapper><DashboardSite /></PageWrapper>} />
//         <Route path="/AdminSite" element={<PageWrapper><AdminSite /></PageWrapper>} />
//         <Route path="/404" element={<PageWrapper><NotFound /></PageWrapper>} />
//         <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
//         <Route path="/collection" element={<CollectionPage isDarkMode={isDarkMode} language={language} />} />
//         <Route path="/wishlist" element={<WishlistPage isDarkMode={isDarkMode} language={language} />} />

//       </Routes>
//     </AnimatePresence>
//   );
// }

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <React.StrictMode>
//     <NetworkProvider>
//       <LanguageProvider>
//         <Router>
//           <AnimatedRoutes />
//         </Router>
//       </LanguageProvider>
//     </NetworkProvider>
//   </React.StrictMode>
// );
// `Added import and route for LoginRegisterSite component` --- IGNORE ---


// Without page transition animations for simplicity

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import WelcomeSite from "./WelcomeSite";
import SearchSite from "./SearchSite";
import FunkoDetails from "./FunkoDetails";
import LoginSite from "./LoginSite"
import LoginRegisterSite from "./LoginRegisterSite"
import RegisterSite from "./RegisterSite"
import DashboardSite from "./DashboardSite"
import AdminSite from "./Admin"
import NotFound from './NotFound';
import CollectionPage from "./CollectionPage";
import WishlistPage from "./WishlistPage";
import Requests from "./Requests";
import ChatComponent from "./ChatComponent";

import CategoriesSite from './CategoriesSite';
import MostVisitedSite from './MostVisitedSite';


import { NetworkProvider } from './NetworkContext';
import { LanguageProvider } from "./LanguageContext";

import LanguageSelectorPopup from "./LanguageSelectorPopup";

const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <NetworkProvider>
      <LanguageProvider>
        <Router>
          
          <Routes>
            <Route path="/" element={<WelcomeSite />} />
            <Route path="/SearchSite" element={<SearchSite />} />
            <Route path="/funko/:id" element={<FunkoDetails />} />
            <Route path="/LoginSite" element={<LoginSite />} />
            <Route path="/LoginRegisterSite" element={<LoginRegisterSite />} />
            <Route path="/RegisterSite" element={<RegisterSite />} />
            <Route path="/DashboardSite" element={<DashboardSite />} />
            <Route path="/AdminSite" element={<AdminSite />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/categories" element={<CategoriesSite />} />
            <Route path="/mostVisited" element={<MostVisitedSite />} />
            {/* <Route path="/chat" element={<ChatComponent />} /> */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </NetworkProvider>
  </React.StrictMode>
);