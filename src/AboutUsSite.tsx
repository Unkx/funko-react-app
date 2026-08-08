// src/pages/AboutUsSite.tsx
import React, { useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import TeamMember1 from "/src/assets/avatars/boy.png";
import TeamMember2 from "/src/assets/avatars/woman.png";
import TeamMember3 from "/src/assets/avatars/man.png";
import { translations } from "./Translations/TranslationAboutUs";
import Layout from './Layout';
import { useTheme } from './ThemeContext';
import { LanguageContext } from './LanguageContext';
import { BookOpen, Star, BarChart3, Users, Bot, Globe, Target, Eye } from 'lucide-react';
// Team members data
const teamMembers = [
  {
    name: "Alex Johnson",
    role: "Founder & Collector",
    bio: "Funko collector since 2010 with over 1500 items. Created Pop&Go! to solve collection management challenges.",
    image: TeamMember1,
  },
  {
    name: "Maria Chen",
    role: "UI/UX Designer",
    bio: "Design enthusiast and anime collector. Focuses on creating intuitive and beautiful collection interfaces.",
    image: TeamMember2,
  },
  {
    name: "David Wilson",
    role: "Lead Developer",
    bio: "Tech wizard and Marvel collector. Built the entire platform with collectors' needs in mind.",
    image: TeamMember3,
  },
];

// Features data
const aboutFeatureIcons: Record<string, React.FC<{ className?: string }>> = {
  feature1Title: BookOpen, feature2Title: Star, feature3Title: BarChart3,
  feature4Title: Users, feature5Title: Bot, feature6Title: Globe,
};

const features = [
  { titleKey: "feature1Title", descKey: "feature1Desc" },
  { titleKey: "feature2Title", descKey: "feature2Desc" },
  { titleKey: "feature3Title", descKey: "feature3Desc" },
  { titleKey: "feature4Title", descKey: "feature4Desc" },
  { titleKey: "feature5Title", descKey: "feature5Desc" },
  { titleKey: "feature6Title", descKey: "feature6Desc" },
];

// Testimonials data
const testimonials = [
  { textKey: "testimonial1", authorKey: "testimonial1Author" },
  { textKey: "testimonial2", authorKey: "testimonial2Author" },
  { textKey: "testimonial3", authorKey: "testimonial3Author" },
];

const AboutUsSite: React.FC = () => {
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/categories"
                className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                  isDarkMode
                    ? "bg-amber-400 text-black hover:bg-amber-500"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                }`}
              >
                {t.startButton}
              </Link>
              <Link
                to="/features"
                className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-white text-blue-600 hover:bg-gray-100 shadow-lg"
                }`}
              >
                {t.exploreButton}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span className={`p-2 rounded-full ${isDarkMode ? "bg-amber-400 text-black" : "bg-blue-100 text-blue-600"}`}>
                <BookOpen className="w-5 h-5" />
              </span>
              {t.ourStory}
            </h2>
            <p className="text-lg mb-8 leading-relaxed">
              {t.storyContent}
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <span className={`p-1 rounded ${isDarkMode ? "bg-green-500" : "bg-green-100 text-green-600"}`}>
                    <Target className="w-4 h-4" />
                  </span>
                  {t.ourMission}
                </h3>
                <p className="opacity-90">{t.missionContent}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <span className={`p-1 rounded ${isDarkMode ? "bg-purple-500" : "bg-purple-100 text-purple-600"}`}>
                    <Eye className="w-4 h-4" />
                  </span>
                  {t.ourVision}
                </h3>
                <p className="opacity-90">{t.visionContent}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.featuresTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-white hover:bg-slate-50 border border-gray-100"
                }`}
              >
                <div className={`mb-4 ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                  {(() => { const Icon = aboutFeatureIcons[feature.titleKey]; return Icon ? <Icon className="w-8 h-8" /> : null; })()}
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {t[feature.titleKey as keyof typeof t]}
                </h3>
                <p className="opacity-90">
                  {t[feature.descKey as keyof typeof t]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.meetTheTeam}</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.teamDescription}
            </p>
          </div>
          
          <div className="grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg text-center ${
                  isDarkMode ? "bg-slate-800" : "bg-white shadow-md"
                }`}
              >
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                  isDarkMode ? "bg-amber-400 text-black" : "bg-blue-600 text-white"
                }`}>
                  {member.role}
                </div>
                <p className="opacity-90 text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">{t.testimonialsTitle}</h2>
          <div className="grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg ${
                  isDarkMode ? "bg-slate-900" : "bg-white shadow-lg"
                }`}
              >
                <div className="text-4xl mb-4 opacity-50">"</div>
                <p className="italic mb-6 text-lg">
                  {t[testimonial.textKey as keyof typeof t]}
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{t[testimonial.authorKey as keyof typeof t]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${isDarkMode ? "bg-slate-800" : "bg-blue-600"}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            {t.joinCommunity}
          </h2>
          <p className="text-xl mb-8 text-white opacity-90 max-w-2xl mx-auto">
            {t.joinDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                isDarkMode
                  ? "bg-amber-400 text-black hover:bg-yellow-400"
                  : "bg-white text-blue-600 hover:bg-gray-100"
              }`}
            >
              {t.startButton}
            </Link>
            <Link
              to="/features"
              className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
                isDarkMode
                  ? "bg-slate-800 text-white hover:bg-slate-700 border border-gray-600"
                  : "bg-transparent text-white border-2 border-white hover:bg-white/10"
              }`}
            >
              {t.exploreButton}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default AboutUsSite;