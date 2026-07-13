export interface AISettings {
  aperture: string;
  shutter: string;
  iso: string;
  lens: string;
}

export interface Photo {
  id: string;
  url: string; // Captured image data URI (processed canvas with filter)
  rawUrl: string; // Unprocessed raw captured frame
  timestamp: number;
  dateStr: string;
  isFavorite: boolean;
  
  // AI-generated narrative & metadata
  title: string;
  scene: string;
  composition: string;
  caption: string;
  location: string;
  weather: string;
  suggestedFilter: string;
  settings: AISettings;
  frameStyle?: "POLAROID" | "BOUNTY";
}

export type CameraMode = 'SINGLE' | 'MULTI' | 'COLLAGE' | 'VINTAGE';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  sepia: number;
  grayscale: number;
  contrast: number;
  brightness: number;
  saturate: number;
  hueRotate: number;
  blur: number;
  vignette: number;
  grain: number;
  lightLeak: number; // 0 to 1 intensity
  colorTemp: number; // custom tinting temperature
  textColor: string;
}

export interface ScrapbookItem {
  id: string;
  photoId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
  noteText?: string;
  tapeColor?: string;
}
