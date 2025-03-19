
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseCameraProps {
  onFrame?: (imageData: ImageData) => void;
  frameRate?: number;
  withAudio?: boolean;
  onFaceDetection?: (faces: { count: number, multiple: boolean }) => void;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  hasPermission: boolean | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  isPiPActive: boolean;
  togglePiP: () => void;
  multipleFacesDetected: boolean;
  faceCount: number;
}

const useCamera = ({
  onFrame,
  frameRate = 1,
  withAudio = true,
  onFaceDetection
}: UseCameraProps = {}): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const frameProcessorRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const processingRef = useRef(false); // Flag to prevent processing frames too frequently

  // Initialize face detector if supported
  useEffect(() => {
    const initializeFaceDetector = async () => {
      if ('FaceDetector' in window) {
        try {
          faceDetectorRef.current = new (window as any).FaceDetector({
            maxDetectedFaces: 5,
            fastMode: true
          });
          console.log("Face detector initialized");
        } catch (error) {
          console.error("Error initializing face detector:", error);
        }
      } else {
        console.warn("FaceDetector API not supported in this browser");
        // Still proceed without face detection
        setHasPermission(null);
      }
    };

    initializeFaceDetector();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      stopCamera();
      if (frameProcessorRef.current) {
        cancelAnimationFrame(frameProcessorRef.current);
        frameProcessorRef.current = null;
      }
    };
  }, []);

  // Start the camera stream with simplified error handling
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera access is not supported by your browser");
        toast.error("Camera access is not supported by your browser");
        setHasPermission(false);
        return;
      }

      // Stop any existing stream first to prevent memory leaks
      if (streamRef.current) {
        stopCamera();
      }

      console.log("Requesting camera and audio permissions...");
      
      // Request both video and audio permissions with optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 }, // Reduced from 1280 for better performance
          height: { ideal: 480 }, // Reduced from 720 for better performance
          facingMode: "user",
          frameRate: { ideal: frameRate } // Set frame rate at media level
        },
        audio: withAudio
      });

      if (videoRef.current) {
        // Set hardware acceleration hints for better performance
        videoRef.current.srcObject = stream;
        
        streamRef.current = stream;
        
        // Listen for video to start playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log("Video playback started successfully");
              setIsStreaming(true);
              setHasPermission(true);
            }).catch(err => {
              console.error("Error starting video playback:", err);
              setHasPermission(false);
            });
          }
        };
        
        // Check if we got both audio and video tracks
        const hasAudioTrack = stream.getAudioTracks().length > 0;
        const hasVideoTrack = stream.getVideoTracks().length > 0;
        
        console.log("Stream obtained:", { 
          hasAudioTrack, 
          hasVideoTrack, 
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
        
        if (withAudio && !hasAudioTrack) {
          console.warn("Audio permission was not granted");
          toast.warning("Microphone access was not granted. Voice features may not work properly.");
        }
        
        if (!hasVideoTrack) {
          console.error("Video permission was not granted");
          toast.error("Camera access was not granted. Video features will not work.");
          setHasPermission(false);
          return;
        }
        
        // Process frames if callback is provided or face detection is needed
        if ((onFrame || onFaceDetection) && canvasRef.current) {
          processCameraFrames();
        }
        
        return;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      
      // More specific error messages
      if ((error as DOMException).name === 'NotAllowedError') {
        toast.error("Camera access was denied. Please check your browser permissions.");
      } else if ((error as DOMException).name === 'NotFoundError') {
        toast.error("No camera device was found on your system.");
      } else if ((error as DOMException).name === 'NotReadableError') {
        toast.error("Your camera is already in use by another application.");
      } else {
        toast.error("Could not access camera. Please check permissions.");
      }
    }
  }, [onFrame, withAudio, onFaceDetection, frameRate]);

  // Process frames from camera for analysis - optimized for performance
  const processCameraFrames = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', {
      alpha: false, // Optimization: disable alpha channel
      desynchronized: true // Optimization: reduce latency when possible
    });
    
    if (!context) return;

    const processFrame = async () => {
      if (!isStreaming || video.readyState !== 4 || processingRef.current) {
        frameProcessorRef.current = requestAnimationFrame(processFrame);
        return;
      }

      processingRef.current = true;
      
      // Set canvas dimensions to match video (only if needed)
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (onFrame) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }

      // Perform face detection if supported - limit frequency for better performance
      if (faceDetectorRef.current) {
        try {
          const faces = await faceDetectorRef.current.detect(canvas);
          const count = faces.length;
          const multiple = count > 1;
          
          setFaceCount(count);
          setMultipleFacesDetected(multiple);
          
          if (onFaceDetection) {
            onFaceDetection({ count, multiple });
          }

          // Draw rectangles around detected faces
          context.strokeStyle = multiple ? 'red' : 'green';
          context.lineWidth = 3;
          
          faces.forEach(face => {
            const { boundingBox } = face;
            context.strokeRect(
              boundingBox.x,
              boundingBox.y,
              boundingBox.width,
              boundingBox.height
            );
          });
        } catch (error) {
          console.error("Face detection error:", error);
        }
      } else {
        // If face detector is not available, at least show the camera feed
        setFaceCount(1); // Assume one face is present
        setMultipleFacesDetected(false);
      }
      
      processingRef.current = false;

      // Throttle frame processing to reduce CPU usage
      setTimeout(() => {
        frameProcessorRef.current = requestAnimationFrame(processFrame);
      }, 1000 / frameRate);
    };

    frameProcessorRef.current = requestAnimationFrame(processFrame);
  }, [isStreaming, frameRate, onFrame, onFaceDetection]);

  // Start processing frames when streaming starts
  useEffect(() => {
    if (isStreaming && canvasRef.current && videoRef.current) {
      processCameraFrames();
    }
  }, [isStreaming, processCameraFrames]);

  // Stop the camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (frameProcessorRef.current) {
      cancelAnimationFrame(frameProcessorRef.current);
      frameProcessorRef.current = null;
    }
    
    setIsStreaming(false);
    
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(err => {
        console.error("Error exiting PiP:", err);
      });
    }
    
    setIsPiPActive(false);
    setFaceCount(0);
    setMultipleFacesDetected(false);
  }, []);

  // Capture a photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return data URL of the captured image
    return canvas.toDataURL("image/png");
  }, [isStreaming]);

  // Toggle Picture-in-Picture mode
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (!isPiPActive && videoRef.current.readyState >= 2) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      } else if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      }
    } catch (error) {
      console.error("PiP error:", error);
      toast.error("Picture-in-Picture mode is not supported or has been denied");
    }
  }, [isPiPActive]);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    hasPermission,
    startCamera,
    stopCamera,
    capturePhoto,
    isPiPActive,
    togglePiP,
    multipleFacesDetected,
    faceCount
  };
};

export default useCamera;
