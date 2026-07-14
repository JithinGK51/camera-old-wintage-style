import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Photo, CameraMode, FilterPreset } from "../types";
import { FILM_PRESETS, getCSSFilterString } from "../data/filters";
import { renderPolaroidCard, renderMultiFilmStrip } from "../utils/renderer";
import { 
  playShutterSound, 
  playFilmEjectSound, 
  playFlashChargeSound, 
  playDialTick, 
  playButtonClick, 
  playFocusSound 
} from "../utils/audio";
import { 
  Camera, 
  RotateCw, 
  Zap, 
  ZapOff, 
  Volume2, 
  VolumeX, 
  Image as ImageIcon, 
  Sliders, 
  HelpCircle, 
  Sparkles,
  RefreshCw,
  Clock
} from "lucide-react";

interface VintageCameraViewProps {
  onPhotoCaptured: (photo: Photo) => void;
  lastCapturedPhoto: Photo | null;
  onOpenGallery: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VintageCameraView({
  onPhotoCaptured,
  lastCapturedPhoto,
  onOpenGallery,
  isMuted,
  onToggleMute
}: VintageCameraViewProps) {
  // Camera WebRTC States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Fallback simulator variables
  const canvasFallbackRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);

  // App / Control States
  const [flashOn, setFlashOn] = useState(true);
  const [flashFlash, setFlashFlash] = useState(false);
  const [flashCharging, setFlashCharging] = useState(false);
  const [flashReady, setFlashReady] = useState(true);
  
  const [activeMode, setActiveMode] = useState<CameraMode>("SINGLE");
  const [activeFilterIdx, setActiveFilterIdx] = useState(0);
  const activePreset = FILM_PRESETS[activeFilterIdx];

  // Manual Focus Simulation slider
  const [focusVal, setFocusVal] = useState(85); // 0 to 100
  const [exposureVal, setExposureVal] = useState(100); // 50 to 150

  // Multi-Photo sequence state
  const [multiFrames, setMultiFrames] = useState<string[]>([]);
  const [totalMultiNeeded, setTotalMultiNeeded] = useState(4);
  const [isMultiCapturing, setIsMultiCapturing] = useState(false);

  // New Frame Style & Interactive User Guide states
  const [activeFrameStyle, setActiveFrameStyle] = useState<"POLAROID" | "BOUNTY">("POLAROID");
  const [showGuide, setShowGuide] = useState(false);

  // System status messages
  const [statusLog, setStatusLog] = useState("Camera ready. Load 35mm film stock.");

  // WebRTC Camera Setup
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  // Handle stream binding once the video element is mounted and rendered in the DOM
  useEffect(() => {
    if (hasCamera && videoRef.current && streamRef.current) {
      try {
        if (videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch((e) => {
            console.warn("Failed to autoplay video stream on mount:", e);
          });
        }
      } catch (err) {
        console.error("Error setting video source object:", err);
      }
    }
  }, [hasCamera, videoRef.current, streamRef.current]);

  const startCamera = async () => {
    setCameraLoading(true);
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("First camera constraints failed, trying more permissive ones...", firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        } catch (secondErr) {
          console.warn("Second camera constraints failed, trying ultimate fallback...", secondErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      streamRef.current = stream;
      setHasCamera(true);
      setCameraLoading(false);
      setStatusLog("Sensors linked. Glass optics clear.");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => {
          console.warn("Play error in startCamera:", e);
        });
      }
    } catch (err) {
      console.warn("Camera access denied or completely unavailable on this system:", err);
      setHasCamera(false);
      setCameraLoading(false);
      startFallbackSimulator();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    playButtonClick();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Re-creates dynamic moving cinematic visual placeholders inside the circular lens
  // to serve as a stunning camera emulation if camera permissions fail.
  const startFallbackSimulator = () => {
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);

    let frame = 0;
    const canvas = canvasFallbackRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    fallbackIntervalRef.current = window.setInterval(() => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Draw rich visual scenery (Retro Sunset/Horizon)
      ctx.fillStyle = "#161311";
      ctx.fillRect(0, 0, w, h);

      // Warm vintage grid background
      ctx.strokeStyle = "rgba(166, 139, 107, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Golden horizon glowing sun
      const sunY = h / 2 + Math.sin(frame * 0.005) * 30;
      const grad = ctx.createRadialGradient(w/2, sunY, 5, w/2, sunY, 180);
      grad.addColorStop(0, "rgba(251, 146, 60, 0.5)");
      grad.addColorStop(0.3, "rgba(239, 68, 68, 0.25)");
      grad.addColorStop(0.8, "rgba(166, 139, 107, 0.02)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w/2, sunY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Moving retro wireframe mountains
      ctx.strokeStyle = "rgba(166, 139, 107, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 10) {
        const yVal = h/2 + Math.sin(x * 0.01 + frame * 0.02) * 25 + Math.cos(x * 0.03) * 10;
        if (x === 0) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
      }
      ctx.stroke();

      // Dynamic rule-of-thirds photography composition lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 0.5;
      // Verticals
      ctx.beginPath(); ctx.moveTo(w/3, 0); ctx.lineTo(w/3, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((w/3)*2, 0); ctx.lineTo((w/3)*2, h); ctx.stroke();
      // Horizontals
      ctx.beginPath(); ctx.moveTo(0, h/3); ctx.lineTo(w, h/3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (h/3)*2); ctx.lineTo(w, (h/3)*2); ctx.stroke();

      // Center circular crosshair focus indicator
      ctx.strokeStyle = "rgba(166, 139, 107, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w/2, h/2, 24, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = "rgba(166, 139, 107, 0.8)";
      ctx.fillRect(w/2 - 2, h/2 - 2, 4, 4);

      // Overlay dust specs
      if (frame % 15 === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }

      // Status text
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`EMU_FPS: 30 • SWEEP_FRAME_${frame}`, w/2, h - 25);
    }, 33);
    
    setStatusLog("No physical hardware found. Booted Retro Scenic Emulator.");
  };

  // Charge the physical camera flash bulb
  const triggerFlashRecharge = () => {
    if (!flashReady && !flashCharging) {
      setFlashCharging(true);
      playFlashChargeSound();
      setStatusLog("Recycling high-voltage flash capacitor...");
      setTimeout(() => {
        setFlashCharging(false);
        setFlashReady(true);
        setStatusLog("Capacitor peak charge (300V) ready.");
      }, 1200);
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;

    // Trigger flash if capacitor charged
    if (flashOn && flashReady) {
      setFlashFlash(true);
      setFlashReady(false);
      setTimeout(() => setFlashFlash(false), 150);
    }

    setIsCapturing(true);
    playShutterSound();
    setStatusLog("Exposing silver halide crystals...");

    // Capture from the appropriate active source
    const activeSource = hasCamera ? videoRef.current : canvasFallbackRef.current;
    if (!activeSource) {
      setIsCapturing(false);
      return;
    }

    try {
      // 1. Snapshot the raw square canvas frame
      const capCanvas = document.createElement("canvas");
      capCanvas.width = 640;
      capCanvas.height = 640;
      const capCtx = capCanvas.getContext("2d");
      
      if (capCtx) {
        if (hasCamera && activeSource instanceof HTMLVideoElement) {
          const size = Math.min(activeSource.videoWidth, activeSource.videoHeight);
          const sx = (activeSource.videoWidth - size) / 2;
          const sy = (activeSource.videoHeight - size) / 2;
          capCtx.drawImage(activeSource, sx, sy, size, size, 0, 0, 640, 640);
        } else if (activeSource instanceof HTMLCanvasElement) {
          capCtx.drawImage(activeSource, 0, 0, 640, 640);
        }
      }

      const rawUrl = capCanvas.toDataURL("image/jpeg", 0.9);

      // Handle SINGLE Photo Mode
      if (activeMode === "SINGLE" || activeMode === "VINTAGE") {
        // Build simulated Date String stamp (orange ink, e.g., '07 13 '26)
        const dateObj = new Date();
        const yy = String(dateObj.getFullYear()).slice(-2);
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `'${mm} ${dd} '${yy}`;

        // Create the base printed Polaroid Card immediately with client filters
        // Let's create a beautiful generic caption first, and then call our server-side API to enhance it with Gemini in the background!
        const initialCaption = "Retro Snapshot, '26";
        const polaroidUrl = await renderPolaroidCard(capCanvas, activePreset, initialCaption, dateStr, activeFrameStyle);

        const newPhoto: Photo = {
          id: Math.random().toString(36).substring(2, 11),
          url: polaroidUrl,
          rawUrl: rawUrl,
          timestamp: Date.now(),
          dateStr: dateStr,
          isFavorite: false,
          title: "Exposed Snapshot",
          scene: "An analog exposure waiting for development.",
          composition: "Nostalgic framing",
          caption: initialCaption,
          location: "Vintage Studio",
          weather: "Retro Ambient",
          suggestedFilter: activePreset.name,
          settings: {
            aperture: "f/2.8",
            shutter: "1/125s",
            iso: String(activePreset.grain * 10 + 100),
            lens: "Classic 35mm"
          },
          frameStyle: activeFrameStyle
        };

        // Complete local capture, play mechanical eject gears sound
        playFilmEjectSound();
        onPhotoCaptured(newPhoto);

        // TRIGGER BACKGROUND GEMINI ANALYSIS to enrich description & handwritten caption!
        setStatusLog("AI scanning silver composition...");
        triggerBackgroundGeminiEnhancement(newPhoto, rawUrl, dateStr);

      } else if (activeMode === "MULTI") {
        // Multi mode captures sequence of images
        const nextFrames = [...multiFrames, rawUrl];
        setMultiFrames(nextFrames);

        if (nextFrames.length < totalMultiNeeded) {
          setStatusLog(`Frame ${nextFrames.length}/${totalMultiNeeded} captured. Move to next scene.`);
          playFilmEjectSound();
          setIsCapturing(false);
        } else {
          // Finished all frames! Generate collage film-strip
          setStatusLog("Synthesizing multi-exposure film strip...");
          const collageUrl = await renderMultiFilmStrip(nextFrames, "RETRO STRIP");
          
          const dateObj = new Date();
          const yy = String(dateObj.getFullYear()).slice(-2);
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const dd = String(dateObj.getDate()).padStart(2, "0");
          const dateStr = `'${mm} ${dd} '${yy}`;

          const newPhoto: Photo = {
            id: Math.random().toString(36).substring(2, 11),
            url: collageUrl, // The full film strip
            rawUrl: rawUrl,
            timestamp: Date.now(),
            dateStr: dateStr,
            isFavorite: false,
            title: `${totalMultiNeeded}X Multi-Exposure Strip`,
            scene: "A beautifully synthesized horizontal sequence of retro exposures.",
            composition: "Sequence composition balancing timeline narratives.",
            caption: `Multi-Exposure, ${nextFrames.length} Frames`,
            location: "Studio Strip",
            weather: "Dynamic Contrast",
            suggestedFilter: activePreset.name,
            settings: {
              aperture: "f/4.0",
              shutter: "1/250s",
              iso: "400",
              lens: "Collage Strip"
            }
          };

          playFilmEjectSound();
          onPhotoCaptured(newPhoto);
          setMultiFrames([]); // Reset multi frames
        }
      }

    } catch (e: any) {
      console.error(e);
      setStatusLog("Exposure fault. Re-wind dial.");
    } finally {
      setIsCapturing(false);
      // Initiate charge for next flash
      if (flashOn) {
        setTimeout(() => triggerFlashRecharge(), 1500);
      }
    }
  };

  // Calls server-side Gemini route to get a professional, nostalgic, highly unique metadata packet
  // and handwritten Polaroid caption specifically tailored to the visual context of the image!
  const triggerBackgroundGeminiEnhancement = async (basePhoto: Photo, rawUrl: string, dateStr: string) => {
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: rawUrl,
          frameStyle: basePhoto.frameStyle
        })
      });

      if (!response.ok) {
        throw new Error("Gemini server proxy returned error status");
      }

      const geminiData = await response.json();
      
      // Load raw snapshot back onto canvas to draw the NEW caption provided by Gemini!
      const img = new Image();
      img.onload = async () => {
        const pStyle = basePhoto.frameStyle || "POLAROID";
        // Redraw Polaroid with new Gemini-curated caption
        const newPolaroidUrl = await renderPolaroidCard(img, activePreset, geminiData.caption, dateStr, pStyle);
        
        const enhancedPhoto: Photo = {
          ...basePhoto,
          url: newPolaroidUrl,
          title: geminiData.title,
          scene: geminiData.scene,
          composition: geminiData.composition,
          caption: geminiData.caption,
          location: geminiData.location,
          weather: geminiData.weather,
          suggestedFilter: geminiData.suggestedFilter,
          settings: geminiData.settings,
          frameStyle: pStyle
        };

        onPhotoCaptured(enhancedPhoto);
        setStatusLog(`Gemini Enhanced: "${geminiData.title}"`);
      };
      img.src = rawUrl;

    } catch (error) {
      console.warn("Gemini backdrop integration offline, utilizing offline-first vintage presets.", error);
      setStatusLog("Chemical development stable. View in album.");
    }
  };

  const handleFilterDialRotate = () => {
    const nextIdx = (activeFilterIdx + 1) % FILM_PRESETS.length;
    setActiveFilterIdx(nextIdx);
    playDialTick();
    setStatusLog(`Film stock: ${FILM_PRESETS[nextIdx].name}`);
  };

  const handleModeDialRotate = () => {
    playDialTick();
    setActiveMode((prev) => {
      const modes: CameraMode[] = ["SINGLE", "MULTI", "COLLAGE", "VINTAGE"];
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      setStatusLog(`Camera Mode: ${nextMode}`);
      return nextMode;
    });
  };

  const handleFocusSliderChange = (e: any) => {
    const val = parseInt(e.target.value);
    setFocusVal(val);
    if (val % 8 === 0) playFocusSound();
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-2 px-2 xs:px-4 max-w-lg mx-auto">
      {/* Visual background studio lighting */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#A68B6B]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Help / Blueprint Guide floating tab at top */}
      <div className="w-full flex justify-between items-center mb-3.5 px-1 z-10">
        <div className="flex items-center space-x-1.5 font-mono text-[9px] text-[#A68B6B]/80 uppercase tracking-wider bg-[#1C1814] px-2.5 py-1 rounded-full border border-[#A68B6B]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>EMULATOR v2.6</span>
        </div>
        <button
          onClick={() => {
            playButtonClick();
            setShowGuide(true);
          }}
          className="flex items-center space-x-1.5 px-3 py-1 bg-[#A68B6B] hover:bg-[#E6D7B8] text-[#0E0B08] font-mono text-[10px] font-bold rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>HELP &amp; MANUAL</span>
        </button>
      </div>

      {/* Dynamic Flash Whiteout Overlay */}
      <AnimatePresence>
        {flashFlash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none flex items-center justify-center"
          />
        )}
      </AnimatePresence>

      {/* Main Camera Outer Frame Body */}
      <div className="relative w-full h-auto min-h-[480px] xs:min-h-[510px] sm:aspect-[5/6] bg-gradient-to-b from-[#423B33] to-[#1C1814] rounded-[28px] shadow-[0_30px_70px_rgba(0,0,0,0.95)] border-4 border-[#5C5144]/60 p-4 xs:p-5 flex flex-col justify-between overflow-hidden">
        
        {/* Fine Leather-Grain Texture Wrap Plate overlay */}
        <div className="absolute inset-x-4 top-[105px] bottom-[110px] bg-[#120F0D] rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] opacity-95 border border-[#2D261E]/30">
          {/* Subtle grid pattern overlay for leather feel */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:3px_3px]"></div>
        </div>

        {/* ==================== 1. TOP BAR ==================== */}
        <div className="relative z-10 flex items-center justify-between w-full h-16 border-b border-[#2D261E]/40 pb-3">
          {/* Knurled Brass Mute toggle (screw knob styled) */}
          <button
            onClick={onToggleMute}
            className="group flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title={isMuted ? "Unmute Mechanical Sounds" : "Mute Mechanical Sounds"}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#A68B6B] via-[#D4AF37] to-[#876F51] p-[2px] shadow-lg border border-black/30 hover:rotate-12 transition-transform">
              <div className="w-full h-full rounded-full bg-[#1A1512] flex items-center justify-center">
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-amber-500/80" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#E6D7B8]" />
                )}
              </div>
            </div>
            <span className="text-[7px] font-mono text-[#A68B6B]/60 uppercase tracking-widest mt-1">SOUND</span>
          </button>

          {/* Large Viewfinder Window */}
          <div className="relative w-24 h-11 xs:w-28 xs:h-12 sm:w-32 sm:h-14 bg-gradient-to-b from-[#1C1814] to-[#0A0908] rounded-xl border-2 border-[#5C5144] p-1 shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
            {/* Viewfinder Glass Layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3A8A]/20 via-sky-500/10 to-transparent pointer-events-none"></div>
            
            {/* Extremely micro live crop of video inside viewfinder to simulate a real rangefinder optics! */}
            <div className="w-full h-full rounded-lg bg-[#04090D] overflow-hidden flex items-center justify-center opacity-80 border border-sky-900/40">
              {hasCamera ? (
                <video
                  ref={(el) => {
                    if (el) {
                      el.srcObject = streamRef.current;
                      if (streamRef.current) el.play().catch(() => {});
                    }
                  }}
                  muted
                  playsInline
                  className="w-full h-full object-cover grayscale scale-x-[-1] contrast-150 brightness-110"
                />
              ) : (
                <canvas
                  ref={(canvas) => {
                    // Small mirror canvas
                    if (canvas && canvasFallbackRef.current) {
                      const ctx = canvas.getContext("2d");
                      const draw = () => {
                        if (canvasFallbackRef.current && ctx) {
                          ctx.drawImage(canvasFallbackRef.current, 0, 0, canvas.width, canvas.height);
                        }
                        requestAnimationFrame(draw);
                      };
                      draw();
                    }
                  }}
                  width={100}
                  height={80}
                  className="w-full h-full object-cover sepia grayscale contrast-125 saturate-50"
                />
              )}
            </div>

            {/* Viewfinder crosshair lines */}
            <div className="absolute w-full h-[0.5px] bg-[#A68B6B]/25"></div>
            <div className="absolute h-full w-[0.5px] bg-[#A68B6B]/25"></div>
          </div>

          {/* Premium Flash Module Lever */}
          <button
            onClick={() => {
              playButtonClick();
              setFlashOn(!flashOn);
              setStatusLog(flashOn ? "Built-in Flash offline." : "Capacitor charging...");
              if (!flashOn) setTimeout(() => triggerFlashRecharge(), 200);
            }}
            className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title="Toggle Built-in Flash"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#A68B6B] via-[#FAF7F2] to-[#876F51] p-[2px] shadow-lg border border-black/30">
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${flashOn ? "bg-amber-500/20" : "bg-[#1A1512]"}`}>
                {flashOn ? (
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse fill-current" />
                ) : (
                  <ZapOff className="w-3.5 h-3.5 text-[#A68B6B]/40" />
                )}
              </div>
            </div>
            <span className="text-[7px] font-mono text-[#A68B6B]/60 uppercase tracking-widest mt-1">
              {flashOn ? "FLASH_ON" : "FLASH_OFF"}
            </span>
          </button>
        </div>

        {/* ==================== 2. MIDDLE CAMERA OPTICS (LENS) ==================== */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center my-4">
          
          {/* Flash Capacitor Status Lights (Amber-to-Green) */}
          <div className="absolute top-[-28px] right-2 xs:right-8 flex items-center space-x-2 font-mono text-[8px] text-[#A68B6B]/50 bg-black/40 px-2.5 py-1 rounded-full border border-[#A68B6B]/15">
            <span className="uppercase font-bold">CAP_CHG:</span>
            <div className="flex space-x-1">
              <span className={`w-2 h-2 rounded-full border border-black/30 ${flashOn ? (flashCharging ? "bg-amber-500 animate-ping" : "bg-emerald-500 shadow-[0_0_8px_#10B981]") : "bg-stone-800"}`}></span>
              <span className={`w-2 h-2 rounded-full border border-black/30 ${flashOn ? (flashReady ? "bg-emerald-500 shadow-[0_0_8px_#10B981]" : "bg-stone-800") : "bg-stone-800"}`}></span>
            </div>
          </div>

          {/* Dynamic Lens Exposure Meter */}
          <div className="absolute top-[-28px] left-2 xs:left-8 font-mono text-[8px] text-[#A68B6B]/50 bg-black/40 px-2.5 py-1 rounded-full border border-[#A68B6B]/15 uppercase">
            Film Stock: <span className="text-[#E6D7B8] font-bold">{activePreset.name}</span>
          </div>

          {/* Core Multi-layered circular vintage lens housing barrel */}
          <div className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-[#151210] to-[#2D251F] shadow-[0_15px_40px_rgba(0,0,0,0.85),inset_0_4px_12px_rgba(255,255,255,0.1)] border-8 border-[#382E25] flex items-center justify-center overflow-hidden">
            
            {/* outer knurled filter ring details */}
            <div className="absolute inset-2 rounded-full border-4 border-dashed border-[#1F1A15] opacity-60"></div>
            <div className="absolute inset-4 rounded-full border-2 border-[#1F1A15] bg-[#0D0A08] flex items-center justify-center">
              
              {/* Core Photographic Glass Viewport */}
              <div 
                className="relative w-36 h-36 xs:w-42 xs:h-42 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-[#3D352C] flex items-center justify-center bg-black"
                style={{
                  // Simulates manual zoom/focus lens tube barrel expansion
                  transform: `scale(${1 + (focusVal - 50) * 0.0008})`,
                  transition: "transform 0.15s ease-out"
                }}
              >
                {/* 1. Real Video Feed or Fallback Scenic Simulator */}
                <div className="absolute inset-0 w-full h-full select-none pointer-events-none rounded-full overflow-hidden">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-amber-500 font-mono text-xs z-10">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      <span>GLASS GLASS CLEARING...</span>
                    </div>
                  )}

                  {hasCamera ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      style={{
                        filter: `${getCSSFilterString(activePreset)} blur(${(100 - focusVal) * 0.04}px) brightness(${exposureVal}%)`,
                        transform: "scaleX(-1)" // Mirror view for natural selfies
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <canvas
                      ref={canvasFallbackRef}
                      width={280}
                      height={280}
                      style={{
                        filter: `${getCSSFilterString(activePreset)} blur(${(100 - focusVal) * 0.04}px) brightness(${exposureVal}%)`
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>

                {/* 2. Glass Lens Reflection glare layer overlay */}
                <div className="absolute inset-0 rounded-full pointer-events-none z-10 mix-blend-screen opacity-45 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_60%)]"></div>
                
                {/* 3. Deep cyan/blue antireflective lens chemical coating glare */}
                <div className="absolute inset-0 rounded-full pointer-events-none z-10 mix-blend-color-dodge opacity-20 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.8)_0%,rgba(99,102,241,0.1)_50%,transparent_100%)]"></div>

                {/* 4. Film Grain / Dirt lens overlay */}
                <div className="absolute inset-0 rounded-full pointer-events-none z-10 opacity-12 bg-[#FAF7F2] mix-blend-overlay">
                  <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px] animate-pulse"></div>
                </div>

                {/* 5. Center crosshair composition guidelines */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-4 h-[1px] bg-red-500/40"></div>
                  <div className="h-4 w-[1px] bg-red-500/40"></div>
                </div>

                {/* Multi capturing overlay indicators */}
                {isMultiCapturing && (
                  <div className="absolute inset-0 bg-red-900/10 border-4 border-dashed border-red-500/50 animate-pulse flex flex-col items-center justify-center z-20 text-white font-mono text-[10px] space-y-1">
                    <span className="font-bold bg-red-600 px-1.5 py-0.5 rounded uppercase">SEQ ACTIVE</span>
                    <span>SHOT {multiFrames.length + 1} OF {totalMultiNeeded}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 3. BOTTOM PANEL CONTROLS ==================== */}
        <div className="relative z-10 w-full flex items-center justify-between border-t border-[#2D261E]/40 pt-4 pb-1">
          
          {/* LEFT: Mini Polaroid Gallery Box (Shows last captured picture thumbnail) */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={onOpenGallery}
              className="relative w-12 h-14 bg-stone-900 border-2 border-[#5C5144] p-1 shadow-lg hover:shadow-[#A68B6B]/20 transition-all rounded transform hover:-rotate-3 active:scale-95 cursor-pointer flex items-center justify-center overflow-hidden group"
              title="Open Photo Gallery Album"
            >
              {lastCapturedPhoto ? (
                <div className="relative w-full h-full flex flex-col justify-between">
                  <img
                    src={lastCapturedPhoto.url}
                    alt="Latest thumbnail"
                    className="w-full h-10 object-cover rounded-sm grayscale contrast-125 saturate-50 brightness-95"
                  />
                  <div className="h-2 w-full bg-[#FAF7F2] rounded-b-[1px] flex items-center justify-center">
                    <div className="w-6 h-[2px] bg-stone-400 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-500 group-hover:text-[#A68B6B] transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[6px] font-mono mt-1 font-semibold">EMPTY</span>
                </div>
              )}
            </button>
            <span className="text-[7px] font-mono text-[#A68B6B]/60 uppercase tracking-widest mt-1">ALBUM</span>
          </div>

          {/* CENTER: BIG RED TACTILE MECHANICAL SHUTTER BUTTON */}
          <div className="flex flex-col items-center justify-center relative">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ y: 5, scale: 0.96 }}
              onClick={handleCapture}
              disabled={isCapturing}
              className={`w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-800 p-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] border-4 border-[#3D352C] cursor-pointer flex items-center justify-center transition-opacity ${isCapturing ? "opacity-60" : "opacity-100"}`}
              title="Expose Polaroid (Take Photo)"
            >
              {/* Shutter mechanical core */}
              <div className="w-full h-full rounded-full bg-gradient-to-t from-red-700 to-red-500 border border-red-800 flex items-center justify-center shadow-[inset_0_2px_6px_rgba(255,255,255,0.25)]">
                <div className="w-6 h-6 rounded-full bg-red-600 opacity-20 animate-pulse"></div>
              </div>
            </motion.button>
            <span className="text-[7px] font-mono text-[#A68B6B] font-bold uppercase tracking-[0.2em] mt-1.5 select-none animate-pulse">SHUTTER</span>
          </div>

          {/* RIGHT: Brass Film Stock Dial Knob */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={handleFilterDialRotate}
              className="group flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
              title="Rotate Film Stock Dial"
            >
              {/* Knurled brass gear casing */}
              <div 
                className="w-12 h-12 rounded-full bg-gradient-to-r from-[#A68B6B] via-[#E6D7B8] to-[#876F51] p-[3px] shadow-lg border border-black/30 transition-transform duration-300"
                style={{ transform: `rotate(${activeFilterIdx * 60}deg)` }}
              >
                {/* Dial Center */}
                <div className="w-full h-full rounded-full bg-[#120F0D] flex items-center justify-center border border-black/50 relative">
                  {/* Dial notches */}
                  <div className="absolute inset-1 rounded-full border-2 border-dashed border-[#A68B6B]/20"></div>
                  {/* Filter Color Dot */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-inner"
                    style={{ backgroundColor: activePreset.textColor }}
                  ></div>
                </div>
              </div>
            </button>
            <span className="text-[7px] font-mono text-[#A68B6B]/60 uppercase tracking-widest mt-1.5">FILM STOCK</span>
          </div>

          {/* FAR RIGHT: Camera Mode Dial Selector */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={handleModeDialRotate}
              className="group flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
              title="Rotate Mode Selector Knob"
            >
              <div 
                className="w-11 h-11 rounded-full bg-gradient-to-r from-stone-600 via-stone-400 to-stone-700 p-[3px] shadow-lg border border-black/30 transition-transform duration-300"
                style={{ transform: `rotate(${["SINGLE", "MULTI", "COLLAGE", "VINTAGE"].indexOf(activeMode) * 90}deg)` }}
              >
                <div className="w-full h-full rounded-full bg-[#1A1512] flex items-center justify-center border border-black/40 relative">
                  <div className="text-[8px] font-mono text-[#E6D7B8] font-bold">
                    {activeMode.slice(0, 3)}
                  </div>
                </div>
              </div>
            </button>
            <span className="text-[7px] font-mono text-[#A68B6B]/60 uppercase tracking-widest mt-1.5">MODE DIAL</span>
          </div>
        </div>

        {/* Mouth slot printing edge */}
        <div className="absolute inset-x-12 bottom-[-1px] h-[3px] bg-stone-900/90 rounded-t border-t border-black z-20"></div>
      </div>

      {/* ==================== 4. HARDWARE ADJUSTMENT SLIDERS ==================== */}
      <div className="w-full mt-6 bg-[#120F0D] border border-[#A68B6B]/25 rounded-2xl p-4 shadow-xl space-y-4">
        
        {/* Dynamic Log panel */}
        <div className="bg-black/60 rounded-lg py-1.5 px-3 border border-[#A68B6B]/10 flex items-center space-x-2 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[#E6D7B8]">{statusLog}</span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
          {/* Exposure Slider (Brightness) */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[9px] text-[#A68B6B]/60 uppercase font-bold">
              <span>EXPOSURE LOCK:</span>
              <span className="text-[#E6D7B8]">{exposureVal - 100 >= 0 ? `+${exposureVal - 100}` : exposureVal - 100}ev</span>
            </div>
            <input
              type="range"
              min="60"
              max="140"
              value={exposureVal}
              onChange={(e) => setExposureVal(parseInt(e.target.value))}
              className="w-full accent-[#A68B6B] bg-stone-900 h-1 rounded-full border-none cursor-pointer"
            />
          </div>

          {/* Focus Ring Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[9px] text-[#A68B6B]/60 uppercase font-bold">
              <span>FOCUS RING:</span>
              <span className="text-[#E6D7B8]">{focusVal === 100 ? "∞ (INFINITY)" : `${focusVal}mm`}</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={focusVal}
              onChange={handleFocusSliderChange}
              className="w-full accent-[#A68B6B] bg-stone-900 h-1 rounded-full border-none cursor-pointer"
            />
          </div>
        </div>

        {/* Sprocket Film Strip count indicator for Multi-mode */}
        {activeMode === "MULTI" && (
          <div className="bg-[#1C1814] p-3 rounded-xl border border-[#A68B6B]/15 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono text-[#E6D7B8] uppercase font-bold">SEQUENCE SIZE:</span>
              <span className="text-[9px] font-mono text-[#A68B6B]/50">Captures sequence into film-strip</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {[2, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    playButtonClick();
                    setTotalMultiNeeded(num);
                    setMultiFrames([]);
                  }}
                  className={`px-3 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${totalMultiNeeded === num ? "bg-[#A68B6B] text-[#0E0B08] border-[#A68B6B] font-bold" : "bg-stone-950 border-[#A68B6B]/20 text-[#A68B6B]"}`}
                >
                  {num}F
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Frame Design Selection Toggle */}
        <div className="bg-[#1C1814] p-3 rounded-xl border border-[#A68B6B]/15 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono text-[#E6D7B8] uppercase font-bold">FRAME DESIGN:</span>
            <span className="text-[9px] font-mono text-[#A68B6B]/50">Choose classic card or bounty poster</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                playButtonClick();
                setActiveFrameStyle("POLAROID");
                setStatusLog("Chamber loaded: Classic Polaroid Cards.");
              }}
              className={`px-3 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${activeFrameStyle === "POLAROID" ? "bg-[#A68B6B] text-[#0E0B08] border-[#A68B6B] font-bold" : "bg-stone-950 border-[#A68B6B]/20 text-[#A68B6B]"}`}
            >
              CLASSIC
            </button>
            <button
              onClick={() => {
                playButtonClick();
                setActiveFrameStyle("BOUNTY");
                setStatusLog("Chamber loaded: Luffy Bounty Poster design!");
              }}
              className={`px-3 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer ${activeFrameStyle === "BOUNTY" ? "bg-[#A68B6B] text-[#0E0B08] border-[#A68B6B] font-bold" : "bg-stone-950 border-[#A68B6B]/20 text-[#A68B6B]"}`}
            >
              🏴‍☠️ WANTED
            </button>
          </div>
        </div>

        {/* Fine preset film Stock information panel */}
        <div className="bg-[#1C1814] rounded-xl p-3 border border-[#A68B6B]/10 flex space-x-3 items-start">
          <div className="p-1.5 bg-black/40 rounded border border-[#A68B6B]/20 text-[#A68B6B]/80 font-serif font-bold text-xs">
            35mm
          </div>
          <div className="flex-1 space-y-0.5 text-left">
            <div className="text-xs font-serif font-bold text-[#E6D7B8]">{activePreset.name} stock simulation</div>
            <div className="text-[10px] text-[#A68B6B]/70 leading-relaxed font-sans">{activePreset.description}</div>
          </div>
        </div>
      </div>

      {/* Interactive Camera User Manual & Technical Blueprint Guide Overlay */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#FAF7F2] text-[#1C1814] rounded-2xl p-6 shadow-2xl border-4 border-[#A68B6B] my-8 flex flex-col"
            >
              {/* Header Title with blueprint styled decorative ribbon */}
              <div className="border-b-2 border-dashed border-[#A68B6B]/60 pb-3 mb-4 text-center">
                <div className="inline-block px-3 py-0.5 bg-[#A68B6B] text-[#0E0B08] font-mono text-[9px] font-bold rounded uppercase tracking-wider mb-1">
                  OFFICIAL INSTRUMENT MANUAL
                </div>
                <h3 className="text-2xl font-serif font-black tracking-tight text-[#2D261E]">
                  Vintage RetroCam Guide
                </h3>
                <p className="text-xs font-serif italic text-stone-500 mt-1">
                  Model No. PR-1972 • Silver Halide Simulation Engine
                </p>
              </div>

              {/* Retro Illustrated Camera Schematic Blueprint */}
              <div className="bg-[#1A1613] rounded-xl p-4 border border-[#A68B6B]/20 mb-4 text-center select-none text-[#E6D7B8] relative overflow-hidden">
                <div className="absolute top-1 left-1 text-[7px] font-mono text-[#A68B6B]/40 uppercase tracking-widest">Blueprint View v2.6</div>
                
                {/* CSS Retro Camera Mockup in Blueprint Style */}
                <div className="w-56 h-36 mx-auto bg-stone-900 rounded-xl border border-[#A68B6B]/30 relative flex flex-col justify-between p-2 shadow-inner mt-2">
                  
                  {/* Viewfinder */}
                  <div className="w-20 h-6 mx-auto bg-stone-950 border border-[#A68B6B]/20 rounded-md flex items-center justify-center text-[7px] font-mono text-cyan-400">
                    VIEWFINDER
                  </div>
                  
                  {/* Lens */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-stone-800 to-stone-950 border-4 border-[#A68B6B]/30 mx-auto flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full border border-[#A68B6B]/15 bg-black/80 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                    </div>
                  </div>

                  {/* Left Controls Indicator */}
                  <div className="absolute left-2 bottom-2.5 flex flex-col items-start text-[6.5px] font-mono text-[#A68B6B]">
                    <span>[🔈] SOUND</span>
                    <span>[⚡] FLASH</span>
                  </div>

                  {/* Right Controls Indicator */}
                  <div className="absolute right-2 bottom-2.5 flex flex-col items-end text-[6.5px] font-mono text-[#A68B6B]">
                    <span>[🔴] SHUTTER</span>
                    <span>[⚙️] FILMS</span>
                    <span>[🔄] MODES</span>
                  </div>
                </div>

                <div className="mt-2.5 text-[9px] font-mono font-bold text-amber-500 text-center uppercase tracking-wider">
                  ◄ HARDWARE CONTROL SCHEMATIC ►
                </div>
              </div>

              {/* Technical Schematic/Blueprint list */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-left scrollbar-thin">
                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold font-mono text-xs flex-shrink-0 shadow-inner">
                    R
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      1. Shutter Release Button (Big Red Button)
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Exposes the simulated silver halide film stock with a mechanical shutter snap. Automatically ejects and develops physical prints in the output slot.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[#1C1814] flex-shrink-0 shadow-sm">
                    <RotateCw className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      2. Film Stock Selector (Brass Center Dial)
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Rotate to swap between 6 professional retro presets: <strong className="text-stone-800 font-bold">Classic 1970</strong>, <strong className="text-stone-800 font-bold font-sans">Kodak Gold</strong>, <strong className="text-stone-800 font-bold font-sans">Fuji Superia</strong>, <strong className="text-stone-800 font-bold font-sans">Leica B&amp;W</strong>, <strong className="text-stone-800 font-bold font-sans">Disposable</strong>, or <strong className="text-stone-800 font-bold font-sans font-sans">Faded Archive</strong>. Swaps filters instantly!
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-stone-700 text-[#FAF7F2] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 shadow-sm">
                    M
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      3. Camera Mode Dial (Silver Dial)
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Selects the camera mode. <strong className="text-stone-800 font-bold font-sans">SINGLE</strong> prints individual cards. <strong className="text-stone-800 font-bold font-sans">MULTI</strong> takes a burst of 2, 4, or 6 frames and stitches them into a beautiful vertical film strip!
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C1814] text-[#FAF7F2] flex items-center justify-center font-serif font-bold text-xs flex-shrink-0 shadow-sm border border-stone-400">
                    🏴‍☠️
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      4. Frame Design Selector (New!)
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Choose between:
                      <br />• <strong className="text-stone-800 font-bold font-sans">CLASSIC</strong>: Standard white polaroid borders with ink clock timestamps.
                      <br />• <strong className="text-stone-800 font-bold font-sans">WANTED</strong>: The legendary <strong className="text-stone-800 font-bold font-sans">Luffy Bounty Poster</strong> style! Turns your photo into an authentic weathered Pirate Bounty Notice with vintage woodblock text, custom middle-dot name formats, and astronomical bounty numbers!
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center flex-shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      5. Focus Ring &amp; Exposure Lock Sliders
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Fine-tune manual elements: focus ring simulates physical lens optics by introducing radial focus blur, while exposure dial restricts or opens the light aperture level.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start border-b border-stone-200 pb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      6. Background AI Enhancements (Gemini Core)
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      When a photo is captured, a server-side Gemini scanner analyzes the visual elements of your frame. It replaces the default caption with a handwritten, contextual, poetic commentary and fills out detailed vintage EXIF data automatically!
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#EADBBF] text-[#382313] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    📌
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold font-serif text-[#3D352C]">
                      7. Scrapbook Board &amp; Photo Sticky Tape
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">
                      Go to the <strong className="text-stone-800 font-bold font-sans">Scrapbook</strong> tab to assemble your memories! Drag, scale, and rotate pictures. Double-click or tap any photo on the scrapbook board to write custom notes directly onto them, add colored sticky tapes, or push them forward!
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  playButtonClick();
                  setShowGuide(false);
                }}
                className="mt-6 w-full py-3 bg-[#382313] hover:bg-[#54371E] text-[#FAF7F2] font-mono text-xs font-bold rounded-xl transition-colors shadow-lg cursor-pointer text-center"
              >
                DISMISS &amp; RESUME SHOOTING
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
