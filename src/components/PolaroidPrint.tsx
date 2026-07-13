import { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "motion/react";
import { Photo } from "../types";
import { Download, Share2, Eye, RefreshCw, Zap, Sparkles, Pin, Check } from "lucide-react";
import { playButtonClick } from "../utils/audio";
import { addPhotoToScrapbookDB } from "../utils/db";

interface PolaroidPrintProps {
  photo: Photo;
  onClose: () => void;
  onViewInGallery: () => void;
}

export default function PolaroidPrint({ photo, onClose, onViewInGallery }: PolaroidPrintProps) {
  const [devProgress, setDevProgress] = useState(0); // 0 to 100
  const [shakiness, setShakiness] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    // Trigger initial slide-down ejection spring animation
    controls.start({
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 60, damping: 15 }
    });

    // Chemical development simulation
    const interval = setInterval(() => {
      setDevProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Naturally advances progress
        return Math.min(100, prev + 1.2);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    playButtonClick();
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, "_") || "retro_snap"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    playButtonClick();
    if (navigator.share) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], "retro_polaroid.jpg", { type: "image/jpeg" });
        await navigator.share({
          files: [file],
          title: "RetroCam AI Polaroid",
          text: `Captured on my RetroCam AI camera! "${photo.caption}"`
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: Copy link/Alert
      navigator.clipboard.writeText(photo.url);
      alert("Polaroid Image Data URL copied to clipboard!");
    }
  };

  const handleShake = async () => {
    playButtonClick();
    setShakeCount((prev) => prev + 1);
    
    // Jump the development progress on shake!
    setDevProgress((prev) => Math.min(100, prev + 15));

    // Shake animation
    setShakiness(1);
    await controls.start({
      rotate: [0, -6, 8, -6, 5, 0],
      x: [0, -10, 12, -10, 8, 0],
      transition: { duration: 0.5 }
    });
    setShakiness(0);
  };

  const handlePinToBoard = async () => {
    playButtonClick();
    await addPhotoToScrapbookDB(photo.id);
    setIsPinned(true);
    setTimeout(() => setIsPinned(false), 2000);
  };

  // Determine CSS filters during development
  const getDevelopmentStyle = () => {
    if (devProgress >= 100) return {};

    // Map progress to CSS filters
    const blurAmount = Math.max(0, 20 - (devProgress / 100) * 20);
    const brightnessAmount = 40 + (devProgress / 100) * 60; // starts dark, brightens up
    const sepiaAmount = Math.max(0, 80 - (devProgress / 100) * 80); // starts heavy sepia
    const saturateAmount = (devProgress / 100) * 100; // colors fade in
    const opacityAmount = devProgress < 5 ? 0.05 : devProgress / 100;

    return {
      filter: `blur(${blurAmount}px) brightness(${brightnessAmount}%) sepia(${sepiaAmount}%) saturate(${saturateAmount}%)`,
      opacity: opacityAmount,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/92 flex flex-col items-center justify-center font-sans z-40 p-4 select-none overflow-y-auto">
      {/* Back ambient leak glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Sparkles and lights */}
      {devProgress < 100 && (
        <div className="absolute top-10 flex items-center space-x-2 text-[#A68B6B]/70 font-mono text-xs animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
          <span>CHEMICAL PHOTO EMULSION DEPOSITING...</span>
        </div>
      )}

      {/* Slide Out Container Slot (recreates camera printing mouth) */}
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Camera Output Mouth Slot Representation */}
        <div className="w-64 h-3 bg-[#1A1613] rounded-t-lg border-t-2 border-[#A68B6B]/20 relative z-20 flex items-center justify-center">
          <div className="w-60 h-1 bg-black rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]"></div>
        </div>

        {/* Polaroid Card */}
        <motion.div
          initial={{ y: -300, scale: 0.7, opacity: 0 }}
          animate={controls}
          className={`relative w-64 aspect-[5/6] ${photo.frameStyle === "BOUNTY" ? "bg-[#EADBBF] p-0 rounded-xl" : "bg-[#FAF7F2] p-4 pt-4 pb-12 rounded"} shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] border border-black/10 select-none cursor-pointer mt-0.5 z-10 hover:shadow-[0_30px_60px_rgba(166,139,107,0.15)] transition-shadow overflow-hidden`}
          onClick={handleShake}
        >
          {/* Edge shadow overlay */}
          <div className="absolute inset-0 rounded border border-black/5 pointer-events-none z-10"></div>

          {photo.frameStyle === "BOUNTY" ? (
            <div className="relative w-full h-full">
              {/* Full Bounty Poster fills the card */}
              <motion.img
                src={photo.url}
                alt="Bounty poster snapshot"
                className="w-full h-full object-cover"
                style={getDevelopmentStyle()}
              />
              
              {/* Chemical overlay blur when completely blank */}
              {devProgress < 12 && (
                <div className="absolute inset-0 bg-[#0E1513] flex items-center justify-center z-20">
                  <div className="w-6 h-6 border-2 border-dashed border-[#A68B6B]/30 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Picture Box */}
              <div className="relative w-full aspect-square bg-[#120F0D] rounded overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                {/* The developing picture itself */}
                <motion.img
                  src={photo.url}
                  alt="Polaroid snapshot"
                  className="w-full h-full object-cover"
                  style={getDevelopmentStyle()}
                />

                {/* Simulated green/brown raw developer chemical stains on edges */}
                {devProgress < 95 && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-tr from-green-900/10 via-yellow-900/5 to-transparent pointer-events-none mix-blend-color-burn transition-opacity duration-500"
                    style={{ opacity: 1 - devProgress / 100 }}
                  />
                )}
                
                {/* Chemical overlay blur when completely blank */}
                {devProgress < 12 && (
                  <div className="absolute inset-0 bg-[#0E1513] flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-dashed border-[#A68B6B]/30 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Border Date Stamp */}
              <div className="absolute right-6 bottom-14 font-mono text-[10px] font-bold text-orange-500/70 select-none">
                {photo.dateStr}
              </div>

              {/* Border Cursive Caption / Narrative */}
              <div className="w-full mt-4 flex flex-col items-center justify-center text-center px-1">
                <span 
                  className="text-[#2D261E] italic text-base font-serif tracking-wide select-none truncate max-w-full leading-none transition-all duration-700"
                  style={{
                    opacity: devProgress < 50 ? 0.05 : (devProgress / 100),
                    filter: devProgress < 50 ? "blur(3px)" : "none"
                  }}
                >
                  {photo.caption || "A beautiful memory"}
                </span>
              </div>
            </>
          )}

          {/* Development status bubble inside card border */}
          {devProgress < 100 && (
            <div className="absolute left-4 bottom-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-mono text-[#A68B6B] flex items-center space-x-1 z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>DEV {Math.floor(devProgress)}%</span>
            </div>
          )}
        </motion.div>

        {/* Interactive Helper Text */}
        <div className="mt-8 text-center px-4">
          <AnimatePresence mode="wait">
            {devProgress < 100 ? (
              <motion.div
                key="developing"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center"
              >
                <button
                  onClick={handleShake}
                  className="px-5 py-2 bg-stone-900/80 hover:bg-stone-800 text-[#E6D7B8] text-xs font-mono rounded-full border border-[#A68B6B]/30 hover:border-[#A68B6B]/50 transition-all flex items-center space-x-2 animate-bounce cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" style={{ animationDuration: "3s" }} />
                  <span>TAP TO SHAKE CARD ({shakeCount})</span>
                </button>
                <p className="text-[11px] text-[#A68B6B]/50 font-mono mt-2 uppercase tracking-widest">
                  accelerates chemical dry time
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="developed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="flex items-center space-x-1 text-emerald-500 text-xs font-mono font-bold tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>DEVELOPMENT COMPLETED</span>
                </div>
                
                {/* Micro details panel */}
                <div className="bg-[#120F0D] border border-[#A68B6B]/20 rounded-lg p-3 text-left w-64 text-[10px] font-mono text-[#A68B6B]/70 space-y-1 shadow">
                  <div className="text-white text-xs font-bold font-serif mb-1 truncate">{photo.title}</div>
                  <div><span className="text-[#A68B6B]/40">Scene:</span> {photo.scene}</div>
                  <div><span className="text-[#A68B6B]/40">Loc:</span> {photo.location}</div>
                  <div className="text-[9px] text-[#A68B6B]/40 pt-1 border-t border-[#A68B6B]/10">{photo.composition}</div>
                </div>

                {/* Operations Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
                  <button
                    onClick={handleDownload}
                    className="p-3 bg-[#A68B6B] text-[#0E0B08] rounded-xl hover:bg-[#FAF7F2] hover:text-[#0E0B08] transition-colors cursor-pointer shadow-md"
                    title="Download Polaroid"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-3 bg-stone-900 border border-[#A68B6B]/30 text-[#E6D7B8] rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
                    title="Share Polaroid"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePinToBoard}
                    className={`px-3 py-3 border rounded-xl flex items-center space-x-1 font-mono text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer h-10 ${isPinned ? "bg-emerald-600 border-emerald-500 text-white font-bold" : "bg-[#1C1814] border-[#A68B6B]/30 hover:border-[#A68B6B] text-[#E6D7B8]"}`}
                  >
                    {isPinned ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>PINNED!</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-amber-500" />
                        <span>PIN TO BOARD</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onViewInGallery}
                    className="px-4 py-3 bg-gradient-to-r from-[#A68B6B] to-[#E6D7B8] text-[#0E0B08] font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl flex items-center space-x-1 shadow-lg cursor-pointer h-10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ALBUM VIEW</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Return back to camera */}
          <button
            onClick={onClose}
            className="mt-6 text-xs text-[#A68B6B]/50 hover:text-white font-mono uppercase tracking-widest hover:underline cursor-pointer"
          >
            ← Return to Camera
          </button>
        </div>
      </div>
    </div>
  );
}
