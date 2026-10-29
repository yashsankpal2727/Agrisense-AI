import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Camera,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  Scan,
  Award,
  Leaf,
} from 'lucide-react';

export const DashboardPage = ({
  user,
  recentAnalyses = [],
  historyError = '',
  onNavigate,
  onSelectAnalysis,
}) => {
  const [marketData, setMarketData] = useState(null);
  const [marketError, setMarketError] = useState('');
  const primaryCommodity = user?.primaryCrops?.[0] || '';
  const primaryDistrict = user?.district || '';
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const thisWeekCount = recentAnalyses.filter(
    (item) => new Date(item.timestamp).getTime() >= weekStart
  ).length;
  const recentMonthAnalyses = recentAnalyses.filter(
    (item) => new Date(item.timestamp).getTime() >= monthStart
  );
  const scores = recentAnalyses
    .map((item) => Number(item.qualityScore))
    .filter(Number.isFinite);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
  const gradeCounts = ['A', 'B', 'C'].reduce((counts, grade) => {
    counts[grade] = recentMonthAnalyses.filter((item) => item.grade === grade).length;
    return counts;
  }, {});
  const gradeTotal = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);
  const activeMarkets = new Set(recentAnalyses.map((item) => item.market).filter(Boolean)).size;
  const recentList = recentAnalyses.slice(0, 5);
  const currentMarketData =
    marketData?.commodity === primaryCommodity &&
    marketData?.district === primaryDistrict
      ? marketData
      : null;

  useEffect(() => {
    if (!primaryCommodity || !primaryDistrict) {
      setMarketData(null);
      setMarketError('');
      return undefined;
    }

    const controller = new AbortController();
    const loadMarketData = async () => {
      setMarketError('');
      try {
        const query = new URLSearchParams({
          commodity: primaryCommodity,
          district: primaryDistrict,
        });
        const response = await fetch(`/api/market-prices?${query}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not load mandi prices.');
        }
        setMarketData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMarketError(error.message || 'Could not load mandi prices.');
          setMarketData(null);
        }
      }
    };

    loadMarketData();
    return () => controller.abort();
  }, [primaryCommodity, primaryDistrict]);

  return (
    <div className="w-full space-y-6">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Welcome Back</span>
            <span className="text-base">👋</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 font-['Space_Grotesk']">
            {user?.name || 'Farmer'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{[primaryDistrict, user?.state].filter(Boolean).join(', ') || 'Location not set'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-md shadow-emerald-800/20 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* 4 Responsive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Analyses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Saved Analyses
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-['Space_Grotesk'] mt-2">
            {recentAnalyses.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {thisWeekCount} in the last 7 days
          </p>
        </div>

        {/* Card 2: Average Quality Grade */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Most Common Grade
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-['Space_Grotesk']">
              {gradeTotal
                ? `Grade ${Object.keys(gradeCounts).sort((a, b) => gradeCounts[b] - gradeCounts[a])[0]}`
                : '—'}
            </span>
            <span className="text-xs font-extrabold text-emerald-600">
              {averageScore === null ? '—' : `${averageScore}/100`}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {gradeTotal ? `${gradeTotal} analyses in the last 30 days` : 'Complete a scan to see your grade'}
          </p>
        </div>

        {/* Card 3: Best Market Realization */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Current Mandi Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-['Space_Grotesk'] mt-2">
            {currentMarketData?.summary?.modal == null
              ? '—'
              : `₹${Number(currentMarketData.summary.modal).toFixed(2)}/kg`}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">
            {marketError || currentMarketData?.dataDate || 'No reported rate available'}
          </p>
        </div>

        {/* Card 4: Active APMC Mandi */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Your APMC District
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate font-['Space_Grotesk']">
            {primaryDistrict ? `${primaryDistrict} APMC` : '—'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {activeMarkets} markets in your analyses
          </p>
        </div>
      </div>

      {/* Main 2-Column Responsive Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Hero Scan CTA & Recent Analyses List        */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Produce Grading Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 text-white p-6 sm:p-7 shadow-lg shadow-emerald-950/20 border border-emerald-700/60">
            {/* Ambient decorative elements */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-6 top-6 opacity-15 pointer-events-none">
              <Sparkles className="w-32 h-32 text-emerald-200" />
            </div>

            <div className="relative z-10 max-w-lg space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/70 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                <Leaf className="w-3.5 h-3.5" />
                <span>AI Produce Inspection Engine</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Produce Quality Grading & Mandi Price Reports
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
                Take or upload a photo of your produce to detect its grade, estimate shelf life, and
                compare reported mandi prices.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-5 py-3 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs sm:text-sm font-extrabold shadow-md shadow-black/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>Start New Quality Scan</span>
                </button>
                <button
                  onClick={() => onNavigate('market')}
                  className="px-4 py-3 rounded-xl bg-emerald-700/60 hover:bg-emerald-700/80 border border-emerald-500/40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span>View Reported Mandi Prices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Analyses Section */}
          <div className="space-y-3.5">
            {historyError && (
              <p role="alert" className="text-sm font-semibold text-rose-700">
                {historyError}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Recent Quality Evaluations
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Your latest produce analyses
                </p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
              >
                <span>View All History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {recentList.length === 0 && (
                <div className="sm:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 text-center">
                  <p className="text-sm font-bold text-slate-700">No analyses yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your scans will appear here after you analyze produce.
                  </p>
                </div>
              )}
              {recentList.map((item) => {
                const isGradeA = item.grade === 'A';
                const isGradeB = item.grade === 'B';
                const badgeColor = isGradeA
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isGradeB
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300';

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAnalysis(item)}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 relative">
                          <img
                            src={item.image}
                            alt={item.commodity}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                              {item.commodity}
                            </h4>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColor}`}
                            >
                              Grade {item.grade}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                            {item.variety}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.dateFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quality Score Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Quality Score:
                        </span>
                        <span className="font-extrabold text-slate-900 font-['Space_Grotesk']">
                          {item.qualityScore} / 100
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      Market: {item.market || item.district || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Mandi Benchmark, Quality Stats, Advisory   */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* APMC Live Price Alert Ticker */}
          <div
            onClick={() => onNavigate('market')}
            className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-xs hover:border-emerald-400 transition cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    Latest APMC Reports
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {primaryDistrict || 'Your district'} Mandi Yard
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100/90">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  {primaryCommodity || 'Primary produce'}
                </span>
                <span className="text-base font-black text-emerald-800 font-['Space_Grotesk']">
                  {currentMarketData?.summary
                    ? `₹${Number(currentMarketData.summary.min).toFixed(2)} – ₹${Number(currentMarketData.summary.max).toFixed(2)}/kg`
                    : '—'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {marketError ||
                  (currentMarketData?.dataDate
                    ? `Reported ${currentMarketData.dataDate} · ${currentMarketData.source}`
                    : currentMarketData?.message || 'No reported price data available.')}
              </p>
            </div>
          </div>

          {/* Quality Distribution Summary Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Produce Grade Breakdown
              </h4>
              <span className="text-[10px] font-bold text-slate-500">Last 30 Days</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Grade A (Premium)</span>
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {gradeTotal ? `${Math.round((gradeCounts.A / gradeTotal) * 100)}%` : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${gradeTotal ? (gradeCounts.A / gradeTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Grade B (Standard)</span>
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {gradeTotal ? `${Math.round((gradeCounts.B / gradeTotal) * 100)}%` : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${gradeTotal ? (gradeCounts.B / gradeTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Grade C (Sorting)</span>
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {gradeTotal ? `${Math.round((gradeCounts.C / gradeTotal) * 100)}%` : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full"
                    style={{ width: `${gradeTotal ? (gradeCounts.C / gradeTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {!gradeTotal && (
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Grade statistics will appear here after your first analysis.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
