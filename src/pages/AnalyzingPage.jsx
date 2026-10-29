import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle, Sparkles, Cpu, Scan, MapPin } from 'lucide-react';

export const AnalyzingPage = ({
  image,
  commodity,
  district,
  market,
  sessionToken,
  onAnalysisComplete,
  onError,
}) => {
  const [progress, setProgress] = useState(15);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    { label: 'Image Validation', subtext: 'Resolution & format verification' },
    { label: 'Produce Detection', subtext: 'Deep CNN produce identification' },
    { label: 'Image Preprocessing', subtext: 'Background removal & normalization' },
    { label: 'Quality Analysis', subtext: 'Color, firmness, & defect scoring' },
    { label: 'Market Analysis', subtext: 'APMC mandi pricing correlation' },
  ];
  useEffect(() => {
    let isMounted = true;
    let progressInterval = null;

    const convertToDataURL = async (source) => {
      if (!source) {
        throw new Error('No image selected');
      }

      // Already a Base64 data URL
      if (typeof source === 'string' && source.startsWith('data:image/')) {
        return source;
      }

      // If the image is a normal URL, download it and convert it
      if (
        typeof source === 'string' &&
        (source.startsWith('http://') || source.startsWith('https://'))
      ) {
        const response = await fetch(source);

        if (!response.ok) {
          throw new Error('Unable to load selected image');
        }

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to convert image'));

          reader.readAsDataURL(blob);
        });
      }

      throw new Error('Invalid image format');
    };

    const createPreviewDataURL = (imageData) =>
      new Promise((resolve, reject) => {
        const previewImage = new Image();
        previewImage.onload = () => {
          const maxDimension = 512;
          const scale = Math.min(
            1,
            maxDimension / Math.max(previewImage.naturalWidth, previewImage.naturalHeight)
          );
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(previewImage.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(previewImage.naturalHeight * scale));
          canvas.getContext('2d').drawImage(previewImage, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        previewImage.onerror = () => reject(new Error('Unable to prepare image preview'));
        previewImage.src = imageData;
      });

    const fetchAnalysis = async () => {
      try {
        console.log('====================================');
        console.log('STARTING AGRISENSE ANALYSIS');
        console.log('Image type:', typeof image);
        console.log('Image length:', image?.length);
        console.log(
          'Image prefix:',
          typeof image === 'string' ? image.substring(0, 50) : image
        );
        console.log('Commodity:', commodity);
        console.log('District:', district);
        console.log('Market:', market);
        console.log('====================================');

        // Convert image to guaranteed Base64 data URL
        const imageData = await convertToDataURL(image);
        const previewImage = await createPreviewDataURL(imageData);

        console.log('Converted image successfully');
        console.log('Final image length:', imageData.length);
        console.log('Final image prefix:', imageData.substring(0, 50));

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            image: imageData,
            previewImage,
            commodity,
            district,
            market,
          }),
        });

        console.log('Backend HTTP status:', response.status);

        const json = await response.json();

        console.log('Backend response:', json);

        // =========================================================
        // HANDLE UNSUPPORTED FRUIT
        // =========================================================

        if (json.status === 'rejected') {
          console.log('====================================');
          console.log('UNSUPPORTED IMAGE DETECTED');
          console.log('Message:', json.message || json.error);
          console.log('Fruit detection:', json.fruit_detection);
          console.log('====================================');

          if (progressInterval) {
            clearInterval(progressInterval);
          }

          if (!isMounted) {
            return;
          }

          setProgress(100);
          setStepIndex(5);

          const rejectedResult = {
            ...json,

            isRejected: true,

            rejectionMessage:
              json.message ||
              json.error ||
              'The uploaded image does not appear to contain a supported fruit. Please upload an Apple, Tomato, or Dragon Fruit image.',
          };

          console.log('Sending rejected result to App.jsx');

          setTimeout(() => {
            if (isMounted) {
              onAnalysisComplete(rejectedResult);
            }
          }, 500);

          return;
        }


        // =========================================================
        // HANDLE NORMAL SERVER ERROR
        // =========================================================

        if (!response.ok) {
          throw new Error(
            json.error ||
            json.message ||
            `Server returned HTTP ${response.status}`
          );
        }


        // =========================================================
        // HANDLE NORMAL SUCCESS
        // =========================================================

        if (json.status !== 'success' || !json.data) {
          throw new Error(
            json.error ||
            json.message ||
            'Grading pipeline failed'
          );
        }

        if (!isMounted) return;

        // Stop progress
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        setProgress(100);
        setStepIndex(5);

        console.log('====================================');
        console.log('ANALYSIS SUCCESS');
        console.log('Grade:', json.data.grade);
        console.log('Confidence:', json.data.confidence);
        console.log('====================================');

        setTimeout(() => {
          if (isMounted) {
            onAnalysisComplete(json.data);
          }
        }, 500);

      } catch (err) {
        console.error('====================================');
        console.error('ANALYSIS FAILED');
        console.error(err);
        console.error('====================================');

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (isMounted) {
          onError(err.message || 'Analysis failed');
        }
      }
    };

    fetchAnalysis();

    // Progress animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }

        const next = prev + 5;

        if (next >= 25 && next < 45) {
          setStepIndex(1);
        } else if (next >= 45 && next < 65) {
          setStepIndex(2);
        } else if (next >= 65 && next < 85) {
          setStepIndex(3);
        } else if (next >= 85) {
          setStepIndex(4);
        }

        return next;
      });
    }, 220);

    return () => {
      isMounted = false;

      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [image, commodity, district, market, onAnalysisComplete, onError]);

  // SVG Circular math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full space-y-6">
      {/* Title & Subtitle Header */}
      <div className="text-center space-y-1 pb-2 border-b border-emerald-100/70">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Space_Grotesk']">
          AI Produce Quality Inspection in Progress
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Extracting surface color balance, turgidity index, and defect ratio for APMC Mandi benchmarking
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto py-4">
        {/* Left Column: Visual scanning preview */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-2xl bg-black">
            <img src={image} alt="Analyzing produce" className="w-full h-full object-cover" />
            {/* Animated laser scan bar */}
            <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-bounce" />
            <div className="absolute inset-0 bg-emerald-950/20 backdrop-contrast-125" />

            {/* Overlaid Scanner HUD */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Scanning Features</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md p-2 rounded-xl text-white text-[11px] flex items-center justify-between border border-white/20">
              <div className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{district} APMC</span>
              </div>
              <span className="font-bold text-emerald-300">{commodity}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>MobileNetV2 + Vision AI Pipeline Active</span>
          </div>
        </div>

        {/* Right Column: Progress Wheel & Checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Circular Progress Wheel */}
          <div className="flex items-center gap-6 bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#15803D"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 font-['Space_Grotesk'] tracking-tight">
                  {progress}%
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">
                  Progress
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Evaluating Produce Batch
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Analyzing pigmentation, surface blemishes, firmness, and matching current APMC mandi price indices.
              </p>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                {stepIndex < steps.length ? `Current Step: ${steps[stepIndex].label}` : 'Finalizing Report...'}
              </div>
            </div>
          </div>

          {/* Step by Step Checklist */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3.5">
            {steps.map((step, idx) => {
              const isCompleted = stepIndex > idx;
              const isInProgress = stepIndex === idx;

              return (
                <div key={step.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 fill-emerald-100" />
                    ) : isInProgress ? (
                      <Loader2 className="w-5 h-5 text-emerald-700 animate-spin shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <div>
                      <span
                        className={`text-xs font-bold ${isCompleted || isInProgress ? 'text-slate-900' : 'text-slate-400'
                          }`}
                      >
                        {step.label}
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium">{step.subtext}</p>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md animate-pulse">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzingPage;
