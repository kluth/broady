import { Injectable, signal, computed, effect } from '@angular/core';
import {
  StreamingDestination,
  StreamingState,
  StreamingProtocol,
  StreamingPlatform,
  VideoEncoder,
  AudioEncoder
} from '../models/streaming.model';

@Injectable({
  providedIn: 'root'
})
export class StreamingService {
  // Signals for reactive state
  private destinationsSignal = signal<StreamingDestination[]>([]);
  private streamingStateSignal = signal<StreamingState>({
    isStreaming: false,
    isRecording: false,
    droppedFrames: 0,
    totalFrames: 0,
    fps: 0,
    bitrate: 0,
    cpuUsage: 0,
    memoryUsage: 0
  });

  // Public readonly signals
  public readonly destinations = this.destinationsSignal.asReadonly();
  public readonly streamingState = this.streamingStateSignal.asReadonly();
  public readonly streamingState$ = this.streamingStateSignal.asReadonly(); // Alias for backwards compatibility
  public readonly isStreaming = computed(() => this.streamingStateSignal().isStreaming);
  public readonly enabledDestinations = computed(() =>
    this.destinationsSignal().filter(d => d.enabled)
  );

  private statsIntervalId: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private streamStartTime: number | null = null;

  constructor() {
    // Auto-cleanup on service destroy
    effect((onCleanup) => {
      onCleanup(() => {
        this.stopStatsCollection();
        if (this.mediaRecorder) {
          this.mediaRecorder.stop();
        }
      });
    });
  }

  /**
   * Add streaming destination
   */
  addDestination(destination: Omit<StreamingDestination, 'id'>): StreamingDestination {
    const newDestination: StreamingDestination = {
      ...destination,
      id: this.generateId()
    };

    this.destinationsSignal.update(destinations => [...destinations, newDestination]);
    return newDestination;
  }

  /**
   * Remove streaming destination
   */
  removeDestination(destinationId: string): void {
    this.destinationsSignal.update(destinations =>
      destinations.filter(d => d.id !== destinationId)
    );
  }

  /**
   * Update destination
   */
  updateDestination(
    destinationId: string,
    updates: Partial<StreamingDestination>
  ): void {
    this.destinationsSignal.update(destinations =>
      destinations.map(dest =>
        dest.id === destinationId ? { ...dest, ...updates } : dest
      )
    );
  }

  /**
   * Enable/disable destination
   */
  toggleDestination(destinationId: string, enabled: boolean): void {
    this.updateDestination(destinationId, { enabled });
  }

  /**
   * Start streaming to all enabled destinations
   */
  async startStreaming(): Promise<void> {
    const enabled = this.enabledDestinations();

    if (enabled.length === 0) {
      throw new Error('No streaming destinations enabled');
    }

    // Initialize streaming state
    this.streamingStateSignal.update(state => ({
      ...state,
      isStreaming: true,
      streamStartTime: new Date(),
      totalFrames: 0,
      droppedFrames: 0
    }));

    this.streamStartTime = Date.now();
    this.startStatsCollection();

    // In a real implementation, this would set up WebRTC/RTMP connections
    // For now, we simulate streaming to each destination
    for (const destination of enabled) {
      await this.connectToDestination(destination);
    }

    console.log(`Started streaming to ${enabled.length} destination(s)`);
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<void> {
    this.streamingStateSignal.update(state => ({
      ...state,
      isStreaming: false,
      streamStartTime: undefined
    }));

    this.stopStatsCollection();
    this.streamStartTime = null;

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    console.log('Stopped streaming');
  }

  /**
   * Connect to a streaming destination
   */
  private async connectToDestination(
    destination: StreamingDestination
  ): Promise<void> {
    console.log(`Connecting to ${destination.name} via ${destination.protocol}`);
    console.log(`Stream URL: ${destination.url}`);

    // In production, implement actual streaming:
    // - RTMP: Use WebRTC to RTMP bridge or server-side FFmpeg
    // - WebRTC: Use RTCPeerConnection
    // - HLS: Use MediaRecorder + chunked upload
    // - SRT: Use WebTransport or WebSocket proxy

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Connected to ${destination.name}`);
        resolve();
      }, 1000);
    });
  }

  /**
   * Start collecting streaming statistics
   */
  private startStatsCollection(): void {
    this.statsIntervalId = window.setInterval(() => {
      const now = Date.now();
      const elapsed = this.streamStartTime ? (now - this.streamStartTime) / 1000 : 0;

      this.streamingStateSignal.update(state => {
        // Simulate realistic streaming stats
        const targetFps = 60;
        const actualFrames = state.totalFrames + targetFps;
        const dropped = Math.random() > 0.95 ? Math.floor(Math.random() * 3) : 0;

        return {
          ...state,
          totalFrames: actualFrames,
          droppedFrames: state.droppedFrames + dropped,
          fps: targetFps - (dropped > 0 ? Math.random() * 2 : 0),
          bitrate: 2500 + Math.random() * 500 - 250, // 2250-2750 kbps
          cpuUsage: 30 + Math.random() * 20, // 30-50%
          memoryUsage: 500 + Math.random() * 100 // 500-600 MB
        };
      });
    }, 1000);
  }

  /**
   * Stop collecting statistics
   */
  private stopStatsCollection(): void {
    if (this.statsIntervalId !== null) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  }

  /**
   * Get streaming uptime in seconds
   */
  getUptime(): number {
    if (!this.streamStartTime) return 0;
    return Math.floor((Date.now() - this.streamStartTime) / 1000);
  }

  /**
   * Get drop percentage
   */
  getDropPercentage(): number {
    const state = this.streamingStateSignal();
    if (state.totalFrames === 0) return 0;
    return (state.droppedFrames / state.totalFrames) * 100;
  }

  /**
   * Create a quick streaming preset for common platforms
   */
  createPresetForPlatform(platform: StreamingPlatform): Partial<StreamingDestination> {
    const presets: Record<StreamingPlatform, Partial<StreamingDestination>> = {
      [StreamingPlatform.TWITCH]: {
        platform: StreamingPlatform.TWITCH,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://live.twitch.tv/app/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 6000,
          audioBitrate: 160,
          resolution: { width: 1920, height: 1080 },
          fps: 60,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'high',
          tune: 'zerolatency'
        }
      },
      [StreamingPlatform.YOUTUBE]: {
        platform: StreamingPlatform.YOUTUBE,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://a.rtmp.youtube.com/live2/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 9000,
          audioBitrate: 160,
          resolution: { width: 1920, height: 1080 },
          fps: 60,
          keyframeInterval: 2,
          preset: 'medium',
          profile: 'high',
          tune: 'film'
        }
      },
      [StreamingPlatform.FACEBOOK]: {
        platform: StreamingPlatform.FACEBOOK,
        protocol: StreamingProtocol.RTMPS,
        url: 'rtmps://live-api-s.facebook.com:443/rtmp/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 4000,
          audioBitrate: 128,
          resolution: { width: 1280, height: 720 },
          fps: 30,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'main',
          tune: 'zerolatency'
        }
      },
      [StreamingPlatform.TIKTOK]: {
        platform: StreamingPlatform.TIKTOK,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://live.tiktok.com/live/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 3000,
          audioBitrate: 128,
          resolution: { width: 1080, height: 1920 },
          fps: 30,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'main',
          tune: 'zerolatency'
        }
      },
      [StreamingPlatform.TWITTER]: {
        platform: StreamingPlatform.TWITTER,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://live.twitter.com/live/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 2500,
          audioBitrate: 128,
          resolution: { width: 1280, height: 720 },
          fps: 30,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'main',
          tune: 'zerolatency'
        }
      },
      [StreamingPlatform.LINKEDIN]: {
        platform: StreamingPlatform.LINKEDIN,
        protocol: StreamingProtocol.RTMP,
        url: 'rtmp://live.linkedin.com/live/',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 3000,
          audioBitrate: 128,
          resolution: { width: 1280, height: 720 },
          fps: 30,
          keyframeInterval: 2,
          preset: 'medium',
          profile: 'main',
          tune: 'film'
        }
      },
      [StreamingPlatform.CUSTOM]: {
        platform: StreamingPlatform.CUSTOM,
        protocol: StreamingProtocol.RTMP,
        url: '',
        settings: {
          videoEncoder: VideoEncoder.X264,
          audioEncoder: AudioEncoder.AAC,
          videoBitrate: 2500,
          audioBitrate: 128,
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          keyframeInterval: 2,
          preset: 'veryfast',
          profile: 'main',
          tune: 'zerolatency'
        }
      }
    };

    return presets[platform];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
