import { LanguageSelect } from '../components/LanguageSelect.jsx';
import React, { useState, useEffect } from 'react';
import {
  Leaf,
  ArrowRight,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Wheat,
  Check,
  HelpCircle,
  X
} from 'lucide-react';

const DISTRICT_LIST = [
  { name: 'Kolhapur', state: 'Maharashtra', apmc: 'Kolhapur Central APMC' },
  { name: 'Nashik', state: 'Maharashtra', apmc: 'Pimpalgaon / Nashik APMC' },
  { name: 'Pune', state: 'Maharashtra', apmc: 'Gultekdi Market Yard' },
  { name: 'Shimla', state: 'Himachal Pradesh', apmc: 'Bhattakufer Fruit Mandi' },
  { name: 'Sangli', state: 'Maharashtra', apmc: 'Sangli Central Mandi' },
  { name: 'Satara', state: 'Maharashtra', apmc: 'Satara APMC Market' },
  { name: 'Solapur', state: 'Maharashtra', apmc: 'Solapur Agricultural Market' },
  { name: 'Ahmednagar', state: 'Maharashtra', apmc: 'Rahata / Ahmednagar APMC' },
  { name: 'Nagpur', state: 'Maharashtra', apmc: 'Kalamna Fruit & Veg Market' },
  { name: 'Bengaluru', state: 'Karnataka', apmc: 'Yeshwanthpur APMC Yard' },
];

export const AuthPage = ({ initialTab = 'login', onLoginSuccess, onNavigate, language, onLanguageChange, translationStatus, translationError, onRetryTranslation }) => {
  const [tab, setTab] = useState(initialTab);

  // Login Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States (Requested: full name, phone number, district, create new password, conform password)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState('Kolhapur');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Feedback & Modal States
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Synchronize tab if prop changes
  useEffect(() => {
    localStorage.removeItem('agrisense_registered_users');
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // Clear alerts when switching tabs
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-slate-200', width: 'w-0' };
    if (pass.length < 6) return { label: 'Too short (min 6)', color: 'bg-rose-500', width: 'w-1/3' };
    const hasNum = /\d/.test(pass);
    const hasSpecialOrUpper = /[A-Z!@#$%^&*]/.test(pass);
    if (pass.length >= 8 && hasNum && hasSpecialOrUpper) {
      return { label: 'Strong password', color: 'bg-emerald-600', width: 'w-full' };
    }
    return { label: 'Good password', color: 'bg-amber-500', width: 'w-2/3' };
  };

  // 1-Click Demo Login
  const handleQuickDemo = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/auth/demo', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Demo login failed.');
      onLoginSuccess({ ...result.user, sessionToken: result.sessionToken });
    } catch (error) {
      setErrorMessage(error.message || 'Could not start demo login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fill credentials for easy test
  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = loginPhone.replace(/\D/g, '');

    // Validation
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: loginPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed.');
      onLoginSuccess({
        ...result.user,
        sessionToken: result.sessionToken,
        weather: { temp: '26°C', condition: 'Clear Sky', humidity: '65%', wind: '10 km/h' },
      });
    } catch (error) {
      setErrorMessage(error.message || 'Could not log in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = regPhone.replace(/\D/g, '');

    // Validation checks
    if (!regFullName.trim() || regFullName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!regDistrict) {
      setErrorMessage('Please select your APMC Mandi District.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (!regAgreeTerms) {
      setErrorMessage('Please agree to receive APMC Mandi alerts & AI grading reports.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regFullName.trim(),
          phone: cleanPhone,
          district: regDistrict,
          password: regPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed.');
      const newProfile = {
        ...result.user,
        sessionToken: result.sessionToken,
        weather: { temp: '26°C', condition: 'Clear Sky', humidity: '64%', wind: '10 km/h' },
      };
      setSuccessMessage(`Welcome, ${newProfile.name}! Your account has been registered successfully.`);
      setTimeout(() => onLoginSuccess(newProfile), 700);
    } catch (error) {
      setErrorMessage(error.message || 'Could not register right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(regPassword);
  const passwordsMatch = regConfirmPassword.length > 0 && regPassword === regConfirmPassword;
  const passwordsMismatch = regConfirmPassword.length > 0 && regPassword !== regConfirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F7F2] via-[#F8FAF7] to-[#EEF5EE] flex flex-col justify-center py-10 px-4 sm:px-6 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelect
          language={language}
          onChange={onLanguageChange}
          status={translationStatus}
          errorMessage={translationError}
          onRetry={onRetryTranslation}
        />
      </div>
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-all cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AgriSense Home</span>
          </button>

          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-lg shadow-emerald-700/25 ring-4 ring-emerald-50">
              <Leaf className="w-8 h-8 fill-current text-emerald-100" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk'] tracking-tight">
            AgriSense <span className="text-emerald-700">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Smart Produce Grading & Real-Time APMC Mandi Intelligence
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>APMC Verified</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>AI Grade A/B/C</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Free for Farmers</span>
            </span>
          </div>
        </div>

        {/* 1-Click Instant Demo Login Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-green-600/10 border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-900 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Instant Demo Farmer Access</span>
          </div>
          <p className="text-[11px] text-emerald-800/90 mb-3">
            Quickly test the complete app as <strong>Prachi Chougale</strong> (Kolhapur APMC Mandi)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>One-Click Demo Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-emerald-100 space-y-6">
          {/* Segmented Tab Navigation */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-white text-emerald-950 shadow-md shadow-slate-300/40 border border-emerald-100/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-700" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-white text-emerald-950 shadow-md shadow-slate-300/40 border border-emerald-100/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wheat className="w-4 h-4 text-emerald-700" />
              <span>Register Farmer</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* LOGIN FORM: Asks Phone Number & Password */}
          {/* ======================================================== */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Phone Number Field */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 pr-2 border-r border-slate-200 pointer-events-none">
                    <span className="text-xs">🇮🇳</span>
                    <span className="text-xs font-bold text-slate-600">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    maxLength={14}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-20 pr-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  We will use your registered mobile number to retrieve your scans and mandi bids.
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span>Remember this mobile number</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-800/25 transition cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to AgriSense</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Register */}
              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  New farmer or trader?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="font-extrabold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
                  >
                    Register Farmer Account
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ======================================================== */
            /* REGISTER FORM: Full Name, Create New Password,           */
            /* Conform Password, Phone Number, District                 */
            /* ======================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Patil / Prachi Chougale"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>
              </div>

              {/* 2. Phone Number */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 pr-2 border-r border-slate-200 pointer-events-none">
                    <span className="text-xs">🇮🇳</span>
                    <span className="text-xs font-bold text-slate-600">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    maxLength={14}
                    placeholder="10-digit mobile number"
                    className="w-full pl-20 pr-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                </div>
              </div>

              {/* 3. Create New Password */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Create New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength bar */}
                {regPassword.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      Strength: {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Confirm Password */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <ShieldCheck
                    className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
                      passwordsMatch
                        ? 'text-emerald-600'
                        : passwordsMismatch
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className={`w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border bg-slate-50/50 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 ${
                      passwordsMatch
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : passwordsMismatch
                        ? 'border-rose-400 ring-2 ring-rose-500/20'
                        : 'border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                    title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Match indicator */}
                {passwordsMatch && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passwords match!</span>
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Passwords do not match yet.</span>
                  </p>
                )}
              </div>

              {/* 5. District */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  District <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 pointer-events-none" />
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    required
                    className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer text-slate-900 appearance-none"
                  >
                    {DISTRICT_LIST.map((dist) => (
                      <option key={dist.name} value={dist.name}>
                        {dist.name} ({dist.state}) — {dist.apmc}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 pointer-events-none text-slate-400 text-xs font-bold">
                    ▼
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Connects you to nearest APMC mandi benchmark rates & buyer bids.
                </p>
              </div>

              {/* Terms and Mandi Alerts agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={regAgreeTerms}
                    onChange={(e) => setRegAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5 shrink-0"
                  />
                  <span>
                    I agree to receive daily APMC mandi benchmark rates & AI grading reports on this
                    mobile number.
                  </span>
                </label>
              </div>

              {/* Register Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-800/25 transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create Farmer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600 font-medium">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="font-extrabold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>
            AgriSense AI · Precision Agricultural Quality Inspection
          </p>
          <p className="text-[11px] text-slate-400">
            Kolhapur · Nashik · Pune · Shimla · Solapur · Sangli APMC
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Reset Farmer Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>Password reset is not available yet. Use the one-click demo access to explore the app.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleQuickDemo();
                  setShowForgotModal(false);
                }}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                One-Click Demo Login
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
