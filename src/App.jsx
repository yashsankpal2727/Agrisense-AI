/**
 * AgriSense AI - Smart Produce Grading & Market Intelligence
 * Complete 7-page implementation with deep learning AI/ML pipeline
 * Built with React.js (.jsx)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, Upload, RotateCcw } from 'lucide-react';

import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { UploadPage } from './pages/UploadPage.jsx';
import { AnalyzingPage } from './pages/AnalyzingPage.jsx';
import { ResultPage } from './pages/ResultPage.jsx';
import { MarketPricePage } from './pages/MarketPricePage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('landing');

  const [authTab, setAuthTab] = useState('login');

  const [user, setUser] = useState(null);

  const [district, setDistrict] = useState('');

  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');

  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const historyToken = user?.sessionToken;

  // Payload during analysis phase
  const [analyzingPayload, setAnalyzingPayload] = useState(null);

  // Unsupported image result
  const [rejectedAnalysis, setRejectedAnalysis] = useState(null);

  // Market filter state
  const [marketFilters, setMarketFilters] = useState({
    commodity: '',
    district: '',
    grade: 'A',
    fromAnalysis: false,
  });

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------

  const handleNavigate = (page, tab = 'login') => {
    if (page === 'auth') {
      setAuthTab(tab || 'login');
    }

    setActivePage(page);
  };

  // ---------------------------------------------------------
  // FETCH HISTORY
  // ---------------------------------------------------------

  useEffect(() => {
    setHistory([]);
    setCurrentAnalysis(null);
    setHistoryError('');
    if (!historyToken) return undefined;

    let cancelled = false;
    fetch('/api/history', {
      headers: { Authorization: `Bearer ${historyToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load analysis history.');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const analyses = data.status === 'success' ? data.analyses || [] : [];
        setHistory(analyses);
        setCurrentAnalysis(analyses[0] || null);
        setHistoryError('');
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Could not load account history:', err);
          setHistoryError(err.message || 'Could not load your analysis history.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [historyToken]);

  const handleClearHistory = async () => {
    const response = await fetch('/api/history', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${historyToken}` },
    });
    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      throw new Error(data.error || 'Could not clear analysis history.');
    }

    setHistory([]);
    setCurrentAnalysis(null);
    setHistoryError('');
  };

  const handleLoginSuccess = (profile) => {
    setUser(profile);
    setDistrict(profile.district || '');
    setMarketFilters((previous) => ({
      ...previous,
      commodity: profile.primaryCrops?.[0] || '',
      district: profile.district || '',
      fromAnalysis: false,
    }));
    setActivePage('dashboard');
  };

  const handleUpdateUser = async (updated) => {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.sessionToken}`,
      },
      body: JSON.stringify({
        district: updated.district,
        dailySmsAlerts: updated.dailySmsAlerts,
      }),
    });
    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
      throw new Error(data.error || 'Could not save your account preferences.');
    }

    setUser(data.user);
    setDistrict(data.user.district);
    setMarketFilters((previous) => ({
      ...previous,
      district: data.user.district,
    }));
    return data.user;
  };

  // ---------------------------------------------------------
  // START ANALYSIS
  // ---------------------------------------------------------

  const handleStartAnalysis = (payload) => {
    console.log('====================================');
    console.log('STARTING ANALYSIS FROM APP');
    console.log('Commodity:', payload?.commodity);
    console.log('District:', payload?.district);
    console.log('Market:', payload?.market);
    console.log('Image type:', typeof payload?.image);
    console.log('Image length:', payload?.image?.length);
    console.log('====================================');

    // Clear previous rejected result
    setRejectedAnalysis(null);

    // Store analysis payload
    setAnalyzingPayload(payload);

    // Open analyzing page
    setActivePage('analyzing');
  };

  // ---------------------------------------------------------
  // ANALYSIS COMPLETE
  // ---------------------------------------------------------

  const handleAnalysisComplete = (result) => {
    console.log('====================================');
    console.log('ANALYSIS RESULT RECEIVED');
    console.log(result);
    console.log('====================================');

    // -------------------------------------------------------
    // UNSUPPORTED IMAGE
    // -------------------------------------------------------

    if (
      result?.isRejected === true ||
      result?.status === 'rejected' ||
      result?.commodity === 'Other'
    ) {
      console.log('UNSUPPORTED IMAGE DETECTED');

      const rejection = {
        ...result,

        rejectionMessage:
          result?.rejectionMessage ||
          result?.message ||
          result?.error ||
          'The uploaded image does not appear to contain a supported fruit. Please upload an Apple, Tomato, or Dragon Fruit image.',
      };

      setRejectedAnalysis(rejection);

      // Do NOT add rejected images to history
      setCurrentAnalysis(null);

      // Show unsupported image page
      setActivePage('rejected');

      return;
    }

    // -------------------------------------------------------
    // NORMAL APPLE / TOMATO RESULT
    // -------------------------------------------------------

    setRejectedAnalysis(null);
    setCurrentAnalysis(result);

    setHistory((prev) => [
      result,
      ...prev.filter((item) => item.id !== result.id),
    ]);
    setHistoryError('');

    setActivePage('result');
  };

  // ---------------------------------------------------------
  // ANALYSIS ERROR
  // ---------------------------------------------------------

  const handleAnalysisError = (err) => {
    console.error('====================================');
    console.error('ANALYSIS ERROR');
    console.error(err);
    console.error('====================================');

    setAnalyzingPayload(null);

    setActivePage('upload');
  };

  // ---------------------------------------------------------
  // MARKET
  // ---------------------------------------------------------

  const handleGoToMarket = (
    commodity,
    districtParam,
    grade
  ) => {
    const detectedCommodity = String(commodity || '').trim();
    const normalizedCommodity = ['Apple', 'Tomato', 'Dragon Fruit'].find(
      (supportedCommodity) => supportedCommodity.toLowerCase() === detectedCommodity.toLowerCase()
    ) || detectedCommodity || 'Tomato';

    setMarketFilters({
      commodity: normalizedCommodity,
      district: districtParam || district,
      grade: grade || 'A',
      fromAnalysis: true,
    });

    setActivePage('market');
  };

  // ---------------------------------------------------------
  // HISTORY
  // ---------------------------------------------------------

  const handleSelectAnalysis = (item) => {
    setCurrentAnalysis(item);

    setRejectedAnalysis(null);

    setActivePage('result');
  };

  // ---------------------------------------------------------
  // RETRY ANALYSIS
  // ---------------------------------------------------------

  const handleRetryAnalysis = () => {
    setRejectedAnalysis(null);

    setAnalyzingPayload(null);

    setCurrentAnalysis(null);

    setActivePage('upload');
  };

  // ---------------------------------------------------------
  // LANDING
  // ---------------------------------------------------------

  if (activePage === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8FAF7]">
        <LandingPage
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  // ---------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------

  if (activePage === 'auth') {
    return (
      <div className="min-h-screen bg-[#F8FAF7]">
        <AuthPage
          initialTab={authTab}

          onLoginSuccess={handleLoginSuccess}

          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN APP
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F1F5F0] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Top Navbar */}

      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        userName={user?.name || ''}
      />

      {/* Main Viewport */}

      <main className="flex-1 py-4 sm:py-6 px-4 sm:px-6 max-w-6xl w-full mx-auto">

        <div className="w-full bg-[#F8FAF7] rounded-3xl shadow-sm border border-emerald-100/90 p-4 sm:p-6 lg:p-8">

          {/* ================================================= */}
          {/* DASHBOARD */}
          {/* ================================================= */}

          {activePage === 'dashboard' && (
            <DashboardPage
              user={user}
              recentAnalyses={history}
              historyError={historyError}
              onNavigate={handleNavigate}
              onSelectAnalysis={handleSelectAnalysis}
            />
          )}

          {/* ================================================= */}
          {/* UPLOAD */}
          {/* ================================================= */}

          {activePage === 'upload' && (
            <UploadPage
              district={district}

              onDistrictChange={setDistrict}

              onStartAnalysis={handleStartAnalysis}
            />
          )}

          {/* ================================================= */}
          {/* ANALYZING */}
          {/* ================================================= */}

          {activePage === 'analyzing' &&
            analyzingPayload && (
              <AnalyzingPage
                image={analyzingPayload.image}
                commodity={analyzingPayload.commodity}
                district={analyzingPayload.district}
                market={analyzingPayload.market}
                sessionToken={user.sessionToken}

                onAnalysisComplete={
                  handleAnalysisComplete
                }

                onError={handleAnalysisError}
              />
            )}

          {/* ================================================= */}
          {/* UNSUPPORTED IMAGE */}
          {/* ================================================= */}

          {activePage === 'rejected' && (
            <div className="min-h-[500px] flex items-center justify-center">

              <div className="w-full max-w-xl text-center">

                {/* Icon */}

                <div className="mx-auto w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center shadow-sm">

                  <AlertTriangle
                    className="w-12 h-12 text-amber-500"
                  />

                </div>

                {/* Title */}

                <h1 className="mt-6 text-2xl sm:text-3xl font-black text-slate-900">

                  Unsupported Image

                </h1>

                {/* Description */}

                <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed max-w-md mx-auto">

                  {rejectedAnalysis?.rejectionMessage ||
                    'The uploaded image does not appear to contain a supported fruit.'}

                </p>

                {/* Technical information */}

                {rejectedAnalysis?.fruit_detection && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">

                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      AI Detection
                    </p>

                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-600">
                        Detected object
                      </span>

                      <span className="text-sm font-bold text-slate-900 capitalize">
                        {rejectedAnalysis.fruit_detection.fruit}
                      </span>

                    </div>

                    <div className="flex items-center justify-between mt-2">

                      <span className="text-sm text-slate-600">
                        Confidence
                      </span>

                      <span className="text-sm font-bold text-amber-600">
                        {rejectedAnalysis.fruit_detection.confidence}%
                      </span>

                    </div>

                  </div>
                )}

                {/* Buttons */}

                <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">

                  <button
                    onClick={handleRetryAnalysis}
                    className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20 cursor-pointer"
                  >

                    <RotateCcw className="w-4 h-4" />

                    Try Another Image

                  </button>

                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                  >

                    Back to Dashboard

                  </button>

                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* RESULT */}
          {/* ================================================= */}

          {activePage === 'result' && (
            currentAnalysis ? (
              <ResultPage
                result={currentAnalysis}
                onNavigate={handleNavigate}
                onGoToMarket={handleGoToMarket}
              />
            ) : (
              <div className="p-8 text-center">

                <p className="text-sm font-bold text-slate-700">
                  No analysis selected
                </p>

                <button
                  onClick={() =>
                    handleNavigate('upload')
                  }
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Start New Scan
                </button>

              </div>
            )
          )}

          {/* ================================================= */}
          {/* MARKET */}
          {/* ================================================= */}

          {activePage === 'market' && (
            <MarketPricePage
              initialCommodity={
                marketFilters.commodity
              }

              initialDistrict={
                marketFilters.district
              }

              commodityLocked={marketFilters.fromAnalysis}

              onNavigate={handleNavigate}
            />
          )}

          {/* ================================================= */}
          {/* HISTORY */}
          {/* ================================================= */}

          {activePage === 'history' && (
            <HistoryPage
              history={history}
              historyError={historyError}
              onSelectAnalysis={handleSelectAnalysis}
              onNavigate={handleNavigate}
              onClearHistory={handleClearHistory}
            />
          )}

          {/* ================================================= */}
          {/* PROFILE */}
          {/* ================================================= */}

          {activePage === 'profile' && (
            <ProfilePage
              user={user}

              onUpdateUser={handleUpdateUser}

              onNavigate={handleNavigate}

              onLogout={() => {
                if (user.sessionToken) {
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${user.sessionToken}` },
                  }).catch((error) => console.error('Logout request failed:', error));
                }
                setHistory([]);
                setHistoryError('');
                setCurrentAnalysis(null);
                setUser(null);
                setDistrict('');
                handleNavigate('auth', 'login');
              }}
            />
          )}

        </div>

      </main>

    </div>
  );
}