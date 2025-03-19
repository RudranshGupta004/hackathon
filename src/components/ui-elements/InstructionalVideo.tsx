
import React, { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Info } from "lucide-react";
import { motion } from "framer-motion";

interface InstructionalVideoProps {
  videoSrc: string;
  title: string;
  className?: string;
}

const InstructionalVideo = ({ videoSrc, title, className }: InstructionalVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative rounded-lg overflow-hidden shadow-md ${className}`}
    >
      <div className="relative">
        <video
          src={videoSrc}
          autoPlay={isPlaying}
          loop
          muted={isMuted}
          className={`w-full object-cover ${isExpanded ? 'h-auto aspect-video' : 'h-24'}`}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-white/80 hover:bg-white text-primary transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
        
        <div className="absolute top-2 left-2 flex items-center bg-black/60 rounded-full px-2 py-1">
          <Info size={12} className="text-white mr-1" />
          <span className="text-xs text-white">Guide: {title}</span>
        </div>
        
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-primary transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InstructionalVideo;
