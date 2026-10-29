import React, { useState } from 'react';
import { History, Search, ChevronRight, ArrowRight, Camera, Trash2, Loader2 } from 'lucide-react';

export const HistoryPage = ({
  history = [],
  historyError = '',
  onSelectAnalysis,
  onNavigate,
  onClearHistory,
}) => {
  const [filterCommodity, setFilterCommodity] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState('');

  const handleClearHistory = async () => {
    if (
      history.length === 0 ||
      !window.confirm('Clear all of your analysis history? This cannot be undone.')
    ) {
      return;
    }

    setIsClearing(true);
    setClearError('');

    try {
      await onClearHistory();
    } catch (error) {
      setClearError(error.message || 'Could not clear analysis history.');
    } finally {
      setIsClearing(false);
    }
  };

  const filtered = history.filter((item) => {
    const matchesCommodity =
      filterCommodity === 'all' || item?.commodity?.toLowerCase() === filterCommodity.toLowerCase();
    const matchesGrade =
      filterGrade === 'all' || item?.grade?.toUpperCase() === filterGrade.toUpperCase();
    const matchesSearch =
      item?.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.variety?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCommodity && matchesGrade && matchesSearch;
  });
  const commodities = [...new Set(
    history.map((item) => item?.commodity).filter(Boolean)
  )];

  return (
    <div className="w-full space-y-6">
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Inspection History & Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5 font-['Space_Grotesk']">
            Harvest Produce Archive
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Searchable history of your produce analyses and grading results
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={history.length === 0 || isClearing}
            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed text-rose-700 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isClearing ? 'Clearing...' : 'Clear History'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-800/20 transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>New Produce Scan</span>
          </button>
        </div>
      </div>

      {clearError && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {clearError}
        </p>
      )}
      {historyError && (
        <p role="alert" className="text-sm font-semibold text-rose-700">
          {historyError}
        </p>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop, variety, or APMC mandi..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
            />
          </div>

          {/* Commodity Pill filter */}
          <div className="flex gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {['all', ...commodities].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCommodity(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterCommodity === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {cat === 'all' ? 'All Crops' : cat}
              </button>
            ))}
          </div>

          {/* Grade filter */}
          <div className="flex gap-1 self-start sm:self-auto shrink-0">
            {['all', 'A', 'B', 'C'].map((g) => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={`px-2.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  filterGrade === g
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'All' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <p className="text-sm font-bold text-slate-700">No matching produce scans found</p>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or crop filter to see past quality records.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-800/20 cursor-pointer"
          >
            <span>Scan New Batch Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isGradeA = item.grade === 'A';
            const isGradeB = item.grade === 'B';
            const badgeBg = isGradeA
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : isGradeB
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-rose-50 text-rose-800 border-rose-300';

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnalysis(item)}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900 relative">
                      <img
                        src={item.image}
                        alt={item.commodity}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                          {item.commodity}
                        </h4>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeBg}`}
                        >
                          Grade {item.grade}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                        {item.variety} · {item.district} APMC
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
                        <span>{item.dateFormatted}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          Score: {item.qualityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Market: {item.market || item.district || '—'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
                    <span>View Inspection Report</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
