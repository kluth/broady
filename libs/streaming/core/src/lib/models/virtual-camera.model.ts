/**
 * Virtual Camera Models
 */

export interface VirtualCamera {
  enabled: boolean;
  name: string;
  resolution: { width: number; height: number };
  fps: number;
  format: VideoFormat;
}

export enum VideoFormat {
  I420 = 'i420',
  NV12 = 'nv12',
  YUY2 = 'yuy2',
  UYVY = 'uyvy',
  RGBA = 'rgba',
  BGRA = 'bgra'
}

export interface VirtualCameraState {
  isActive: boolean;
  connectedApplications: string[];
  frameCount: number;
  droppedFrames: number;
}
