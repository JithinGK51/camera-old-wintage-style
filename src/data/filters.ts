import { FilterPreset } from "../types";

export const FILM_PRESETS: FilterPreset[] = [
  {
    id: "classic_1970",
    name: "Classic 1970",
    description: "Warm, nostalgically saturated, faded highlights of early 70s film.",
    sepia: 45,
    grayscale: 0,
    contrast: 108,
    brightness: 98,
    saturate: 115,
    hueRotate: -8,
    blur: 0,
    vignette: 45,
    grain: 20,
    lightLeak: 0.1,
    colorTemp: 15, // warmer
    textColor: "#C8A97E"
  },
  {
    id: "kodak_gold",
    name: "Kodak Gold 200",
    description: "Vibrant yellow highlights, rich golden skin tones, and gentle retro grain.",
    sepia: 15,
    grayscale: 0,
    contrast: 120,
    brightness: 104,
    saturate: 128,
    hueRotate: 5,
    blur: 0,
    vignette: 30,
    grain: 22,
    lightLeak: 0.2,
    colorTemp: 20, // golden warmth
    textColor: "#D4AF37"
  },
  {
    id: "fuji_superia",
    name: "Fuji Superia 400",
    description: "Deep, velvety greens, cooler shadow tones, and crisp, nostalgic details.",
    sepia: 5,
    grayscale: 0,
    contrast: 115,
    brightness: 97,
    saturate: 112,
    hueRotate: -18, // shifts colors slightly green/cyan
    blur: 0,
    vignette: 35,
    grain: 16,
    lightLeak: 0.1,
    colorTemp: -12, // cooler cyan-green
    textColor: "#5F9EA0"
  },
  {
    id: "leica_monochrom",
    name: "Leica Monochrom",
    description: "Timeless black and white with dramatic shadows and deep silver tones.",
    sepia: 10, // slight warm silver tint
    grayscale: 100,
    contrast: 145,
    brightness: 93,
    saturate: 0,
    hueRotate: 0,
    blur: 0,
    vignette: 55,
    grain: 32,
    lightLeak: 0.05,
    colorTemp: 2,
    textColor: "#A0A0A0"
  },
  {
    id: "disposable",
    name: "Disposable Cam",
    description: "Heavy warm vignettes, random light leaks, dust particles, and organic lens blur.",
    sepia: 30,
    grayscale: 0,
    contrast: 110,
    brightness: 106,
    saturate: 122,
    hueRotate: 12,
    blur: 0.3, // slight analog lens soft focus
    vignette: 50,
    grain: 35,
    lightLeak: 0.75, // prominent leak
    colorTemp: 8,
    textColor: "#FF8C00"
  },
  {
    id: "damaged_film",
    name: "Faded Archive",
    description: "Severe light-leaks, high dust grain, weathered edges, and low-contrast sepia.",
    sepia: 75,
    grayscale: 10,
    contrast: 88,
    brightness: 95,
    saturate: 65,
    hueRotate: -5,
    blur: 0.5,
    vignette: 65,
    grain: 50,
    lightLeak: 0.9,
    colorTemp: 25, // heavy aging
    textColor: "#8B5A2B"
  }
];

export function getCSSFilterString(preset: FilterPreset): string {
  return `
    sepia(${preset.sepia}%)
    grayscale(${preset.grayscale}%)
    contrast(${preset.contrast}%)
    brightness(${preset.brightness}%)
    saturate(${preset.saturate}%)
    hue-rotate(${preset.hueRotate}deg)
    blur(${preset.blur}px)
  `.trim().replace(/\s+/g, ' ');
}
