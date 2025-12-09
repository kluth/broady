/**
 * Base Source Types for OBS-style streaming
 */

export enum SourceType {
  VIDEO_CAPTURE = 'video_capture',
  SCREEN_CAPTURE = 'screen_capture',
  WINDOW_CAPTURE = 'window_capture',
  AUDIO_INPUT = 'audio_input',
  AUDIO_OUTPUT = 'audio_output',
  IMAGE = 'image',
  TEXT = 'text',
  BROWSER = 'browser',
  MEDIA = 'media',
  GAME_CAPTURE = 'game_capture',
  COLOR_SOURCE = 'color_source'
}

export interface SourceSettings {
  [key: string]: any;
}

export interface Transform {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  crop: { top: number; bottom: number; left: number; right: number };
  alignment: number;
  boundsType: 'none' | 'stretch' | 'scale' | 'crop';
  boundsAlignment: number;
  bounds: { x: number; y: number };
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  enabled: boolean;
  settings: SourceSettings;
  transform: Transform;
  filters: Filter[];
  volume: number; // 0-1
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface Filter {
  id: string;
  name: string;
  type: FilterType;
  enabled: boolean;
  settings: SourceSettings;
}

export enum FilterType {
  CHROMA_KEY = 'chroma_key',
  COLOR_CORRECTION = 'color_correction',
  COLOR_GRADE = 'color_grade',
  SHARPEN = 'sharpen',
  BLUR = 'blur',
  NOISE_SUPPRESSION = 'noise_suppression',
  NOISE_GATE = 'noise_gate',
  COMPRESSOR = 'compressor',
  GAIN = 'gain',
  LIMITER = 'limiter',
  EXPANDER = 'expander',
  VST = 'vst',
  LUT = 'lut',
  SCALING = 'scaling',
  SCROLL = 'scroll',
  RENDER_DELAY = 'render_delay',
  MASK = 'mask'
}
