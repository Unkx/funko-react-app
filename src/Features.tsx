// src/pages/FeaturesSite.tsx
import React, { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationFeatures";
import Layout from './Layout';
import { useTheme } from './ThemeContext';
import { LanguageContext } from './LanguageContext';
import {
  BookOpen, Star, Tag, Zap,
  Search, BarChart3, Bot, TrendingUp,
  Users, Share2, Globe, Moon, Check, Target
} from 'lucide-react';

const featureIcons: Record<string, React.FC<{ className?: string }>> = {
  feature1Title: BookOpen,
  feature2Title: Star,
  feature11Title: Tag,
  feature12Title: Zap,
  feature3Title: Search,
  feature4Title: BarChart3,
  feature5Title: Bot,
  feature10Title: TrendingUp,
  feature8Title: Users,
  feature7Title: Share2,
  feature6Title: Globe,
  feature9Title: Moon,
};

const featureCategories = [
  {
    titleKey: "collectionManagement",
    features: [
      { titleKey: "feature1Title", descKey: "feature1Desc" },
      { titleKey: "feature2Title", descKey: "feature2Desc" },
      { titleKey: "feature11Title", descKey: "feature11Desc" },
      { titleKey: "feature12Title", descKey: "feature12Desc" },
    ],
    color: "bg-blue-600",
  },
  {
    titleKey: "discoveryTools",
    features: [
      { titleKey: "feature3Title", descKey: "feature3Desc" },
      { titleKey: "feature4Title", descKey: "feature4Desc" },
      { titleKey: "feature5Title", descKey: "feature5Desc" },
      { titleKey: "feature10Title", descKey: "feature10Desc" },
    ],
    color: "bg-green-600",
  },
  {
    titleKey: "communityFeatures",
    features: [
      { titleKey: "feature8Title", descKey: "feature8Desc" },
      { titleKey: "feature7Title", descKey: "feature7Desc" },
      { titleKey: "feature6Title", descKey: "feature6Desc" },
      { titleKey: "feature9Title", descKey: "feature9Desc" },
    ],
    color: "bg-purple-600",
  },
];

// Steps data
const steps = [
  { number: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { number: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { number: "03", titleKey: "step3Title", descKey: "step3Desc" },
];


const FeaturesSite: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();

  const t = translations[language as keyof typeof translations] || translations.EN;

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/loginregistersite");
      }, 10 * 60 * 1000);
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate]);

  return (
    <Layout translations={t}>
      {/* Hero Section */}
      <section className={`relative overflow-hidden border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
              {t.pageTitle}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {t.heroTitle}
            </p>
            <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto">
              {t.heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16 last:mb-0">
              <h2 className={`text-2xl font-bold mb-8 inline-block px-6 py-2 rounded-full text-white ${category.color}`}>
                {t[category.titleKey as keyof typeof t]}
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className={`p-6 rounded-lg transition-colors duration-200 ${
                      isDarkMode
                        ? "bg-slate-900 hover:bg-slate-800"
                        : "bg-white hover:bg-slate-50 border border-gray-100"
                    }`}
                  >
                    <div className={`mb-4 ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                      {(() => { const Icon = featureIcons[feature.titleKey]; return Icon ? <Icon className="w-8 h-8" /> : null; })()}
                    </div>
                    <h3 className="text-xl font-bold mb-3">
                      {t[feature.titleKey as keyof typeof t]}
                    </h3>
                    <p className="opacity-90 text-sm">
                      {t[feature.descKey as keyof typeof t]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
              >
                <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl z-10 ${
                  index === 0 ? "bg-blue-500" :
                  index === 1 ? "bg-green-500" : "bg-purple-500"
                }`}>
                  {step.number}
                </div>
                <div className={`p-6 pt-10 rounded-lg relative ${
                  isDarkMode ? "bg-slate-800" : "bg-white shadow-lg"
                }`}>
                  <h3 className="text-xl font-bold mb-3">
                    {t[step.titleKey as keyof typeof t]}
                  </h3>
                  <p className="opacity-90">
                    {t[step.descKey as keyof typeof t]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-950" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className={`max-w-4xl mx-auto p-8 rounded-lg border ${
            isDarkMode
              ? "bg-slate-800 border-gray-700"
              : "bg-white border-gray-200 shadow-lg"
          }`}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Experience Pop&Go!</h3>
                <p className="mb-6 opacity-90">
                  See how our features work together to create the perfect collection management experience.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-amber-400 text-black" : "bg-blue-600 text-white"
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span>Easy item cataloging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-amber-400 text-black" : "bg-blue-600 text-white"
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span>Smart wishlist management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-amber-400 text-black" : "bg-blue-600 text-white"
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span>Community features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-amber-400 text-black" : "bg-blue-600 text-white"
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span>AI-powered tools</span>
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                isDarkMode ? "bg-slate-900" : "bg-white shadow-inner"
              }`}>
                <div className={`aspect-video rounded-lg overflow-hidden flex items-center justify-center ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div className="text-center">
                    <div className={`flex justify-center mb-4 ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                      <Target className="w-10 h-10" />
                    </div>
                    <p className="font-bold">All Features Included</p>
                    <p className="text-sm opacity-75 mt-2">No premium tiers, no hidden costs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-800" : "bg-blue-600"}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            {t.ctaTitle}
          </h2>
          <p className="text-xl mb-8 text-white opacity-90 max-w-2xl mx-auto">
            {t.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/loginregistersite"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                isDarkMode
                  ? "bg-amber-400 text-black hover:bg-yellow-400"
                  : "bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
              }`}
            >
              {t.startFreeButton}
            </Link>
            <Link
              to="/mostvisited"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                isDarkMode
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-gray-600"
                  : "bg-transparent text-white border-2 border-white hover:bg-white/10"
              }`}
            >
              {t.exploreDemoButton}
            </Link>
            <Link
              to="/categories"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                isDarkMode
                  ? "bg-transparent text-white border-2 border-white hover:bg-white/10"
                  : "bg-amber-400 text-black hover:bg-yellow-400 shadow-lg"
              }`}
            >
              {t.seeCollectionsButton}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default FeaturesSite;
