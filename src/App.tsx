import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Photo } from "./types";
import { getPhotosFromDB, addPhotoToDB } from "./utils/db";
import { setMuted, getMuted, playButtonClick } from "./utils/audio";
import SplashLoader from "./components/SplashLoader";
import VintageCameraView from "./components/VintageCameraView";
import PolaroidPrint from "./components/PolaroidPrint";
import GalleryView from "./components/GalleryView";
import ScrapbookCanvas from "./components/ScrapbookCanvas";
import { 
  Camera, 
  Image as ImageIcon, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Library, 
  Sparkles,
  Layers,
  MonitorPlay
} from "lucide-react";

export default function App() {
  const [view, setView] = useState<"SPLASH" | "CAMERA" | "PRINT" | "GALLERY" | "SCRAPBOOK">("SPLASH");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [developingPhoto, setDevelopingPhoto] = useState<Photo | null>(null);
  const [isMuted, setIsMutedState] = useState(false);

  // Load photos from IndexedDB on startup
  useEffect(() => {
    async function initDBAndPhotos() {
      const savedPhotos = await getPhotosFromDB();
      setPhotos(savedPhotos);
    }
    initDBAndPhotos();
  }, []);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMutedState(nextMute);
    setMuted(nextMute);
    playButtonClick();
  };

  const handlePhotoCaptured = async (newPhoto: Photo) => {
    // Save to IndexedDB
    await addPhotoToDB(newPhoto);

    // Update locally
    setPhotos((prev) => {
      // Check if photo is already saved (e.g. background Gemini updates might trigger this)
      const exists = prev.some((p) => p.id === newPhoto.id);
      if (exists) {
        return prev.map((p) => (p.id === newPhoto.id ? newPhoto : p));
      }
      return [newPhoto, ...prev];
    });

    // Set active developing photo and trigger printing view
    setDevelopingPhoto(newPhoto);
    setView("PRINT");
  };

  const handlePhotoUpdated = (updatedPhoto: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    if (developingPhoto?.id === updatedPhoto.id) {
      setDevelopingPhoto(updatedPhoto);
    }
  };

  const handlePhotoDeleted = (deletedId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
    if (developingPhoto?.id === deletedId) {
      setDevelopingPhoto(null);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0E0B08] text-[#E6D7B8] overflow-x-hidden flex flex-col font-sans">
      
      {/* Background Vintage Noise overlay */}
      <div className="fixed inset-0 opacity-2 pointer-events-none bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px] z-50"></div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: PRE-ONBOARDING / SYSTEM CALIBRATION SPLASH LOADER */}
        {view === "SPLASH" && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full"
          >
            <SplashLoader onComplete={() => setView("CAMERA")} />
          </motion.div>
        )}

        {/* VIEW 2: ACTIVE INDUSTRIAL CORE WORKSPACE */}
        {view !== "SPLASH" && (
          <motion.div
            key="app-core"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col w-full h-full relative"
          >
            {/* Upper Global Navigation Bar */}
            <header className="relative z-20 w-full bg-[#120F0D]/90 backdrop-blur-md border-b border-[#A68B6B]/15 px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between shadow-md">
              <div 
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={() => { playButtonClick(); setView("CAMERA"); }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#A68B6B] to-[#E6D7B8] p-[1.5px]">
                  <div className="w-full h-full rounded-md bg-[#120F0D] flex items-center justify-center text-amber-500">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-left select-none">
                  <h1 className="font-serif font-bold text-base text-[#E6D7B8] leading-none tracking-wide group-hover:text-[#A68B6B] transition-colors">
                    RETROCAM AI
                  </h1>
                  <span className="text-[8px] font-mono text-[#A68B6B]/50 uppercase tracking-[0.2em] block mt-0.5">
                    analog glass simulation
                  </span>
                </div>
              </div>

              {/* Central Quick Mode Indicator */}
              <div className="hidden md:flex items-center space-x-1 bg-black/40 px-3 py-1.5 rounded-full border border-[#A68B6B]/15 font-mono text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>ACTIVE PROCESSOR:</span>
                <span className="text-[#E6D7B8] font-bold">GEMINI FLASH-3.5</span>
              </div>

              {/* Utility Tools */}
              <div className="flex items-center space-x-2">
                {/* Board button */}
                <button
                  onClick={() => { playButtonClick(); setView("SCRAPBOOK"); }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1 text-xs font-mono tracking-wider ${view === "SCRAPBOOK" ? "bg-[#A68B6B] border-[#A68B6B] text-[#0E0B08] font-bold" : "bg-stone-900/60 border-[#A68B6B]/25 text-[#E6D7B8]"}`}
                  title="Open memories Scrapbook Board"
                >
                  <Library className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-bold">MEMORIES BOARD</span>
                </button>

                {/* Album button */}
                <button
                  onClick={() => { playButtonClick(); setView("GALLERY"); }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center space-x-1 text-xs font-mono tracking-wider ${view === "GALLERY" ? "bg-[#A68B6B] border-[#A68B6B] text-[#0E0B08] font-bold" : "bg-stone-900/60 border-[#A68B6B]/25 text-[#E6D7B8]"}`}
                  title="Open saved Photo Album"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-bold">ALBUM ({photos.length})</span>
                </button>

                {/* Mute button */}
                <button
                  onClick={handleToggleMute}
                  className="p-2 bg-stone-900/60 border border-[#A68B6B]/25 rounded-xl text-[#E6D7B8] hover:border-[#A68B6B] transition-colors cursor-pointer"
                  title={isMuted ? "Unmute sounds" : "Mute sounds"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#A68B6B]" />
                  )}
                </button>
              </div>
            </header>

            {/* Core Responsive Studio Board Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center relative z-10 px-2 sm:px-4 py-4 sm:py-8">
              <AnimatePresence mode="wait">
                {/* SUB-VIEW 1: CAMERA SHIELD (Centered inside Desktop device box) */}
                {view === "CAMERA" && (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="w-full flex flex-col items-center"
                  >
                    {/* Visual Studio Desktop Frame Wrap */}
                    <div className="hidden lg:block text-center mb-4 select-none">
                      <h3 className="font-serif italic text-[#A68B6B] text-lg">STUDIO WORKBENCH</h3>
                      <p className="text-[10px] font-mono text-[#A68B6B]/40 uppercase tracking-widest mt-0.5">Classic Titanium Rangefinder</p>
                    </div>

                    <div className="lg:bg-[#151210] lg:border-2 lg:border-[#A68B6B]/15 lg:p-8 lg:rounded-[40px] lg:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.95)]">
                      <VintageCameraView
                        onPhotoCaptured={handlePhotoCaptured}
                        lastCapturedPhoto={photos[0] || null}
                        onOpenGallery={() => setView("GALLERY")}
                        isMuted={isMuted}
                        onToggleMute={handleToggleMute}
                      />
                    </div>
                  </motion.div>
                )}

                {/* SUB-VIEW 2: DRIFTING DEVELOPING PHOTO CARD EJECTION */}
                {view === "PRINT" && developingPhoto && (
                  <motion.div
                    key="print"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <PolaroidPrint
                      photo={developingPhoto}
                      onClose={() => setView("CAMERA")}
                      onViewInGallery={() => setView("GALLERY")}
                    />
                  </motion.div>
                )}

                {/* SUB-VIEW 3: GALLERY DRAWERS AND DETAILS */}
                {view === "GALLERY" && (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 25 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    <GalleryView
                      photos={photos}
                      onPhotoUpdated={handlePhotoUpdated}
                      onPhotoDeleted={handlePhotoDeleted}
                      onClose={() => setView("CAMERA")}
                    />
                  </motion.div>
                )}

                {/* SUB-VIEW 4: CORKBOARD MEMORIES BOARD SCRAPBOOK */}
                {view === "SCRAPBOOK" && (
                  <motion.div
                    key="scrapbook"
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 25 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    <ScrapbookCanvas
                      photos={photos}
                      onClose={() => setView("CAMERA")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Global micro footer */}
            <footer className="w-full py-4 text-center border-t border-[#A68B6B]/10 relative z-20 font-mono text-[9px] text-[#A68B6B]/40 uppercase tracking-widest bg-stone-950/40 select-none">
              <span>RetroCam AI Pro Model 35 • Precision Hardware Emulation • © 2026</span>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
