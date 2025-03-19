import React, { useEffect, useState } from "react";
import { CameraOff, Maximize, Minimize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useCamera from "@/hooks/useCamera";

interface CameraPreviewProps {
  className?: string;
}

const CameraPreview = ({ className = "" }: CameraPreviewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [hasDenied, setHasDenied] = useState(false);

  const { 
    videoRef, 
    canvasRef, 
    isStreaming, 
    hasPermission, 
    startCamera, 
    stopCamera, 
    multipleFacesDetected,
    faceCount
  } = useCamera({
    frameRate: 15,
    onFaceDetection: ({ multiple }) => {
      if (multiple) console.log("Multiple faces detected!");
    }
  });

  useEffect(() => {
    if (localStorage.getItem("cameraDenied") === "true") {
      setHasDenied(true);
      return;
    }

    startCamera().catch((err) => {
      console.error("Camera error:", err);
      localStorage.setItem("cameraDenied", "true");
      setHasDenied(true);
    });

    return () => stopCamera();
  }, []);

  const toggleExpanded = () => setExpanded(!expanded);

  const retryCamera = () => {
    localStorage.removeItem("cameraDenied");
    setHasDenied(false);
    startCamera().catch((err) => {
      console.error("Camera error on retry:", err);
      localStorage.setItem("cameraDenied", "true");
      setHasDenied(true);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-4 right-4 z-40 ${className}`}
      >
        <div className={`
          bg-white rounded-lg shadow-lg overflow-hidden
          ${expanded ? "w-80 h-60" : "w-48 h-48"}
          transition-all duration-300 ease-in-out
        `}>
          {/* Header */}
          <div className="bg-primary text-white p-2 flex justify-between items-center">
            <span className="text-sm font-medium">Video Preview</span>
            <button
              onClick={toggleExpanded}
              className="p-1 hover:bg-primary-foreground/20 rounded transition-colors"
              aria-label={expanded ? "Minimize" : "Expand"}
            >
              {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>

          {/* Camera View */}
          <div className={`relative ${expanded ? "h-60" : "h-48"} bg-gray-900`}>
            {hasPermission === false || hasDenied ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <CameraOff size={24} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-400 mb-2">Video access denied</p>
                <button
                  onClick={retryCamera}
                  className="px-3 py-1 bg-primary text-white text-xs rounded-full hover:bg-primary/90 transition-colors"
                >
                  Allow Video
                </button>
              </div>
            ) : (
              <>
                {/* Video Feed */}
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    !isStreaming ? "hidden" : ""
                  }`}
                />

                {/* Canvas Overlay */}
                <canvas 
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Face Detection Indicator */}
                {isStreaming && (
                  <div className={`
                    absolute top-2 left-2 px-2 py-1 rounded-full text-xs
                    ${multipleFacesDetected ? "bg-red-500 text-white" : "bg-green-500 text-white"}
                    ${faceCount === 0 ? "bg-yellow-500 text-white" : ""}
                  `}>
                    {faceCount === 0 
                      ? "No face detected" 
                      : multipleFacesDetected 
                        ? `Multiple faces (${faceCount})` 
                        : "1 face detected"}
                  </div>
                )}

                {/* Loading Animation */}
                {!isStreaming && hasPermission !== false && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraPreview;
