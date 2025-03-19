
import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  width?: number | string;
  height?: number | string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const VideoPlayer = ({
  src,
  title,
  className,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  width = "100%",
  height = "auto",
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoPlay) {
      videoRef.current?.play().catch(() => {
        console.log("Autoplay prevented by browser");
        setIsPlaying(false);
      });
    }
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (onPause) onPause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
        if (onPlay) onPlay();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
    if (loop && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(error => {
        console.error("Error looping video:", error);
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)} style={{ width, height }}>
      <video
        ref={videoRef}
        src={src}
        title={title}
        loop={loop}
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        className="w-full h-full object-cover"
      />
      
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex items-center gap-2">
          <button 
            onClick={togglePlay}
            className="text-white hover:text-primary transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-primary transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <div className="flex-1 h-1 bg-gray-500 rounded overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
