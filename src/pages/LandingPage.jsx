import React from 'react';
import {
  Leaf,
  Scan,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sparkles,
  BarChart3,
  Clock,
} from 'lucide-react';

export const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Leaf className="w-6 h-6 fill-current text-emerald-100" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-emerald-950 font-['Space_Grotesk']">
                AgriSense <span className="text-emerald-600">AI</span>
              </span>
              <p className="text-[11px] font-semibold text-emerald-700">
                Precision Produce Grading & Market Rates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('auth', 'login')}
              className="px-5 py-2.5 rounded-xl border-2 border-emerald-700 text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition cursor-pointer shadow-xs"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate('auth', 'register')}
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/25 transition cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 border-b border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-[#F8FAF7]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Text & Hero Action */}
              <div className="md:col-span-7 space-y-6 text-center md:text-left">
                {/* 3 Leaves Icon Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-bold tracking-wide uppercase">
                  <Leaf className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>AgriSense AI</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Smart Farming Starts With{' '}
                  <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy decoration-2">
                    Better Decisions
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-medium leading-relaxed">
                  Eliminate guesswork and middleman deductions. Instantly grade your harvest
                  (Grade A, B, C) using deep learning computer vision, predict shelf life, and discover
                  real-time APMC mandi prices before selling.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3.5 pt-2 max-w-md mx-auto md:mx-0">
                  <button
                    onClick={() => onNavigate('auth', 'register')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-lg shadow-emerald-800/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => onNavigate('auth', 'login')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border-2 border-emerald-800 text-emerald-900 hover:bg-emerald-50 font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer bg-white shadow-xs"
                  >
                    <span>Login</span>
                  </button>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 pt-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Specialized for Apples & Tomatoes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reported APMC Prices</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual illustration */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-emerald-600 to-green-800 p-6 text-white shadow-2xl shadow-emerald-900/30 overflow-hidden border-4 border-white">
                  {/* Subtle background leaves patterns */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-950/60 to-transparent pointer-events-none" />

                  {/* Top Farmer Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                        <Leaf className="w-4 h-4 text-emerald-200" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                        Produce Scan Preview
                      </span>
                    </div>
                  </div>

                  {/* Produce Preview Box */}
                  <div className="relative rounded-2xl overflow-hidden aspect-4/3 mb-4 shadow-inner border border-white/20 group">
                    <img
                      src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"
                      alt="Fresh Harvest Tomatoes"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2">
                    <p className="text-xs text-emerald-100 font-medium text-center">
                      Analysis results appear after you upload your own produce photo.
                    </p>
                  </div>

                  {/* Bottom Instant Try CTA */}
                  <button
                    onClick={() => onNavigate('upload')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-sm hover:bg-emerald-50 transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Scan className="w-4 h-4 text-emerald-700" />
                    <span>Test Instant Quality Analysis</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI / ML PIPELINE SECTION */}
        <section className="py-14 px-4 sm:px-6 bg-white border-b border-emerald-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold tracking-wide uppercase mb-3">
                <Cpu className="w-3.5 h-3.5" />
                <span>Deep Learning Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI / ML PIPELINE
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                Our vision grading model combines transfer learning with computer vision feature
                extraction to deliver lab-grade grading in seconds.
              </p>
            </div>

            {/* Visual Pipeline Flow */}
            <div className="bg-[#FAF5FF]/70 border-2 border-indigo-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="text-center font-extrabold text-indigo-900 text-base sm:text-lg uppercase tracking-wider mb-6 pb-2 border-b border-indigo-100 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>AI / ML PIPELINE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-stretch">
                {/* Step 1: Input Image */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-2xs flex flex-col items-center text-center">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                    Input Image
                  </h3>
                  <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3">
                    <Scan className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Raw Image</span>
                  <p className="text-[11px] text-slate-500 mt-1">Mobile camera or file upload</p>
                </div>

                {/* Step 2: Preprocessing */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-2xs flex flex-col items-center text-center">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                    Preprocessing
                  </h3>
                  <ul className="text-[11px] text-slate-600 text-left space-y-1.5 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Resize</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Normalization</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Background Removal</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Noise Reduction</span>
                    </li>
                  </ul>
                </div>

                {/* Step 3: Feature Extraction */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-2xs flex flex-col items-center text-center">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                    Feature Extraction
                  </h3>
                  <ul className="text-[11px] text-slate-600 text-left space-y-1.5 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Color Features</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Texture Features</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Shape Features</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>Defect Features</span>
                    </li>
                  </ul>
                </div>

                {/* Step 4: Model (CNN / Transfer Learning) */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-2xs flex flex-col items-center text-center">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                    Model (CNN)
                  </h3>
                  <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-2">
                    <Layers className="w-7 h-7 text-purple-700" />
                  </div>
                  <span className="text-xs font-bold text-indigo-950">Trained Model</span>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md mt-1 border border-indigo-200">
                    EfficientNet / MobileNet
                  </span>
                </div>

                {/* Step 5: Classification & Scoring */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-2xs flex flex-col items-center text-center">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-3">
                    Scoring
                  </h3>
                  <ul className="text-[11px] text-slate-600 text-left space-y-1.5 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Produce ID</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Ripeness Detection</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Defect Detection</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Quality Scoring</span>
                    </li>
                  </ul>
                </div>

                {/* Step 6: Grading Engine */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs flex flex-col items-center text-center ring-2 ring-emerald-500/20">
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-3">
                    Grading Engine
                  </h3>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-700" />
                  </div>
                  <span className="text-xs font-black text-emerald-800">Grade A / B / C</span>
                  <span className="text-[11px] font-semibold text-slate-700 mt-1">Quality Score</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Shelf Life Estimation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Produce Section: Tomatoes & Apples */}
        <section className="py-14 px-4 sm:px-6 bg-[#F8FAF7]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Calibrated Specifically for High-Value Crops
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                Trained on Indian APMC mandi standards for optimal accuracy in price realization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tomato Card */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80"
                    alt="Tomato Grading"
                    className="w-20 h-20 rounded-2xl object-cover border border-emerald-100"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                      Solanum Lycopersicum
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">Tomato Grading</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Hybrid Roma, Vaishali, and Desi country varieties.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 font-medium">
                  • Lycopene color development, shoulder yellowing, blossom-end rot, skin elasticity,
                  cracking, and transport firmness.
                </p>
              </div>

              {/* Apple Card */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80"
                    alt="Apple Grading"
                    className="w-20 h-20 rounded-2xl object-cover border border-emerald-100"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Malus Domestica
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">Apple Grading</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Royal Delicious, Golden, Red Chief, Shimla & Kashmir standard.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 font-medium">
                  • Crimson blush percentage, lenticel density, russeting threshold, stem cavity
                  soundness, and pressure tolerance for cold storage.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200 py-8 px-4 text-center text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span>AgriSense AI · Smart Produce Grading</span>
          </div>
          <p className="text-emerald-400">
            Kolhapur · Nashik · Pune · Shimla · All Major APMC Mandis
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
