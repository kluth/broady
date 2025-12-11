/**
 * Audio System Models
 */

export enum AudioDeviceType {
  INPUT = 'input',
  OUTPUT = 'output'
}

export interface AudioDevice {
  id: string;
  name: string;
  type: AudioDeviceType;
  channels: number;
  sampleRate: number;
}

export interface AudioMixer {
  id: string;
  name: string;
  tracks: AudioTrackMixer[];
  masterVolume: number;
  masterMuted: boolean;
}

export interface AudioTrackMixer {
  id: string;
  name: string;
  sourceIds: string[];
  volume: number; // 0-1
  muted: boolean;
  solo: boolean;
  pan: number; // -1 to 1
  monitoring: MonitoringType;
  filters: AudioFilter[];
  metering: AudioMetering;
}

export enum MonitoringType {
  NONE = 'none',
  MONITOR_ONLY = 'monitor_only',
  MONITOR_AND_OUTPUT = 'monitor_and_output'
}

export interface AudioFilter {
  id: string;
  name: string;
  type: AudioFilterType;
  enabled: boolean;
  settings: {
    [key: string]: any;
  };
}

export enum AudioFilterType {
  NOISE_SUPPRESSION = 'noise_suppression',
  NOISE_GATE = 'noise_gate',
  COMPRESSOR = 'compressor',
  LIMITER = 'limiter',
  EXPANDER = 'expander',
  GAIN = 'gain',
  EQ = 'eq',
  REVERB = 'reverb',
  DELAY = 'delay',
  VST = 'vst'
}

export interface AudioMetering {
  peak: number[];
  magnitude: number[];
  inputPeak: number[];
  inputMagnitude: number[];
}
