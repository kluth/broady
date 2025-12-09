import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
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
  private destinationsSubject = new BehaviorSubject<StreamingDestination[]>([]);
  private streamingStateSubject = new BehaviorSubject<StreamingState>({
    isStreaming: false,
    isRecording: false,
    droppedFrames: 0,
    totalFrames: 0,
    fps: 0,
    bitrate: 0,
    cpuUsage: 0,
    memoryUsage: 0
  });

  public readonly destinations$ = this.destinationsSubject.asObservable();
  public readonly streamingState$ = this.streamingStateSubject.asObservable();
  public readonly isStreaming$ = this.streamingState$.pipe(
    map((state) => state.isStreaming)
  );

  private statsInterval: any;

  constructor() {}

  /**
   * Add streaming destination
   */
  addDestination(destination: Omit<StreamingDestination, 'id'>): StreamingDestination {
    const newDestination: StreamingDestination = {
      ...destination,
      id: this.generateId()
    };

    const destinations = [...this.destinationsSubject.value, newDestination];
    this.destinationsSubject.next(destinations);

    return newDestination;
  }

  /**
   * Remove streaming destination
   */
  removeDestination(destinationId: string): void {
    const destinations = this.destinationsSubject.value.filter(
      (d) => d.id !== destinationId
    );
    this.destinationsSubject.next(destinations);
  }

  /**
   * Update destination
   */
  updateDestination(
    destinationId: string,
    updates: Partial<StreamingDestination>
  ): void {
    const destinations = this.destinationsSubject.value.map((dest) => {
      if (dest.id === destinationId) {
        return { ...dest, ...updates };
      }
      return dest;
    });

    this.destinationsSubject.next(destinations);
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
    const enabledDestinations = this.destinationsSubject.value.filter(
      (d) => d.enabled
    );

    if (enabledDestinations.length === 0) {
      throw new Error('No streaming destinations enabled');
    }

    // Initialize streaming state
    const state = this.streamingStateSubject.value;
    this.streamingStateSubject.next({
      ...state,
      isStreaming: true,
      streamStartTime: new Date(),
      totalFrames: 0,
      droppedFrames: 0
    });

    // Start stats collection
    this.startStatsCollection();

    // Simulate streaming to each destination
    for (const destination of enabledDestinations) {
      await this.connectToDestination(destination);
    }
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<void> {
    const state = this.streamingStateSubject.value;
    this.streamingStateSubject.next({
      ...state,
      isStreaming: false,
      streamStartTime: undefined
    });

    this.stopStatsCollection();
  }

  /**
   * Connect to a streaming destination
   */
  private async connectToDestination(
    destination: StreamingDestination
  ): Promise<void> {
    console.log(`Connecting to ${destination.name} via ${destination.protocol}`);
    console.log(`Stream URL: ${destination.url}`);

    // In a real implementation, this would use WebRTC, RTMP, or other protocols
    // For now, we'll simulate the connection
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
    this.statsInterval = interval(1000).subscribe(() => {
      const state = this.streamingStateSubject.value;

      // Simulate streaming statistics
      this.streamingStateSubject.next({
        ...state,
        totalFrames: state.totalFrames + 60,
        droppedFrames: state.droppedFrames + Math.random() > 0.95 ? 1 : 0,
        fps: 60,
        bitrate: 2500 + Math.random() * 500,
        cpuUsage: 30 + Math.random() * 20,
        memoryUsage: 500 + Math.random() * 100
      });
    });
  }

  /**
   * Stop collecting statistics
   */
  private stopStatsCollection(): void {
    if (this.statsInterval) {
      this.statsInterval.unsubscribe();
      this.statsInterval = null;
    }
  }

  /**
   * Get streaming statistics
   */
  getStreamingStats(): Observable<StreamingState> {
    return this.streamingState$;
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

// Add missing import
import { map } from 'rxjs/operators';
