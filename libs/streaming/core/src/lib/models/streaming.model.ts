/**
 * Streaming and Recording Models
 */

export enum StreamingProtocol {
  RTMP = 'rtmp',
  RTMPS = 'rtmps',
  SRT = 'srt',
  RIST = 'rist',
  HLS = 'hls',
  WebRTC = 'webrtc'
}

export enum StreamingPlatform {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  CUSTOM = 'custom'
}

export interface StreamingDestination {
  id: string;
  name: string;
  platform: StreamingPlatform;
  protocol: StreamingProtocol;
  url: string;
  streamKey: string;
  enabled: boolean;
  settings: StreamingSettings;
}

export interface StreamingSettings {
  videoEncoder: VideoEncoder;
  audioEncoder: AudioEncoder;
  videoBitrate: number; // kbps
  audioBitrate: number; // kbps
  resolution: { width: number; height: number };
  fps: number;
  keyframeInterval: number; // seconds
  preset: string;
  profile: string;
  tune: string;
}

export enum VideoEncoder {
  X264 = 'x264',
  X265 = 'x265',
  NVENC = 'nvenc',
  QSV = 'qsv',
  AMF = 'amf',
  APPLE_VT = 'apple_vt',
  AV1 = 'av1'
}

export enum AudioEncoder {
  AAC = 'aac',
  OPUS = 'opus',
  MP3 = 'mp3',
  FLAC = 'flac'
}

export interface StreamingState {
  isStreaming: boolean;
  isRecording: boolean;
  streamStartTime?: Date;
  recordingStartTime?: Date;
  droppedFrames: number;
  totalFrames: number;
  fps: number;
  bitrate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export enum RecordingFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  FLV = 'flv',
  MOV = 'mov',
  TS = 'ts'
}

export interface RecordingSettings {
  format: RecordingFormat;
  path: string;
  filename: string;
  videoEncoder: VideoEncoder;
  audioEncoder: AudioEncoder;
  videoBitrate: number;
  audioBitrate: number;
  resolution: { width: number; height: number };
  fps: number;
  multitrack: boolean;
  tracks: AudioTrack[];
}

export interface AudioTrack {
  id: string;
  name: string;
  sourceIds: string[];
}

export interface ReplayBuffer {
  enabled: boolean;
  duration: number; // seconds
  hotkey?: string;
}
