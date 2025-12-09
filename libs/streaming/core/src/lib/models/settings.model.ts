/**
 * Application Settings Models
 */

export interface ApplicationSettings {
  general: GeneralSettings;
  video: VideoSettings;
  audio: AudioSettings;
  output: OutputSettings;
  hotkeys: HotkeySettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  confirmOnExit: boolean;
  showConfirmationOnStreamStop: boolean;
  snappingEnabled: boolean;
  screenSnapping: boolean;
  sourceSnapping: boolean;
  centerSnapping: boolean;
  snapDistance: number;
  recordWhenStreaming: boolean;
  keepRecordingWhenStreamStops: boolean;
  replayBufferWhileStreaming: boolean;
}

export interface VideoSettings {
  baseResolution: { width: number; height: number };
  outputResolution: { width: number; height: number };
  downscaleFilter: 'bilinear' | 'bicubic' | 'lanczos';
  fps: number;
  fpsType: 'common' | 'integer' | 'fractional';
  renderer: 'direct3d11' | 'opengl' | 'metal';
}

export interface AudioSettings {
  sampleRate: number; // 44100, 48000
  channels: 'mono' | 'stereo' | '2.1' | '4.0' | '4.1' | '5.1' | '7.1';
  desktopAudioDevice: string;
  desktopAudioDevice2?: string;
  micAudioDevice: string;
  micAudioDevice2?: string;
  micAudioDevice3?: string;
}

export interface OutputSettings {
  mode: 'simple' | 'advanced';
  streaming: StreamOutputSettings;
  recording: RecordOutputSettings;
  audio: AudioOutputSettings;
  replayBuffer: ReplayBufferSettings;
}

export interface StreamOutputSettings {
  videoBitrate: number;
  encoder: string;
  audioTrack: number;
  twitchVODTrack: boolean;
}

export interface RecordOutputSettings {
  type: 'standard' | 'custom';
  recordingPath: string;
  generateTimestamp: boolean;
  format: string;
  videoEncoder: string;
  audioEncoder: string;
  videoTracks: number;
  multitrackVideo: boolean;
}

export interface AudioOutputSettings {
  track1Bitrate: number;
  track1Name: string;
  track2Bitrate?: number;
  track2Name?: string;
  track3Bitrate?: number;
  track3Name?: string;
  track4Bitrate?: number;
  track4Name?: string;
  track5Bitrate?: number;
  track5Name?: string;
  track6Bitrate?: number;
  track6Name?: string;
}

export interface ReplayBufferSettings {
  enabled: boolean;
  duration: number;
  prefix: string;
  suffix: string;
}

export interface HotkeySettings {
  startStreaming?: Hotkey;
  stopStreaming?: Hotkey;
  startRecording?: Hotkey;
  stopRecording?: Hotkey;
  pauseRecording?: Hotkey;
  saveReplayBuffer?: Hotkey;
  toggleMute?: Hotkey;
  pushToMute?: Hotkey;
  pushToTalk?: Hotkey;
  studioMode?: Hotkey;
  screenshot?: Hotkey;
  [key: string]: Hotkey | undefined;
}

export interface Hotkey {
  key: string;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
}

export interface AdvancedSettings {
  processRenderPriority: 'normal' | 'high' | 'realtime';
  colorFormat: 'nv12' | 'i420' | 'i444' | 'rgb';
  colorSpace: '709' | '601' | 'srgb';
  colorRange: 'partial' | 'full';
  audioMonitoringDevice: string;
  disableWindowsAudioDucking: boolean;
  automaticReconnect: boolean;
  reconnectDelay: number;
  maxRetries: number;
  networkBuffering: boolean;
  bindToIP: string;
  enableNewNetworkCode: boolean;
  enableLowLatencyMode: boolean;
}
