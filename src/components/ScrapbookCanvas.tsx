import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Photo, ScrapbookItem } from "../types";
import { getScrapbookItemsFromDB, saveScrapbookItemsToDB } from "../utils/db";
import { 
  Plus, 
  Save, 
  Trash2, 
  RotateCw, 
  Maximize2, 
  StickyNote, 
  Layers, 
  X,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { playButtonClick, playFilmEjectSound } from "../utils/audio";

interface ScrapbookCanvasProps {
  photos: Photo[];
  onClose: () => void;
}

const TAPE_COLORS = [
  "rgba(212, 175, 55, 0.5)", // semi-translucent gold
  "rgba(95, 158, 160, 0.5)", // semi-translucent teal
  "rgba(244, 164, 96, 0.5)", // semi-translucent sandstone orange
  "rgba(255, 255, 255, 0.45)" // translucent white masking tape
];

export default function ScrapbookCanvas({ photos, onClose }: ScrapbookCanvasProps) {
  const [items, setItems] = useState<ScrapbookItem[]>([]);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Load scrapbook items on mount
  useEffect(() => {
    loadScrapbook();
  }, []);

  const loadScrapbook = async () => {
    const saved = await getScrapbookItemsFromDB();
    if (saved && saved.length > 0) {
      setItems(saved);
    } else if (photos.length > 0) {
      // Seed with first photo if empty
      setItems([
        {
          id: "seeded_item",
          photoId: photos[0].id,
          x: 100,
          y: 120,
          rotation: -5,
          scale: 1,
          zIndex: 1,
          tapeColor: TAPE_COLORS[0]
        }
      ]);
    }
  };

  const handleSaveLayout = async () => {
    playButtonClick();
    setIsSaving(true);
    await saveScrapbookItemsToDB(items);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const addPhotoToScrapbook = (photoId: string) => {
    playButtonClick();
    const maxZ = items.reduce((max, item) => Math.max(max, item.zIndex), 0);
    const newItem: ScrapbookItem = {
      id: Math.random().toString(36).substring(2, 9),
      photoId: photoId,
      x: 80 + Math.random() * 80,
      y: 100 + Math.random() * 100,
      rotation: (Math.random() - 0.5) * 25, // random rotation between -12 and 12 deg
      scale: 1,
      zIndex: maxZ + 1,
      tapeColor: TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)]
    };
    setItems((prev) => [...prev, newItem]);
    setShowPhotoSelector(false);
    playFilmEjectSound();
  };

  const handleItemRotate = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playButtonClick();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, rotation: (item.rotation + 15) % 360 }
          : item
      )
    );
  };

  const handleItemRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playButtonClick();
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleItemFocus = (itemId: string) => {
    // Bring item to top z-index
    const maxZ = items.reduce((max, item) => Math.max(max, item.zIndex), 0);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, zIndex: maxZ + 1 } : item
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0E0B08] z-30 flex flex-col font-sans select-none overflow-hidden">
      {/* Bulletin Board styled Background */}
      <div className="absolute inset-0 bg-[#161210] opacity-95 pointer-events-none">
        {/* Subtle linen/craft paper diagonal weave */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1715_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40"></div>
      </div>

      {/* Top Controls Bar */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-[#A68B6B]/25">
        <div>
          <span className="text-[9px] font-mono text-[#A68B6B]/50 uppercase tracking-[0.2em] block">Tactile Studio Workspace</span>
          <h2 className="text-xl sm:text-2xl font-serif text-[#E6D7B8] font-bold flex items-center gap-1.5">
            <StickyNote className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-amber-500" />
            <span>MEMORIES BOARD</span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:space-x-3 w-full md:w-auto">
          <button
            onClick={() => { playButtonClick(); setShowPhotoSelector(true); }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-900 border border-[#A68B6B]/30 hover:border-[#A68B6B] rounded-xl text-[#E6D7B8] font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow flex-1 sm:flex-initial justify-center"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>Add Polaroid</span>
          </button>

          <button
            onClick={handleSaveLayout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#A68B6B] to-[#E6D7B8] text-[#0E0B08] font-mono text-xs uppercase tracking-wider font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md flex-1 sm:flex-initial justify-center"
          >
            {saveSuccess ? (
              <>
                <Sparkles className="w-4 h-4 animate-bounce" />
                <span>SAVED OK</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Layout"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => { playButtonClick(); setShowHelp(true); }}
            className="p-1.5 sm:p-2 bg-stone-900 border border-[#A68B6B]/30 hover:border-[#A68B6B] rounded-xl text-[#E6D7B8] cursor-pointer flex items-center justify-center"
            title="How to use the Board"
          >
            <HelpCircle className="w-4.5 h-4.5 text-amber-500" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-stone-900 border border-[#A68B6B]/20 rounded-full text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrapbook Board Canvas Stage */}
      <div className="relative flex-1 w-full max-w-5xl mx-auto overflow-hidden p-2 sm:p-6">
        <div className="w-full h-full border border-[#A68B6B]/10 rounded-2xl relative bg-[#1A1613] shadow-inner overflow-hidden">
          {/* Bulletin Grid guideline pins */}
          <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-red-600/50 shadow-md"></div>
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-600/50 shadow-md"></div>

          {items.map((item) => {
            const photo = photos.find((p) => p.id === item.photoId);
            if (!photo) return null;

            return (
              <motion.div
                key={item.id}
                drag
                dragMomentum={false}
                dragElastic={0.1}
                onDragStart={() => handleItemFocus(item.id)}
                style={{ zIndex: item.zIndex }}
                className="absolute w-32 xs:w-36 sm:w-44 aspect-[5/6] cursor-move flex flex-col justify-between overflow-visible group"
                initial={{ x: item.x, y: item.y, rotate: item.rotation }}
                animate={{ rotate: item.rotation }}
              >
                {/* Physical translucent colored tape overlay at top of the photo */}
                <div 
                  className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-12 sm:w-16 h-4 sm:h-5 rounded transform rotate-[-4deg] shadow-sm z-20 pointer-events-none opacity-85"
                  style={{ backgroundColor: item.tapeColor || TAPE_COLORS[0] }}
                ></div>

                {/* Baked Full Polaroid/Bounty Card Image */}
                <div className="relative w-full h-full rounded shadow-[5px_10px_22px_rgba(0,0,0,0.65)] overflow-hidden border border-black/10">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>

                {/* Operations overlay indicators (appears when hovered) */}
                <div className="absolute right-1 bottom-1 flex flex-col space-y-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleItemRotate(item.id, e)}
                    className="p-1 bg-stone-950/90 border border-[#A68B6B]/40 text-amber-500 rounded-full hover:scale-115 shadow-lg cursor-pointer"
                    title="Rotate Photo"
                  >
                    <RotateCw className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => handleItemRemove(item.id, e)}
                    className="p-1 bg-stone-950/90 border border-red-900/40 text-red-500 rounded-full hover:scale-115 shadow-lg cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#A68B6B]/30 space-y-2 pointer-events-none">
              <Layers className="w-12 h-12 stroke-1 text-[#A68B6B]/20" />
              <p className="font-mono text-xs uppercase tracking-widest">DRAG PHOTOS FROM SELECTOR TO ARRANGE BOARD</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL PHOTO SELECTOR ==================== */}
      <AnimatePresence>
        {showPhotoSelector && (
          <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center p-4">
            <div className="bg-stone-950 border border-[#A68B6B]/25 rounded-3xl p-6 w-full max-w-lg relative max-h-[80vh] overflow-y-auto">
              <button
                onClick={() => setShowPhotoSelector(false)}
                className="absolute top-4 right-4 p-1.5 bg-stone-900 text-stone-400 hover:text-white rounded-full border border-[#A68B6B]/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-serif text-[#E6D7B8] font-bold mb-4">
                CHOOSE PHOTO TO MOUNT
              </h3>

              {photos.length === 0 ? (
                <p className="text-sm text-[#A68B6B]/50 font-mono py-8">Capture photos before pinning them.</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => addPhotoToScrapbook(photo.id)}
                      className="aspect-[5/6] rounded border border-black/15 shadow-md cursor-pointer hover:scale-105 hover:shadow-orange-500/15 transition-all overflow-hidden relative bg-[#120F0D]"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Memories Board Handbook Guide */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#FAF7F2] text-[#1C1814] rounded-2xl p-6 shadow-2xl border-4 border-[#A68B6B] flex flex-col"
            >
              <div className="border-b-2 border-dashed border-[#A68B6B]/60 pb-3 mb-4 text-center">
                <div className="inline-block px-3 py-0.5 bg-[#A68B6B] text-[#0E0B08] font-mono text-[9px] font-bold rounded uppercase tracking-wider mb-1">
                  TACTILE WORKSPACE HANDBOOK
                </div>
                <h3 className="text-2xl font-serif font-black tracking-tight text-[#2D261E]">
                  Memories Board Guide
                </h3>
              </div>

              {/* Graphic/Illustration representing Board Actions */}
              <div className="bg-[#1A1613] rounded-xl p-3 border border-[#A68B6B]/20 mb-4 text-[#E6D7B8]">
                <div className="flex justify-around items-center h-28 font-mono text-[10px]">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-14 bg-[#FAF7F2] border border-stone-400 rounded p-1 shadow-md text-stone-800 rotate-[-6deg] relative">
                      <div className="absolute top-[-4px] left-[16px] w-4 h-1.5 bg-amber-500/50"></div>
                      <div className="w-full h-8 bg-stone-300"></div>
                      <div className="text-[6px] text-center mt-1">DRAG</div>
                    </div>
                    <span className="mt-2 text-[#A68B6B]">1. Drag to Place</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-14 bg-[#FAF7F2] border border-stone-400 rounded p-1 shadow-md text-stone-800 rotate-[4deg] relative flex flex-col justify-between">
                      <div className="absolute top-[-4px] left-[16px] w-4 h-1.5 bg-teal-500/50"></div>
                      <div className="w-full h-8 bg-stone-300"></div>
                      <div className="text-[5px] text-center text-amber-600 bg-stone-900 px-1 rounded">ROT ↻</div>
                    </div>
                    <span className="mt-2 text-[#A68B6B]">2. Click ↻ icon</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-14 bg-[#FAF7F2] border border-stone-400 rounded p-1 shadow-md text-stone-800 rotate-0 relative flex flex-col justify-between opacity-80">
                      <div className="absolute top-[-4px] left-[16px] w-4 h-1.5 bg-red-500/50"></div>
                      <div className="w-full h-8 bg-stone-400"></div>
                      <div className="text-[5px] text-center text-red-500 bg-stone-900 px-1 rounded">DEL ✕</div>
                    </div>
                    <span className="mt-2 text-[#A68B6B]">3. Click ✕ icon</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-stone-700 font-sans leading-relaxed text-left max-h-[220px] overflow-y-auto pr-1">
                <p>
                  Welcome to your premium <strong className="text-stone-900 font-semibold font-serif">Memories Board</strong>! Here you can curate and assemble your retro captures into physical bulletin compositions.
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong className="text-stone-900 font-semibold">Drag Cards</strong>: Click and drag any photo on the corkboard to rearrange it. Focused cards automatically bring themselves to the top layer.</li>
                  <li><strong className="text-stone-900 font-semibold">Tape Overlay</strong>: Each card gets mounted with a colored, semi-translucent physical piece of tape.</li>
                  <li><strong className="text-stone-900 font-semibold font-serif">Rotate Cards</strong>: Hover over any card on the board and click the <strong className="text-amber-600">Rotate (↻)</strong> icon at the bottom right to spin the angle.</li>
                  <li><strong className="text-stone-900 font-semibold">Remove Cards</strong>: Click the <strong className="text-red-600">Trash (✕)</strong> icon to remove cards from the corkboard (keeps them safe in your Album).</li>
                  <li><strong className="text-stone-900 font-semibold">Save Layout</strong>: Click the golden <strong className="text-stone-900 font-bold">Save Layout</strong> button at the top to secure your bulletin design across sessions!</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  playButtonClick();
                  setShowHelp(false);
                }}
                className="mt-5 w-full py-2.5 bg-[#382313] hover:bg-[#54371E] text-[#FAF7F2] font-mono text-xs font-bold rounded-xl transition-colors shadow-lg cursor-pointer text-center"
              >
                DISMISS GUIDE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
