import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playFlashChargeSound, playShutterSound, playFilmEjectSound } from "../utils/audio";
import { Loader2, Zap, Shield, HelpCircle, Film } from "lucide-react";

interface SplashLoaderProps {
  onComplete: () => void;
}

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [readyToPowerOn, setReadyToPowerOn] = useState(false);

  const steps = [
    "Preparing Film Chamber...",
    "Calibrating Rotary Dial...",
    "Winding Shutter Springs...",
    "Charging Flash Capacitor (300V)...",
    "Powering Up Light Meter...",
    "RetroCam AI Ready"
  ];

  useEffect(() => {
    // Progress bar and loading steps simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReadyToPowerOn(true);
          return 100;
        }
        const addition = Math.floor(Math.random() * 15) + 5;
        const next = Math.min(100, prev + addition);
        
        // Match loading step to progress percentage
        const stepIdx = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        setLoadingStep(stepIdx);

        // Play sounds at specific progress thresholds
        if (prev < 20 && next >= 20) {
          playFilmEjectSound(); // Simulate film winding
        }
        if (prev < 60 && next >= 60) {
          playFlashChargeSound(); // Simulate flash charging whine
        }

        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handlePowerOn = () => {
    playShutterSound();
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div className="relative w-full h-screen bg-[#0E0B08] overflow-hidden flex flex-col items-center justify-center font-sans select-none z-50">
      {/* Background Vintage Noise overlay */}
      <div className="absolute inset-0 opacity-4 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] animate-pulse"></div>
      
      {/* Dynamic dust scratches overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, -10, 15, -5, 20, 0], 
            y: [0, 15, -10, 20, -5, 0],
            opacity: [0.1, 0.3, 0.15, 0.25, 0.1, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-[30px] border-dashed border-[#A68B6B]/10 mix-blend-color-dodge scale-110"
        />
      </div>

      {/* Main Container */}
      <div className="flex flex-col items-center max-w-md w-full px-8 text-center">
        {/* Top Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <div className="text-[#E6D7B8] font-mono tracking-[0.3em] text-xs uppercase font-semibold">RETRO MECHANICAL</div>
          <h1 className="text-4xl font-serif text-[#A68B6B] mt-2 tracking-wide font-bold select-none drop-shadow-md">
            RETROCAM AI
          </h1>
          <p className="text-xs text-[#A68B6B]/60 mt-2 font-mono">Analog Craft meets Gemini Intelligence</p>
        </motion.div>

        {/* 3D Floating Camera Vector Illustration */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 0.5, -0.5, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-72 h-48 flex items-center justify-center my-6"
        >
          {/* Subtle Backglow */}
          <div className="absolute w-48 h-48 bg-[#A68B6B]/10 rounded-full blur-3xl"></div>

          {/* Premium Vintage Camera SVG */}
          <svg viewBox="0 0 400 280" className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] filter saturate-90">
            {/* Main Metal Camera Chassis base */}
            <rect x="30" y="70" width="340" height="185" rx="20" fill="#1C1814" stroke="#2D261E" strokeWidth="3" />
            
            {/* Brushed Titanium top plate */}
            <path d="M30 90 L30 70 A 20 20 0 0 1 50 50 L350 50 A 20 20 0 0 1 370 70 L370 90 Z" fill="#423B33" stroke="#5C5144" strokeWidth="2" />
            
            {/* Leather Wrap texture plate */}
            <rect x="38" y="105" width="324" height="135" rx="8" fill="#120F0D" />
            
            {/* Metal Screws */}
            <circle cx="48" cy="62" r="3" fill="#8C7965" />
            <circle cx="352" cy="62" r="3" fill="#8C7965" />
            
            {/* Front leather grip panel stitching */}
            <rect x="42" y="109" width="316" height="127" rx="6" fill="none" stroke="#28221B" strokeWidth="1" strokeDasharray="3,3" />

            {/* Vintage Classic 35 Logo badge */}
            <rect x="60" y="118" width="80" height="24" rx="4" fill="#0A0908" stroke="#3D352C" strokeWidth="1" />
            <text x="100" y="134" fill="#E6D7B8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">CLASSIC 35</text>

            {/* Simulated viewfinder glass window */}
            <rect x="180" y="60" width="40" height="25" rx="3" fill="#1F2E35" stroke="#4C3F33" strokeWidth="2" />
            <rect x="185" y="64" width="30" height="17" rx="1" fill="#0D47A1" opacity="0.7" />
            <path d="M185 64 L210 81" stroke="#E3F2FD" strokeWidth="1" opacity="0.4" />

            {/* Vintage Rangefinder Window (Circular red dot sensor) */}
            <circle cx="245" cy="128" r="7" fill="#8D1818" stroke="#3C0B0B" strokeWidth="1" />

            {/* Flash unit (rectangular lens on top right) */}
            <rect x="290" y="58" width="55" height="30" rx="4" fill="#1C1814" stroke="#4C3F33" strokeWidth="2" />
            <rect x="295" y="63" width="45" height="20" rx="2" fill="#EAEAEA" />
            
            {/* Flash bulb grids */}
            <line x1="304" y1="63" x2="304" y2="83" stroke="#9E9E9E" strokeWidth="1" />
            <line x1="313" y1="63" x2="313" y2="83" stroke="#9E9E9E" strokeWidth="1" />
            <line x1="322" y1="63" x2="322" y2="83" stroke="#9E9E9E" strokeWidth="1" />
            <line x1="331" y1="63" x2="331" y2="83" stroke="#9E9E9E" strokeWidth="1" />
            
            {/* Flash Charging LED indicator */}
            <circle cx="355" cy="115" r="5" fill={progress >= 80 ? "#22C55E" : "#EAB308"} className={progress >= 80 ? "animate-ping" : "animate-pulse"} />
            <circle cx="355" cy="115" r="3.5" fill={progress >= 80 ? "#16A34A" : "#CA8A04"} />

            {/* Core Lens Outer barrel (Multiple metallic steps for 3D depth) */}
            <circle cx="200" cy="172" r="68" fill="#151210" stroke="#382E25" strokeWidth="5" />
            <circle cx="200" cy="172" r="55" fill="#2D251F" stroke="#1F1A15" strokeWidth="4" />
            <circle cx="200" cy="172" r="46" fill="#0D0A08" />

            {/* Focus Ring Ribs */}
            <circle cx="200" cy="172" r="51" fill="none" stroke="#5E4E3C" strokeWidth="2" strokeDasharray="4,6" />
            
            {/* Lens aperture details and reflection */}
            <circle cx="200" cy="172" r="35" fill="#04090D" />
            {/* Aperture blades blades */}
            <path d="M185 155 L215 155 L200 185 Z" fill="#1B1F22" opacity="0.8" />
            <path d="M175 180 L195 160 L210 190 Z" fill="#111517" opacity="0.8" />

            {/* Simulated Live Lens reflection overlays */}
            <ellipse cx="212" cy="162" rx="18" ry="8" fill="#38BDF8" opacity="0.15" transform="rotate(-30, 212, 162)" />
            <ellipse cx="186" cy="184" rx="8" ry="4" fill="#818CF8" opacity="0.25" transform="rotate(-30, 186, 184)" />
            
            {/* Lens Glass Glare curve */}
            <path d="M170 172 A 30 30 0 0 1 230 172" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.25" strokeDasharray="30,10" />

            {/* Brass vintage dials on the side */}
            <rect x="330" y="165" width="22" height="15" rx="3" fill="#A68B6B" stroke="#7A6348" strokeWidth="1.5" />
            <rect x="333" y="168" width="16" height="9" fill="#876F51" />

            {/* Mechanical Film Advance Lever (Top left) */}
            <path d="M40 50 L25 45 L35 38 L55 45 Z" fill="#5C5144" stroke="#2D261E" strokeWidth="1.5" />
            <circle cx="35" cy="45" r="4" fill="#A68B6B" />

            {/* High Premium Red Shutter button (Top left on flat surface) */}
            <path d="M85 50 L85 43 L105 43 L105 50 Z" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" />
            <ellipse cx="95" cy="43" rx="10" ry="3" fill="#EF4444" />
          </svg>
        </motion.div>

        {/* Info/Loading Console Area */}
        <div className="w-full bg-[#15110E] border border-[#A68B6B]/20 rounded-xl p-4 mt-4 relative drop-shadow-md">
          {/* Authentic ambient dust scratch indicators */}
          <div className="absolute top-2 right-2 flex items-center space-x-1.5 font-mono text-[9px] text-[#A68B6B]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A68B6B]/50 animate-pulse"></span>
            <span>AMB_LIGHT: OK</span>
          </div>

          <div className="text-left font-mono text-[11px] space-y-1">
            <div className="flex justify-between text-[#A68B6B]/50">
              <span>SYSTEM CHECKS:</span>
              <span className="text-[#E6D7B8]">ONLINE</span>
            </div>
            <div className="flex justify-between text-[#A68B6B]/50">
              <span>PROCESSOR:</span>
              <span className="text-[#E6D7B8]">GEMINI-3.5-FLASH</span>
            </div>
            <div className="flex justify-between text-[#A68B6B]/50">
              <span>ACTIVE STORAGE:</span>
              <span className="text-emerald-500">INDEXEDDB OK</span>
            </div>
            
            <div className="h-[1px] bg-[#A68B6B]/10 my-2"></div>
            
            <div className="flex items-center space-x-2 text-[#E6D7B8]">
              {!readyToPowerOn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A68B6B]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
              <span className="truncate">{steps[loadingStep]}</span>
            </div>
          </div>

          {/* Retro Progress Bar */}
          <div className="w-full bg-[#0E0B08] h-1.5 rounded-full overflow-hidden mt-3 p-[1px] border border-[#A68B6B]/10">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
              className="bg-gradient-to-r from-[#A68B6B] to-[#E6D7B8] h-full rounded-full"
            ></motion.div>
          </div>
        </div>

        {/* Big Tap to Power On Activation Button */}
        <div className="h-16 mt-6 flex items-center justify-center">
          <AnimatePresence>
            {readyToPowerOn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePowerOn}
                className="px-8 py-3 bg-gradient-to-r from-[#A68B6B] to-[#E6D7B8] text-[#0E0B08] font-mono text-sm uppercase tracking-widest font-bold rounded-lg border border-[#FFFFFF]/25 hover:shadow-[0_0_20px_rgba(166,139,107,0.4)] transition-all duration-300 flex items-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>POWER RETROCAM ON</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Humble vintage credit */}
        <div className="text-[10px] text-[#A68B6B]/30 font-mono mt-4 tracking-wider uppercase select-none">
          EST. 1982 • DIGITAL EMULATION
        </div>
      </div>
    </div>
  );
}
