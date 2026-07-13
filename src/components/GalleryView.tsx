import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Photo } from "../types";
import { deletePhotoFromDB, updatePhotoInDB, addPhotoToScrapbookDB } from "../utils/db";
import { 
  X, 
  Trash2, 
  Download, 
  Share2, 
  Heart, 
  BookOpen, 
  Layers, 
  Compass, 
  CloudSun, 
  Check,
  Calendar,
  Eye,
  Columns,
  Sliders,
  Pin
} from "lucide-react";
import { playButtonClick } from "../utils/audio";

interface GalleryViewProps {
  photos: Photo[];
  onPhotoUpdated: (updatedPhoto: Photo) => void;
  onPhotoDeleted: (id: string) => void;
  onClose: () => void;
}

export default function GalleryView({
  photos,
  onPhotoUpdated,
  onPhotoDeleted,
  onClose
}: GalleryViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showRawComparison, setShowRawComparison] = useState(false);
  const [comparisonSliderVal, setComparisonSliderVal] = useState(50); // 0 to 100
  const [activeTab, setActiveTab] = useState<"ALL" | "FAVORITES">("ALL");
  const [isPinned, setIsPinned] = useState(false);

  // Reset pinned status when selected photo changes
  useEffect(() => {
    setIsPinned(false);
  }, [selectedPhoto]);

  const handlePinToBoard = async (photoId: string) => {
    playButtonClick();
    await addPhotoToScrapbookDB(photoId);
    setIsPinned(true);
    setTimeout(() => setIsPinned(false), 2000);
  };

  const filteredPhotos = activeTab === "ALL" 
    ? photos 
    : photos.filter(p => p.isFavorite);

  const handleToggleFavorite = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    playButtonClick();
    const updated = { ...photo, isFavorite: !photo.isFavorite };
    await updatePhotoInDB(updated);
    onPhotoUpdated(updated);
    if (selectedPhoto?.id === photo.id) {
      setSelectedPhoto(updated);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to burn this physical photo? This cannot be undone.")) {
      playButtonClick();
      await deletePhotoFromDB(id);
      onPhotoDeleted(id);
      setSelectedPhoto(null);
    }
  };

  const handleDownload = (photo: Photo) => {
    playButtonClick();
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, "_") || "polaroid"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (photo: Photo) => {
    playButtonClick();
    if (navigator.share) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], "polaroid.jpg", { type: "image/jpeg" });
        await navigator.share({
          files: [file],
          title: photo.title,
          text: `Check out my developed Polaroid capture: "${photo.caption}"`
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(photo.url);
      alert("Polaroid URL copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0E0B08] z-30 flex flex-col font-sans select-none overflow-y-auto">
      {/* Background vintage wood panel graphics */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1E120A]/20 to-[#0A0908] opacity-90 pointer-events-none"></div>

      {/* Header Panel */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#A68B6B]/20 gap-4">
        <div className="text-left">
          <span className="text-[10px] font-mono text-[#A68B6B]/50 uppercase tracking-[0.25em]">Archived Memorabilia</span>
          <h2 className="text-3xl font-serif text-[#E6D7B8] font-bold mt-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#A68B6B]" />
            <span>THE LEATHER ALBUM</span>
          </h2>
        </div>

        {/* Tab & Close Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-[#120F0D] p-1 rounded-xl border border-[#A68B6B]/20 flex space-x-1.5 font-mono text-xs">
            <button
              onClick={() => { playButtonClick(); setActiveTab("ALL"); }}
              className={`px-4 py-1.5 rounded-lg uppercase cursor-pointer transition-all ${activeTab === "ALL" ? "bg-[#A68B6B] text-[#0E0B08] font-bold" : "text-[#A68B6B]"}`}
            >
              All Snaps ({photos.length})
            </button>
            <button
              onClick={() => { playButtonClick(); setActiveTab("FAVORITES"); }}
              className={`px-4 py-1.5 rounded-lg uppercase cursor-pointer transition-all ${activeTab === "FAVORITES" ? "bg-amber-500 text-[#0E0B08] font-bold" : "text-amber-500"}`}
            >
              Favorites ({photos.filter(p => p.isFavorite).length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-900 border border-[#A68B6B]/20 rounded-full text-[#E6D7B8] hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Album Body Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 flex-1">
        {filteredPhotos.length === 0 ? (
          <div className="w-full py-24 flex flex-col items-center justify-center text-[#A68B6B]/40 space-y-3 border-2 border-dashed border-[#A68B6B]/15 rounded-2xl">
            <Layers className="w-10 h-10 stroke-1" />
            <div className="text-sm font-mono uppercase tracking-widest">No physical exposures found</div>
            <button 
              onClick={onClose} 
              className="text-xs bg-[#A68B6B]/10 border border-[#A68B6B]/30 px-4 py-2 rounded-lg text-[#E6D7B8] uppercase tracking-wider font-mono hover:bg-[#A68B6B]/20 transition-all cursor-pointer"
            >
              Expose some film stock
            </button>
          </div>
        ) : (
          /* Staggered Polaroid Deck grid layout */
          <motion.div 
            layout
            className="grid grid-cols-2 md:grid-cols-3 gap-8 justify-items-center"
          >
            <AnimatePresence>
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  layout
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative w-full max-w-[220px] aspect-[5/6] rounded shadow-[0_12px_24px_rgba(0,0,0,0.75)] border border-black/10 hover:shadow-[0_20px_40px_rgba(166,139,107,0.2)] hover:scale-105 hover:-rotate-1 cursor-pointer transition-all duration-300 select-none group overflow-hidden"
                >
                  {/* Outer edge vintage vignette shadow on photo paper card */}
                  <div className="absolute inset-0 border border-black/5 rounded pointer-events-none z-10"></div>

                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover grayscale-10 contrast-125 saturate-95"
                  />
                  
                  {/* Hover quick action card controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2.5 z-20">
                    <button
                      onClick={(e) => handleToggleFavorite(photo, e)}
                      className="p-1.5 bg-[#FAF7F2] rounded-lg text-red-600 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
                      className="p-1.5 bg-[#FAF7F2] rounded-lg text-stone-900 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Favorite indicator pin */}
                  {photo.isFavorite && (
                    <div className="absolute top-2 left-2 z-10">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ==================== EXPANDED PHOTO LOUPE OVERLAY ==================== */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/96 z-50 flex items-center justify-center p-4 overflow-y-auto select-none font-sans"
          >
            {/* Ambient back leak */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-4xl bg-stone-950/80 border border-[#A68B6B]/25 rounded-3xl p-6 relative flex flex-col md:flex-row gap-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto">
              
              {/* Top-Right Absolute Close */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer border border-[#A68B6B]/20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT COLUMN: Visual Media (Slide Compare vs Polaroid) */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto">
                
                {/* Header comparison buttons */}
                <div className="flex items-center space-x-2 bg-black/50 p-1.5 rounded-xl border border-[#A68B6B]/15 mb-4 text-[10px] font-mono">
                  <button
                    onClick={() => { playButtonClick(); setShowRawComparison(false); }}
                    className={`px-3 py-1 rounded-lg uppercase ${!showRawComparison ? "bg-[#A68B6B] text-[#0E0B08] font-bold" : "text-[#A68B6B]"}`}
                  >
                    Polaroid Scan
                  </button>
                  <button
                    onClick={() => { playButtonClick(); setShowRawComparison(true); }}
                    className={`px-3 py-1 rounded-lg uppercase flex items-center space-x-1 ${showRawComparison ? "bg-stone-800 text-white font-bold" : "text-[#A68B6B]"}`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Raw comparison</span>
                  </button>
                </div>

                {/* Main Visual box */}
                <div className="relative w-full max-w-sm aspect-[5/6] rounded shadow-[0_20px_45px_rgba(0,0,0,0.9)] border border-black/10 select-none overflow-hidden bg-[#120F0D]">
                  {!showRawComparison ? (
                    <img
                      src={selectedPhoto.url}
                      alt="Full developed card"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={selectedPhoto.rawUrl || selectedPhoto.url}
                        alt="Raw user snap"
                        className="w-full h-full object-cover grayscale-0 filter-none"
                      />
                      <div 
                        className="absolute inset-y-0 right-0 overflow-hidden border-l-2 border-amber-500 shadow-2xl"
                        style={{ width: `${100 - comparisonSliderVal}%` }}
                      >
                        <img
                          src={selectedPhoto.url}
                          alt="Developed snap"
                          className="absolute top-0 right-0 h-full object-cover"
                          style={{ width: "384px", maxWidth: "none" }} // lock width to base size of container
                        />
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={comparisonSliderVal}
                        onChange={(e) => setComparisonSliderVal(parseInt(e.target.value))}
                        className="absolute inset-x-0 bottom-4 w-full accent-amber-500 opacity-60 hover:opacity-100 transition-opacity cursor-ew-resize h-2 bg-stone-900/50 rounded-full"
                      />
                      
                      <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-[#A68B6B]">RAW</div>
                      <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400">DEV</div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: AI Analysis & Camera Specs */}
              <div className="flex-1 flex flex-col justify-between text-left space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#A68B6B]/40 uppercase tracking-widest flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Gemini Optical Analysis</span>
                    </span>
                    <button
                      onClick={(e) => handleToggleFavorite(selectedPhoto, e)}
                      className="p-2 bg-stone-900 border border-[#A68B6B]/20 rounded-xl text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${selectedPhoto.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-[#E6D7B8] font-bold mt-2 truncate">
                    {selectedPhoto.title || "Exposed Moment"}
                  </h3>
                  
                  <p className="text-xs text-[#A68B6B]/80 font-sans leading-relaxed mt-2.5">
                    {selectedPhoto.scene}
                  </p>
                </div>

                {/* AI Composition Report Card */}
                <div className="bg-[#120F0D] border border-[#A68B6B]/15 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[9px] font-mono text-[#E6D7B8] font-bold uppercase tracking-wider border-b border-[#A68B6B]/10 pb-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>COMPOSITION ANALYSIS REPORT</span>
                  </div>
                  <p className="text-[11px] font-sans text-[#A68B6B]/70 leading-relaxed italic">
                    "{selectedPhoto.composition}"
                  </p>
                </div>

                {/* Bottom Details (GPS & EXPOSURE) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Geographic & Weather tag */}
                  <div className="bg-[#120F0D] border border-[#A68B6B]/15 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[9px] font-mono text-[#A68B6B]/40 font-bold uppercase">
                      <Compass className="w-3.5 h-3.5" />
                      <span>GPS LOCATION</span>
                    </div>
                    <div className="text-xs text-[#E6D7B8] font-serif font-semibold">{selectedPhoto.location}</div>
                    
                    <div className="flex items-center space-x-1 text-[10px] text-[#A68B6B]/60 font-mono">
                      <CloudSun className="w-3 h-3 text-amber-500/70" />
                      <span>{selectedPhoto.weather}</span>
                    </div>
                  </div>

                  {/* Exposure settings */}
                  <div className="bg-[#120F0D] border border-[#A68B6B]/15 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[9px] font-mono text-[#A68B6B]/40 font-bold uppercase">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>CAMERA SPECS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#A68B6B]">
                      <div>APERTURE:</div>
                      <div className="text-white text-right font-bold">{selectedPhoto.settings.aperture}</div>
                      <div>SHUTTER:</div>
                      <div className="text-white text-right font-bold">{selectedPhoto.settings.shutter}</div>
                      <div>ISO SPEED:</div>
                      <div className="text-white text-right font-bold">{selectedPhoto.settings.iso}</div>
                      <div>LENS USED:</div>
                      <div className="text-amber-500 text-right font-bold truncate">{selectedPhoto.settings.lens}</div>
                    </div>
                  </div>
                </div>

                 {/* Bottom Operations Bar */}
                 <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-4 border-t border-[#A68B6B]/10">
                   <button
                     onClick={() => handleDelete(selectedPhoto.id)}
                     className="p-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer border border-red-900/30 flex-shrink-0"
                     title="Burn photo permanently"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>

                   <button
                     onClick={() => handlePinToBoard(selectedPhoto.id)}
                     className={`flex-1 py-3 border rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 h-11 ${isPinned ? "bg-emerald-600 border-emerald-500 text-white" : "bg-stone-900 hover:bg-stone-800 border border-[#A68B6B]/30 text-[#E6D7B8]"}`}
                   >
                     {isPinned ? (
                       <>
                         <Check className="w-4 h-4 text-white animate-bounce" />
                         <span>Pinned!</span>
                       </>
                     ) : (
                       <>
                         <Pin className="w-4 h-4 text-amber-500" />
                         <span>Pin to Board</span>
                       </>
                     )}
                   </button>

                   <button
                     onClick={() => handleDownload(selectedPhoto)}
                     className="flex-1 py-3 bg-[#A68B6B] hover:bg-[#FAF7F2] text-[#0E0B08] font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 h-11"
                   >
                     <Download className="w-4 h-4" />
                     <span>Download Scan</span>
                   </button>

                   <button
                     onClick={() => handleShare(selectedPhoto)}
                     className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-[#E6D7B8] border border-[#A68B6B]/30 font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 h-11"
                   >
                     <Share2 className="w-4 h-4" />
                     <span>Share Moment</span>
                   </button>
                 </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
