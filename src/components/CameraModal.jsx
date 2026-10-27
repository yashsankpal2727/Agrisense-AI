import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

export const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    setIsStarting(true);

    try {
      // Stop previous camera stream
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: facingMode,
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait until video is ready
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video autoplay warning:', playError);
        }
      }

      console.log('Camera started successfully');
    } catch (err) {
      console.error('Camera access error:', err);

      setCameraError(
        err?.message ||
        'Unable to access camera. Please allow camera permissions or upload an image file instead.'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;

    if (!video) {
      console.error('Camera video element not available');
      return;
    }

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      console.error('Camera video is not ready yet');

      setCameraError(
        'Camera is still starting. Please wait a moment and try again.'
      );

      return;
    }

    setIsCapturing(true);

    try {
      // Create/use canvas
      const canvas =
        canvasRef.current || document.createElement('canvas');

      const width = video.videoWidth;
      const height = video.videoHeight;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', {
        alpha: false,
      });

      if (!ctx) {
        throw new Error('Unable to create image canvas.');
      }

      // Draw current camera frame
      ctx.drawImage(
        video,
        0,
        0,
        width,
        height
      );

      // Convert camera frame to JPEG Base64
      const dataUrl = canvas.toDataURL(
        'image/jpeg',
        0.90
      );

      // Validate generated image
      if (
        !dataUrl ||
        !dataUrl.startsWith('data:image/jpeg;base64,')
      ) {
        throw new Error(
          'Failed to create a valid camera image.'
        );
      }

      console.log('====================================');
      console.log('CAMERA IMAGE CAPTURED');
      console.log('Width:', width);
      console.log('Height:', height);
      console.log('Image type:', typeof dataUrl);
      console.log('Image length:', dataUrl.length);
      console.log(
        'Image prefix:',
        dataUrl.substring(0, 50)
      );
      console.log('====================================');

      // Stop camera before sending image
      stopCamera();

      // Send actual Base64 image to parent
      onCapture(dataUrl);

      // Close modal
      onClose();
    } catch (err) {
      console.error('Camera capture error:', err);

      setCameraError(
        err?.message ||
        'Unable to capture image. Please try again.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) =>
      prev === 'environment'
        ? 'user'
        : 'environment'
    );
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800/80 text-white border-b border-slate-700">

          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />

            <h3 className="font-semibold text-sm">
              Capture Produce Photo
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

        {/* Camera preview */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">

          {cameraError ? (

            <div className="p-6 text-center text-slate-300 max-w-sm">

              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />

              <p className="text-sm font-medium">
                {cameraError}
              </p>

              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold"
              >
                Try Again
              </button>

            </div>

          ) : (

            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Loading */}
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-2 text-white">

                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />

                    <span className="text-sm">
                      Starting camera...
                    </span>

                  </div>
                </div>
              )}

              {/* Target frame */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-2">

                <span className="text-[11px] text-emerald-300 bg-black/50 px-2 py-0.5 rounded-md self-center font-medium">
                  Center produce within frame
                </span>

                <span className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-md self-center">
                  Ensure balanced light & clear background
                </span>

              </div>
            </>

          )}

        </div>

        {/* Hidden canvas */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Controls */}
        <div className="p-4 bg-slate-800 flex items-center justify-between">

          {/* Flip */}
          <button
            onClick={toggleCameraFacing}
            disabled={isStarting || isCapturing || Boolean(cameraError)}
            className="p-2.5 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
          >

            <RefreshCw className="w-4 h-4" />

            <span>
              Flip
            </span>

          </button>

          {/* Capture */}
          <button
            onClick={captureFrame}
            disabled={
              Boolean(cameraError) ||
              isStarting ||
              isCapturing
            }
            className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 hover:scale-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >

            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                <span>Take Photo</span>
              </>
            )}

          </button>

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
};

export default CameraModal;