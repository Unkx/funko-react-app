import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import WelcomeSite from "./WelcomeSite";
import SearchSite from "./SearchSite";
import FunkoDetails from "./FunkoDetails";
import LoginRegisterSite from "./LoginRegisterSite";
import RegisterSite from "./RegisterSite";
import DashboardSite from "./DashboardSite";
import AdminSite from "./Admin";
import AdminInvites from "./AdminInvites";
import NotFound from "./NotFound";
import AboutUsSite from "./AboutUsSite";
import CollectionPage from "./CollectionPage";
import WishlistPage from "./WishlistPage";
import Requests from "./Requests";
import FeaturesSite from "./Features";
import CategoriesSite from "./CategoriesSite";
import MostVisitedSite from "./MostVisitedSite";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeSite />} />
        <Route path="/SearchSite" element={<SearchSite />} />
        <Route path="/funko/:id" element={<FunkoDetails />} />
        <Route path="/item/:id" element={<FunkoDetails />} />
        <Route path="/loginregistersite" element={<LoginRegisterSite />} />
        <Route path="/RegisterSite" element={<RegisterSite />} />
        <Route path="/DashboardSite" element={<DashboardSite />} />
        <Route path="/AdminSite" element={<AdminSite />} />
        <Route path="/admin-management" element={<AdminInvites />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/categories" element={<CategoriesSite />} />
        <Route path="/mostVisited" element={<MostVisitedSite />} />
        <Route path="/about" element={<AboutUsSite />} />
        <Route path="/features" element={<FeaturesSite />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
