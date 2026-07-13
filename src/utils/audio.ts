// Custom synthesized sound effects for RetroCam AI using Web Audio API
// This avoids relying on external asset URLs which can fail or lag.

let isMuted = false;

export function setMuted(mute: boolean) {
  isMuted = mute;
}

export function getMuted() {
  return isMuted;
}

function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
}

// 1. Tactile Button Click (Springy physical press)
export function playButtonClick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

// 2. Rotary Dial / Knob Tick
export function playDialTick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.02);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.02);
}

// 3. Vintage Mechanical Shutter Click (Quick spring release + metal slap)
export function playShutterSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Metal Snap Noise (High frequency bandpassed white noise)
  const bufferSize = ctx.sampleRate * 0.15; // 0.15 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);
  filter.Q.setValueAtTime(5, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  // Mechanical thump (low frequency sweep)
  const lowOsc = ctx.createOscillator();
  const lowGain = ctx.createGain();
  lowOsc.type = "triangle";
  lowOsc.frequency.setValueAtTime(80, now);
  lowOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

  lowGain.gain.setValueAtTime(0.6, now);
  lowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  lowOsc.connect(lowGain);
  lowGain.connect(ctx.destination);

  noiseNode.start(now);
  lowOsc.start(now);

  noiseNode.stop(now + 0.15);
  lowOsc.stop(now + 0.15);
}

// 4. Polaroid Film Ejection/Winding Motor (Continuous mechanical motor whirr)
export function playFilmEjectSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 1.8; // 1.8 seconds eject duration

  // Low frequency motor oscillator (sawtooth)
  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(95, now);
  
  // High frequency gear oscillator
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(190, now);

  // Apply subtle modulation (motor vibration)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 16; // 16Hz vibration
  lfoGain.gain.value = 4; // freq shift depth
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);

  // Filter out excessive high-end for vintage muffled motor sound
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(450, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.1); // fade in
  gain.gain.setValueAtTime(0.3, now + duration - 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // fade out

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  lfo.start(now);
  osc1.start(now);
  osc2.start(now);

  lfo.stop(now + duration);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

// 5. Flash Tube Charging Whine (High frequency capacitor pitch climb)
export function playFlashChargeSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 1.2;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(6000, now + duration);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// 6. Focus Ring Mechanical Slide
export function playFocusSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.linearRampToValueAtTime(140, now + 0.15);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}
