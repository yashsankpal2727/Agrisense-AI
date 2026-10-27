import React from 'react';
import {
  MapPin,
  Sun,
  Camera,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertCircle,
  Scan,
  Award,
  BarChart3,
  Leaf,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage = ({
  user,
  recentAnalyses = [],
  onNavigate,
  onSelectAnalysis,
}) => {
  // Compute stats
  const totalScans = 24;
  const bestPrice = user?.primaryCrops?.includes('Apple') ? '₹140/kg' : '₹34/kg';
  const primaryDistrict = user?.district || 'Kolhapur';

  return (
    <div className="w-full space-y-6">
      {/* Top Greeting & Weather Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-100/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Welcome Back</span>
            <span className="text-base">👋</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              APMC Verified Farmer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 font-['Space_Grotesk']">
            {user?.name || 'Prachi Chougale'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {primaryDistrict}, {user?.state || 'Maharashtra'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Weather widget */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl p-3 px-4 border border-emerald-100/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
              <Sun className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-slate-900 font-['Space_Grotesk']">
                  {user?.weather?.temp || '26°C'}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {user?.weather?.condition || 'Partly Cloudy'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Humidity {user?.weather?.humidity || '68%'} · Wind {user?.weather?.wind || '12 km/h'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('upload')}
            className="hidden md:inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-md shadow-emerald-800/20 transition cursor-pointer"
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
              Total Analyses
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-['Space_Grotesk'] mt-2">
            {totalScans}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            +4 scanned this week
          </p>
        </div>

        {/* Card 2: Average Quality Grade */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Average Grade
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-['Space_Grotesk']">
              Grade A
            </span>
            <span className="text-xs font-extrabold text-emerald-600">89% Avg</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            92% Premium Quality Lot
          </p>
        </div>

        {/* Card 3: Best Market Realization */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Top Mandi Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-['Space_Grotesk'] mt-2">
            {bestPrice}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">
            +8% higher than standard
          </p>
        </div>

        {/* Card 4: Active APMC Mandi */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Active APMC Mandi
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-2 truncate font-['Space_Grotesk']">
            {primaryDistrict} APMC
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            3 Yards reporting live
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
                Instant Produce Quality Grading & Mandi Price Valuation
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
                Take or upload a photo of fresh Tomato crate lots or Apple harvests to instantly detect
                Grade A, B, or C, estimated shelf life, and best mandi bids.
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
                  <span>View Mandi Prices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Analyses Section */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Recent Quality Evaluations
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified scans with assigned quality grade and realized APMC rates
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
              {recentAnalyses.map((item) => {
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

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Modal Price</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-800 font-['Space_Grotesk']">
                          ₹{item.prices?.modal}/kg
                        </span>
                      </div>
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
                    Live APMC Benchmark
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {primaryDistrict} Mandi Yard
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100/90">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-emerald-950">Tomato (Grade A)</span>
                <span className="text-base font-black text-emerald-800 font-['Space_Grotesk']">
                  ₹32 - ₹36/kg
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                ▲ +8% upward bid trend due to festival demand
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-800">Apple (Royal Delicious)</span>
                <span className="text-base font-black text-slate-900 font-['Space_Grotesk']">
                  ₹130 - ₹165/kg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Firm arrivals reported at central wholesale yard
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
                  <span className="font-extrabold text-slate-900">68%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Grade B (Standard)</span>
                  </span>
                  <span className="font-extrabold text-slate-900">24%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Grade C (Sorting)</span>
                  </span>
                  <span className="font-extrabold text-slate-900">8%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '8%' }} />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
              Grade A produce fetched an average <strong>₹6.40/kg bonus</strong> over mixed crates.
            </p>
          </div>

          {/* Mandi Advisory Tip */}
          <div className="bg-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" />
              <span>Harvest Tip</span>
            </div>
            <h5 className="text-sm font-bold">Sort Before Dispatching</h5>
            <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
              Eliminate Grade C fruits with blemishes before crate packaging. Mandi commission agents
              deduct up to 25% when lots contain mixed grades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
