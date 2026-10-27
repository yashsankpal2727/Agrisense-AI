import React, { useState } from 'react';
import { LanguageSelect } from '../components/LanguageSelect.jsx';
import {
  User,
  MapPin,
  Phone,
  Crop,
  Layers,
  Globe,
  Bell,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Save,
  HelpCircle,
} from 'lucide-react';

export const ProfilePage = ({
  user,
  onUpdateUser,
  onNavigate,
  onLogout,
  language,
  onLanguageChange,
  translationStatus,
  translationError,
  onRetryTranslation,
}) => {
  const [district, setDistrict] = useState(user?.district || 'Kolhapur');
  const [dailySms, setDailySms] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      district,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Account Profile & Mandi Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5 font-['Space_Grotesk']">
            Farmer Profile
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage your account, default APMC district, and alert preferences
          </p>
        </div>

        {saveToast && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Profile preferences saved successfully!</span>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Farmer Info Card & Sign Out                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-50">
                {user?.name ? user.name.charAt(0) : 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Verified</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 truncate">
                  {user?.name || 'Prachi Chougale'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {user?.district || 'Kolhapur'}, {user?.state || 'Maharashtra'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-semibold">Registered Phone</span>
                <span className="font-extrabold text-slate-900">{user?.phone || '+91 98220 54321'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-semibold">Primary Produce</span>
                <span className="font-extrabold text-slate-900">
                  {user?.primaryCrops ? user.primaryCrops.join(', ') : 'Tomato, Apple'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch Account / Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Settings Form & Helpline                   */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* Settings Form */}
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5"
          >
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Mandi Benchmark & App Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Default District */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Default APMC Mandi District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none cursor-pointer"
                >
                  <option value="Kolhapur">Kolhapur (Maharashtra)</option>
                  <option value="Nashik">Nashik (Maharashtra)</option>
                  <option value="Pune">Pune (Maharashtra)</option>
                  <option value="Shimla">Shimla (Himachal Pradesh)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Primary benchmark market for your fresh harvest valuations
                </p>
              </div>

              {/* Interface Language */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Display Language
                </label>
                <LanguageSelect
                  language={language}
                  onChange={onLanguageChange}
                  status={translationStatus}
                  errorMessage={translationError}
                  onRetry={onRetryTranslation}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Language for reports and mandi updates
                </p>
              </div>

              {/* Daily SMS alert checkbox */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <input
                    type="checkbox"
                    checked={dailySms}
                    onChange={(e) => setDailySms(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span>Daily APMC Mandi Rate SMS Alerts</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-800/20 transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>

          {/* Mandi Support & Advisory Helpline */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 uppercase">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Farmer Support Desk</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Need help with produce grading or mandi transportation? Call our AgriSense Mandi Helpline.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-900 font-extrabold text-xs rounded-xl border border-emerald-200">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>1800-425-AGRI (Toll Free)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
