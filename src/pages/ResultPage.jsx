import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Eye,
  AlertTriangle,
  Flame,
  Palette,
  Compass,
  ArrowRight,
  Share2,
  Clock,
  Printer,
  MapPin,
  Cpu,
} from 'lucide-react';

export const ResultPage = ({
  result,
  onNavigate,
  onGoToMarket,
}) => {
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadMarketData = async () => {
      setMarketLoading(true);
      setMarketError('');
      setMarketData(null);
      try {
        const query = new URLSearchParams({
          commodity: result?.commodity || '',
          district: result?.district || ''
        });
        const response = await fetch(`/api/market-prices?${query}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not load mandi prices.');
        }
        setMarketData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMarketError(error.message || 'Could not load mandi prices.');
        }
      } finally {
        if (!controller.signal.aborted) setMarketLoading(false);
      }
    };

    loadMarketData();
    return () => controller.abort();
  }, [result?.commodity, result?.district]);

  const marketPrices =
    marketData?.commodity === result?.commodity &&
    marketData?.district === result?.district
      ? marketData.summary
      : null;
  const marketReportDate = marketData?.dataDate
    ? new Date(`${marketData.dataDate}T00:00:00Z`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : null;
  const formatMarketPrice = (price) =>
    price == null ? '—' : Number(price).toFixed(2);

  const isGradeA = result?.grade === 'A';
  const isGradeB = result?.grade === 'B';

  const ringColor = isGradeA ? '#16A34A' : isGradeB ? '#CA8A04' : '#DC2626';
  const scoreTextColor = isGradeA ? 'text-emerald-700' : isGradeB ? 'text-amber-700' : 'text-rose-700';
  const badgeBg = isGradeA
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
    : isGradeB
    ? 'bg-amber-50 text-amber-800 border-amber-300'
    : 'bg-rose-50 text-rose-800 border-rose-300';

  return (
    <div className="w-full space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>APMC Standard Produce Quality Certificate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5 font-['Space_Grotesk']">
            {result?.commodity} — Grading Report
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Scan ID: {result?.id || 'scan-today'} · Tested at {result?.district} Mandi Yard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
            <span>New Scan</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Body Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Produce Image, Grade Ring, Shelf Life      */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Produce Image Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-md border-2 border-slate-200 aspect-16/11 bg-slate-900 group">
            <img
              src={result?.image}
              alt={result?.commodity}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Quality Tag Overlays */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{result?.variety}</span>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                  Assigned Lot Grade
                </span>
                <div className="text-xl sm:text-2xl font-black">{result?.gradeLabel}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-300 font-medium">Confidence Score</span>
                <div className="text-xs font-extrabold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                  {result?.confidence}%
                </div>
              </div>
            </div>
          </div>

          {/* Main Quality Score & Grade Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs space-y-4">
            <div className="flex items-center">
              <div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                  Overall Quality Score
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-4xl font-black font-['Space_Grotesk'] ${scoreTextColor}`}>
                    {result?.qualityScore}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Based on color uniformity, skin texture & defect absence.
                </p>
              </div>

              {/* Circular Grade Badge */}
              <div
                className="relative w-22 h-22 rounded-full flex flex-col items-center justify-center border-4 shadow-sm bg-slate-50/50"
                style={{ borderColor: ringColor }}
              >
                <span className="text-3xl font-black leading-none" style={{ color: ringColor }}>
                  {result?.grade}
                </span>
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mt-0.5">
                  Grade
                </span>
              </div>
            </div>

            {/* Shelf Life Box */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100/80">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Estimated Shelf Life
                  </span>
                  <span className="text-base font-black text-emerald-950 font-['Space_Grotesk']">
                    {result?.shelfLife}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                Ambient Mandi
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: APMC Valuation, Metrics, Details & Action */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* APMC Market Price Card */}
          <div className="bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 rounded-3xl p-6 text-white shadow-lg shadow-emerald-950/20 border border-emerald-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                    Reported Mandi Prices
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {result?.district} APMC Mandi Benchmark
                  </h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 text-center">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                  Minimum Reported
                </span>
                <span className="text-xl font-black font-['Space_Grotesk']">
                  ₹{formatMarketPrice(marketPrices?.min)}/kg
                </span>
              </div>

              <div className="bg-white text-emerald-950 p-3 rounded-2xl shadow-md border-2 border-emerald-300">
                <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider block">
                  Modal Price
                </span>
                <span className="text-2xl font-black font-['Space_Grotesk'] text-emerald-800">
                  ₹{formatMarketPrice(marketPrices?.modal)}/kg
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                  Maximum Reported
                </span>
                <span className="text-xl font-black font-['Space_Grotesk']">
                  ₹{formatMarketPrice(marketPrices?.max)}/kg
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 font-medium" role="status" aria-live="polite">
              {marketLoading && 'Loading the latest reported mandi prices…'}
              {!marketLoading && marketError && marketError}
              {!marketLoading && !marketError && marketReportDate && (
                <>
                  {result?.commodity} prices reported for {result?.district} on {marketReportDate}.
                  {' '}Source: {marketData.source}. These are not live bids or grade-specific prices.
                </>
              )}
              {!marketLoading && !marketError && marketData && !marketReportDate && marketData.message}
            </p>
          </div>

          {/* Detailed Produce Quality Metrics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Diagnostic Quality Metrics
            </h3>

            <div className="space-y-3.5">
              {/* Freshness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Freshness & Skin Turgidity</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{result?.metrics?.freshness}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result?.metrics?.freshness || 0}%` }}
                  />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Palette className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pigmentation / Lycopene Hue</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{result?.metrics?.color}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result?.metrics?.color || 0}%` }}
                  />
                </div>
              </div>

              {/* Visible Defects */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Defect Surface Ratio</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">
                    {result?.metrics?.visibleDefects}% (Low)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result?.metrics?.visibleDefects || 0}%` }}
                  />
                </div>
              </div>

              {/* Bruising */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Bruising / Compression</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{result?.metrics?.bruising}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result?.metrics?.bruising || 0}%` }}
                  />
                </div>
              </div>

              {/* Shape Consistency */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Symmetry & Shape Consistency</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">
                    {result?.metrics?.shapeConsistency}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${result?.metrics?.shapeConsistency || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Inspection Assessment */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Official APMC Grading Description</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {result?.description}
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Pipeline: {result?.pipelineDetails?.framework || 'Deep Learning CNN Vision'}</span>
              <span>District: {result?.district}</span>
            </div>
          </div>

          {/* Action Button: Go to Market Prices */}
          <button
            onClick={() => onGoToMarket(result?.commodity, result?.district, result?.grade)}
            className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-xl shadow-emerald-800/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <TrendingUp className="w-4 h-4" />
            <span>View Mandi Prices for this Produce</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
