import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Plus,
  X,
  Sparkles,
  Info,
  ChevronDown,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Leaf,
  Scan,
  Check,
} from 'lucide-react';
import { CameraModal } from '../components/CameraModal.jsx';

export const UploadPage = ({
  district,
  onDistrictChange,
  onStartAnalysis,
}) => {
  const [market, setMarket] = useState('All Markets');
  const [commodity, setCommodity] = useState('Auto Detect');
  const [selectedImage, setSelectedImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoreImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAdditionalImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedImage) return;

    onStartAnalysis({
      image: selectedImage,
      commodity,
      district,
      market,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Title & Subtitle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
            Analyze Harvest Produce
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Capture or upload images of your crate lot or fruit batch for deep learning grading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>APMC Standard Grade A / B / C</span>
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: Controls, Upload Dropzone, Camera, Submit   */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-5">
            {/* District & Market Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Select District Dropdown */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Select APMC District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => onDistrictChange(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-semibold rounded-2xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer shadow-2xs text-slate-900"
                  >
                    <option value="Kolhapur">Kolhapur (Maharashtra)</option>
                    <option value="Nashik">Nashik (Maharashtra)</option>
                    <option value="Pune">Pune (Maharashtra)</option>
                    <option value="Shimla">Shimla (Himachal Pradesh)</option>
                    <option value="Sangli">Sangli (Maharashtra)</option>
                    <option value="Satara">Satara (Maharashtra)</option>
                    <option value="Solapur">Solapur (Maharashtra)</option>
                    <option value="Ahmednagar">Ahmednagar (Maharashtra)</option>
                    <option value="Nagpur">Nagpur (Maharashtra)</option>
                    <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Select Market */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  Target Mandi Yard
                </label>
                <div className="relative">
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="w-full px-4 py-3 text-xs font-semibold rounded-2xl border border-slate-200 bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer shadow-2xs text-slate-900"
                  >
                    <option value="All Markets">All Markets (Benchmark)</option>
                    <option value="Kolhapur Central APMC">Kolhapur Central APMC (Market B - Best)</option>
                    <option value="Shahupuri Wholesale Yard">Shahupuri Wholesale Yard (Market A)</option>
                    <option value="Bavda Sub-Market Yard">Bavda Sub-Market Yard (Market C)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Select Commodity */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                Produce Commodity
              </label>
              <button
                type="button"
                onClick={() => setCommodity('Auto Detect')}
                aria-pressed={commodity === 'Auto Detect'}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-800 bg-emerald-800 text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto Detect</span>
              </button>
            </div>

            {/* Upload Box */}
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-3xl p-10 bg-white hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center text-center cursor-pointer group shadow-xs"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Click to Upload or Drag & Drop Produce Photo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Supports high-resolution JPG, PNG, or WEBP up to 15MB
                  </p>

                  {/* Direct Camera Button */}
                  <div className="mt-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCameraOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Use Camera Scanner</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500 bg-black aspect-16/10 shadow-lg group">
                  <img
                    src={selectedImage}
                    alt="Selected produce"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-rose-600 text-white transition shadow-sm cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-white/20">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Primary Photo Loaded & Ready</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/20 hover:bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-white/20"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Images preview */}
              {additionalImages.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-700">
                    Additional Angle Photos ({additionalImages.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {additionalImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-18 h-18 rounded-2xl overflow-hidden border border-slate-200 shrink-0"
                      >
                        <img src={img} alt="Angle" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white cursor-pointer hover:bg-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* + Add More Images Button */}
              <label className="block pt-1">
                <input
                  type="file"
                  onChange={handleAddMoreImage}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-full py-3 px-4 rounded-2xl border border-dashed border-emerald-400 text-emerald-800 hover:bg-emerald-50/50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs bg-white">
                  <Plus className="w-4 h-4" />
                  <span>Add Angle or Crate Closeup Photo (Optional)</span>
                </div>
              </label>
            </div>

            {/* Big Green CTA Button: [ Analyze Now ] */}
            <button
              type="submit"
              disabled={!selectedImage}
              className="w-full py-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-emerald-800/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Scan className="w-5 h-5" />
              <span>Start AI Quality Grading</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Photography Tips                           */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 space-y-5">
            {/* Inspection Guidelines Accordion/Card */}
            <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                <Info className="w-4 h-4 text-emerald-700" />
                <span>Photography Guidelines for Precision</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <p>
                    <strong>Daylight Lighting:</strong> Take photos in bright natural daylight. Avoid harsh shadows or strong flash reflections.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <p>
                    <strong>Clean Surface:</strong> Place crate or produce on a contrasting table or paper for sharp edge and blemish detection.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <p>
                    <strong>Calyx & Stem Focus:</strong> Keep green calyx and skin texture in crisp focus to evaluate accurate shelf life.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Calibrated against APMC Mandi Inspection Standards</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Web Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setSelectedImage(dataUrl)}
      />
    </div>
  );
};

export default UploadPage;
