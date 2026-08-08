import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { translations } from "./Translations/TranslationRegistersite"; // Assuming translations are also for Register
import Layout from './Layout';
import { useTheme } from './ThemeContext';
import { LanguageContext } from './LanguageContext';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://funko-backend.onrender.com';

const RegisterSite: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const t = translations[language] || translations["EN"];

  // Registration form state
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [registerError, setRegisterError] = useState("");

  // Validation regexes
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const usernameRegex = /^(?=.{3,20}$)(?![._])(?!.*[._]{2})[A-Za-z0-9._]+(?<![._])$/;
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/;
  const passwordRegex = /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;


  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(""); // Clear previous errors

    // Enhanced client-side validation: check for empty strings after trimming whitespace
    if (
      !email.trim() ||
      !login.trim() ||
      !name.trim() ||
      !surname.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !gender.trim() ||
      !dateOfBirth.trim()
    ) {
      setRegisterError(t.allFieldsRequired || "All fields are required.");
      return;
    }

    // Field-specific regex validation
    if (!emailRegex.test(email)) {
      setRegisterError(t.invalidEmail || "Please enter a valid email address.");
      return;
    }

    if (!usernameRegex.test(login)) {
      setRegisterError(
        t.invalidUsername ||
          "Username must be 3–20 characters, letters/numbers, no leading/trailing or consecutive ./_"
      );
      return;
    }

    if (!nameRegex.test(name) || !nameRegex.test(surname)) {
      setRegisterError(t.invalidName || "Please enter a valid first and last name.");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError(t.passwordsDoNotMatch || "Passwords do not match.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setRegisterError(
        t.weakPassword ||
          "Password must be at least 8 characters, include upper and lower case letters, a number, and a special character (no spaces)."
      );
      return;
    }

    // Optional: check minimum age (e.g., 13 years)
    const birth = new Date(dateOfBirth);
    const ageDifMs = Date.now() - birth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (Number.isNaN(age) || age < 13) {
      setRegisterError(t.invalidAge || "You must be at least 13 years old to register.");
      return;
    }

    // Prepare the payload for the backend
    const payload: any = {
      email,
      login,
      name,
      surname,
      password,
      gender,
      role: "user",
      date_of_birth: new Date(dateOfBirth).toISOString().split('T')[0] // Format for backend
    };

    // Include invite token if provided (optional) so backend can elevate role
    if (inviteToken?.trim()) {
      payload.invite_token = inviteToken.trim();
    }
    try {
      const response = await fetch(`${baseURL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the prepared payload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      // Registration successful
      navigate("/dashboardSite");

    } catch (error: any) {
      setRegisterError(error.message || 'Failed to connect to server. Please try again.');
    }
  };

  // Debounced invite token validation
  useEffect(() => {
    if (!inviteToken || !inviteToken.trim()) {
      setInviteValid(null);
      setInviteChecking(false);
      return;
    }

    setInviteChecking(true);
    setInviteValid(null);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${baseURL}/api/verify-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken.trim() })
        });
        const data = await res.json();
        setInviteValid(Boolean(data && data.valid));
      } catch (err) {
        setInviteValid(false);
      } finally {
        setInviteChecking(false);
      }
    }, 600);

    return () => clearTimeout(id);
  }, [inviteToken]);


  

  return (
    <Layout translations={t}>

      {/* Main content - Register form */}
      <main className="flex-grow p-8 flex flex-col items-center justify-center">
        <h2
          className={`text-2xl font-bold mb-4 ${
            isDarkMode ? "text-amber-400" : "text-green-600"
          }`}
        >
          {t.registerTitle || "Create an Account"}
        </h2>

        <form
          onSubmit={handleRegister}
          className={`max-w-md w-full flex flex-col gap-4 bg-gray-200 p-6 rounded-lg shadow-md ${
            isDarkMode ? "bg-slate-800 text-white" : ""
          }`}
        >
          {registerError && (
            <p className="text-red-500 mb-2 text-center">{registerError}</p>
          )}


          <input
            type="text"
            placeholder={t.username ?? "Username"}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />          
          <input
            type="email"
            placeholder={t.email ?? "Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />
          <input
            type="text"
            placeholder={t.name ?? "First Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />
          <input
            type="text"
            placeholder={t.surname ?? "Last Name"}
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />
          <input
            type="password"
            placeholder={t.password ?? "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />
          <input
            type="password"
            placeholder={t.confirmPassword ?? "Confirm Password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          />
          <input
            type="text"
            placeholder={t.inviteToken ?? "Invite token (optional)"}
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
          />
          <div className="text-sm h-5 mt-1">
            {inviteChecking && <span className="text-slate-400">{t.inviteTokenChecking}</span>}
            {inviteValid === true && <span className="text-green-500">{t.inviteTokenValid}</span>}
            {inviteValid === false && <span className="text-red-500">{t.inviteTokenInvalid}</span>}
          </div>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
            lang={language.toLowerCase()} // Add this line
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`px-4 py-2 rounded ${
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"
            }`}
            required
          >
            <option value="" disabled>
              {t.selectGender ?? "Select Gender"}
            </option>
            <option value="male">{t.male ?? "Male"}</option>
            <option value="female">{t.female ?? "Female"}</option>
            <option value="other">{t.other ?? "Other"}</option>
            <option value="prefer_not_to_say">
              {t.preferNotToSay ?? "Prefer not to say"}
            </option>
          </select>
          <button
            type="submit"
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-amber-400 hover:bg-amber-500 text-black"
                : "bg-green-600 hover:bg-green-700 text-white"
            } transition-colors`}
          >
            {t.registerButton ?? "Register"}
          </button>
        </form>


        <div className="mt-4 text-center">
          <span className={`${isDarkMode ? "text-slate-300" : "text-gray-700"} mr-2`}>
            {t.alreadyHaveAccount || "Already have an account?"}
          </span>
       <Link
          to={localStorage.getItem("user") ? "/dashboardSite" : "/loginregistersite"}
          className={`px-4 py-2 rounded ${
            isDarkMode
              ? "bg-amber-400 text-black hover:bg-amber-500"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {localStorage.getItem("user")
            ? translations[language].goToDashboard || "Dashboard"
            : translations[language].goToLoginSite || "Log In"}
        </Link>
        </div>
      </main>

    </Layout>
  );
};

export default RegisterSite;
