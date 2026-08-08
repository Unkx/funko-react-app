import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import Layout from "./Layout";
import { translations as loginTranslations } from "./Translations/TranslationsLogIn";
import { translations as registerTranslations } from "./Translations/TranslationRegistersite";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://funko-backend.onrender.com";

const LoginRegisterSite: React.FC = () => {
  const { language } = useContext(LanguageContext);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const tLogin = loginTranslations[language] || loginTranslations["EN"];
  const tRegister = registerTranslations[language] || registerTranslations["EN"];

  const [showRegister, setShowRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState<"email" | "code" | "password">("email");

  // Login
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register
  const [email, setEmail] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

  // Password Reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [passwordResetError, setPasswordResetError] = useState("");
  const [passwordResetMessage, setPasswordResetMessage] = useState("");

  const inputClass = `w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
    isDarkMode
      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400/50"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400"
  }`;

  const primaryBtnClass = `w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
    isDarkMode ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-blue-600 hover:bg-blue-700 text-white"
  }`;

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!login || !password) {
      setLoginError(tLogin.emptyFieldsError || "Please fill all fields.");
      return;
    }
    try {
      const response = await fetch(`${baseURL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      navigate(data.user.role === "admin" ? "/AdminSite" : "/dashboardSite");
    } catch {
      setLoginError("Connection error. Please try again.");
    }
  };

  // Invite token validation
  useEffect(() => {
    if (!inviteToken?.trim()) {
      setInviteValid(null);
      setInviteChecking(false);
      return;
    }
    setInviteChecking(true);
    setInviteValid(null);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${baseURL}/api/verify-invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken.trim() }),
        });
        const data = await res.json();
        setInviteValid(Boolean(data?.valid));
      } catch {
        setInviteValid(false);
      } finally {
        setInviteChecking(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [inviteToken]);

  // Register handler
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const usernameRegex = /^(?=.{3,20}$)(?![._])(?!.*[._]{2})[A-Za-z0-9._]+(?<![._])$/;
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
  const passwordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (!email || !regLogin || !name || !surname || !regPassword || !confirmPassword || !gender || !dateOfBirth) {
      setRegisterError(tRegister.allFieldsRequired || "All fields are required.");
      return;
    }
    if (!emailRegex.test(email)) {
      setRegisterError(tRegister.invalidEmail || "Please enter a valid email.");
      return;
    }
    if (!usernameRegex.test(regLogin)) {
      setRegisterError(tRegister.invalidUsername || "Invalid username format.");
      return;
    }
    if (!nameRegex.test(name) || !nameRegex.test(surname)) {
      setRegisterError(tRegister.invalidName || "Please enter valid names.");
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegisterError(tRegister.passwordsDoNotMatch || "Passwords do not match.");
      return;
    }
    if (!passwordRegex.test(regPassword)) {
      setRegisterError(tRegister.weakPassword || "Password must be 8+ chars with upper, lower, number, and special character.");
      return;
    }
    const birth = new Date(dateOfBirth);
    const age = Math.abs(new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970);
    if (isNaN(age) || age < 13) {
      setRegisterError(tRegister.invalidAge || "You must be at least 13 years old.");
      return;
    }
    const payload: any = {
      email,
      login: regLogin,
      name,
      surname,
      password: regPassword,
      gender,
      nationality,
      date_of_birth: new Date(dateOfBirth).toISOString().split("T")[0],
    };
    if (inviteToken?.trim()) payload.invite_token = inviteToken.trim();
    try {
      const response = await fetch(`${baseURL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || "Registration failed");
      }
      navigate("/dashboardSite");
    } catch (err: any) {
      setRegisterError(err.message || "Connection error.");
    }
  };

  // Password Reset handlers
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError("");
    setPasswordResetMessage("");
    if (!resetEmail) {
      setPasswordResetError(tLogin.enterEmail || "Please enter your email");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordResetError(data.error || "Error");
        return;
      }
      setPasswordResetMessage(data.message || "Code sent!");
      setPasswordResetStep("code");
    } catch {
      setPasswordResetError("Connection error.");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError("");
    if (!resetCode) {
      setPasswordResetError(tLogin.enterResetCode || "Enter code");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: resetCode }),
      });
      if (!res.ok) {
        setPasswordResetError((await res.json()).error || "Invalid code");
        return;
      }
      setPasswordResetStep("password");
    } catch {
      setPasswordResetError("Connection error.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError("");
    if (!resetNewPassword || !resetConfirmPassword) {
      setPasswordResetError("Enter passwords");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setPasswordResetError(tLogin.passwordMismatch || "Passwords don't match");
      return;
    }
    try {
      const res = await fetch(`${baseURL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: resetCode, newPassword: resetNewPassword, confirmPassword: resetConfirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordResetError(data.error || "Error");
        return;
      }
      setPasswordResetMessage(tLogin.passwordReset || data.message);
      setTimeout(() => {
        setShowPasswordReset(false);
        setPasswordResetStep("email");
        setResetEmail("");
        setResetCode("");
        setResetNewPassword("");
        setResetConfirmPassword("");
        setPasswordResetError("");
        setPasswordResetMessage("");
      }, 2000);
    } catch {
      setPasswordResetError("Connection error.");
    }
  };

  const resetPasswordSubmit =
    passwordResetStep === "email" ? handleForgotPassword : passwordResetStep === "code" ? handleVerifyCode : handleResetPassword;

  const showLogin = !showRegister && !showPasswordReset;

  return (
    <Layout translations={tLogin} showSearch={false}>
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {showLogin && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div
                className={`rounded-lg border shadow-lg p-6 sm:p-8 ${
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                }`}
              >
                <h2 className={`text-2xl font-bold mb-6 font-['Righteous'] ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                  {tLogin.goToLoginSite || "Sign In"}
                </h2>

                {loginError && (
                  <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-user" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {tLogin.login || "Username"}
                    </label>
                    <input id="login-user" type="text" value={login} onChange={(e) => setLogin(e.target.value)} className={inputClass} placeholder={tLogin.login || "Username"} />
                  </div>

                  <div>
                    <label htmlFor="login-pass" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {tLogin.password || "Password"}
                    </label>
                    <div className="relative">
                      <input
                        id="login-pass"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder={tLogin.password || "Password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className={primaryBtnClass}>
                    {tLogin.loginButton || "Sign In"}
                  </button>
                </form>

                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className={`text-sm transition-colors ${isDarkMode ? "text-amber-400 hover:text-amber-300" : "text-blue-600 hover:text-blue-700"}`}
                  >
                    {tLogin.forgotPassword || "Forgot password?"}
                  </button>
                  <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {tLogin.registerLink || "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setShowRegister(true)}
                      className={`font-semibold transition-colors ${isDarkMode ? "text-amber-400 hover:text-amber-300" : "text-blue-600 hover:text-blue-700"}`}
                    >
                      {tLogin.registerNow || "Sign Up"}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSWORD RESET */}
          {showPasswordReset && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className={`rounded-lg border shadow-lg p-6 sm:p-8 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h2 className={`text-2xl font-bold mb-6 font-['Righteous'] ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                  {tLogin.forgotPasswordTitle || "Reset Password"}
                </h2>

                {passwordResetError && (
                  <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordResetError}</span>
                  </div>
                )}
                {passwordResetMessage && (
                  <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordResetMessage}</span>
                  </div>
                )}

                <form onSubmit={resetPasswordSubmit} className="space-y-4">
                  {passwordResetStep === "email" && (
                    <>
                      <div>
                        <label htmlFor="reset-email" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          Email
                        </label>
                        <input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputClass} placeholder={tLogin.enterEmail || "your@email.com"} />
                      </div>
                      <button type="submit" className={primaryBtnClass}>
                        {tLogin.sendCode || "Send Code"}
                      </button>
                    </>
                  )}
                  {passwordResetStep === "code" && (
                    <>
                      <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{tLogin.resetCodeSent || "Check your email for the code."}</p>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
                        maxLength={6}
                        placeholder="------"
                      />
                      <button type="submit" className={primaryBtnClass}>
                        {tLogin.verifyCode || "Verify"}
                      </button>
                    </>
                  )}
                  {passwordResetStep === "password" && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {tLogin.newPassword || "New Password"}
                        </label>
                        <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {tLogin.confirmPassword || "Confirm Password"}
                        </label>
                        <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} className={inputClass} />
                      </div>
                      <button type="submit" className={primaryBtnClass}>
                        {tLogin.resetPassword || "Reset Password"}
                      </button>
                    </>
                  )}
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setPasswordResetStep("email");
                    setPasswordResetError("");
                    setPasswordResetMessage("");
                  }}
                  className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {tLogin.backToLoginLink || "Back to Login"}
                </button>
              </div>
            </motion.div>
          )}

          {/* REGISTER */}
          {showRegister && !showPasswordReset && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <div className={`rounded-lg border shadow-lg p-6 sm:p-8 ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                <h2 className={`text-2xl font-bold mb-6 font-['Righteous'] ${isDarkMode ? "text-amber-400" : "text-blue-600"}`}>
                  {tRegister.registerTitle || "Create Account"}
                </h2>

                {registerError && (
                  <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg text-sm ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{registerError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Account Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {tRegister.username || "Username"} *
                      </label>
                      <input type="text" value={regLogin} onChange={(e) => setRegLogin(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Email *
                      </label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {tRegister.name || "First Name"} *
                      </label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {tRegister.surname || "Last Name"} *
                      </label>
                      <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {tRegister.password || "Password"} *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                        aria-label="Toggle password"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {tRegister.confirmPassword || "Confirm Password"} *
                    </label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {tRegister.selectGender || "Gender"} *
                      </label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                        <option value="">{tRegister.selectGender || "Select..."}</option>
                        <option value="male">{tRegister.male || "Male"}</option>
                        <option value="female">{tRegister.female || "Female"}</option>
                        <option value="other">{tRegister.other || "Other"}</option>
                        <option value="prefer_not_to_say">{tRegister.preferNotToSay || "Prefer not to say"}</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {tRegister.dateOfBirth || "Date of Birth"} *
                      </label>
                      <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {tRegister.nationality || "Nationality"}
                    </label>
                    <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputClass} />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {tRegister.inviteToken ?? "Invite Token (optional)"}
                    </label>
                    <input type="text" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} className={inputClass} />
                    <div className="h-5 mt-1 text-xs">
                      {inviteChecking && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {tRegister.inviteTokenChecking || "Checking..."}
                        </span>
                      )}
                      {inviteValid === true && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          {tRegister.inviteTokenValid || "Valid"}
                        </span>
                      )}
                      {inviteValid === false && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          {tRegister.inviteTokenInvalid || "Invalid"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className={`flex-1 ${primaryBtnClass}`}>
                      {tRegister.registerButton || "Create Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegister(false)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {tRegister.backToLogin || "Back"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default LoginRegisterSite;
