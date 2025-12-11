import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationSettings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<ApplicationSettings>(
    this.getDefaultSettings()
  );

  public readonly settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): ApplicationSettings {
    return {
      general: {
        language: 'en',
        theme: 'dark',
        confirmOnExit: true,
        showConfirmationOnStreamStop: true,
        snappingEnabled: true,
        screenSnapping: true,
        sourceSnapping: true,
        centerSnapping: true,
        snapDistance: 10,
        recordWhenStreaming: false,
        keepRecordingWhenStreamStops: false,
        replayBufferWhileStreaming: false
      },
      video: {
        baseResolution: { width: 1920, height: 1080 },
        outputResolution: { width: 1920, height: 1080 },
        downscaleFilter: 'lanczos',
        fps: 60,
        fpsType: 'common',
        renderer: 'direct3d11'
      },
      audio: {
        sampleRate: 48000,
        channels: 'stereo',
        desktopAudioDevice: 'default',
        micAudioDevice: 'default'
      },
      output: {
        mode: 'simple',
        streaming: {
          videoBitrate: 2500,
          encoder: 'x264',
          audioTrack: 1,
          twitchVODTrack: false
        },
        recording: {
          type: 'standard',
          recordingPath: './recordings',
          generateTimestamp: true,
          format: 'mp4',
          videoEncoder: 'x264',
          audioEncoder: 'aac',
          videoTracks: 1,
          multitrackVideo: false
        },
        audio: {
          track1Bitrate: 160,
          track1Name: 'Track 1'
        },
        replayBuffer: {
          enabled: false,
          duration: 30,
          prefix: 'Replay',
          suffix: ''
        }
      },
      hotkeys: {},
      advanced: {
        processRenderPriority: 'normal',
        colorFormat: 'nv12',
        colorSpace: '709',
        colorRange: 'partial',
        audioMonitoringDevice: 'default',
        disableWindowsAudioDucking: true,
        automaticReconnect: true,
        reconnectDelay: 10,
        maxRetries: 20,
        networkBuffering: false,
        bindToIP: 'default',
        enableNewNetworkCode: true,
        enableLowLatencyMode: false
      }
    };
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('streaming-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.settingsSubject.next(settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    try {
      const settings = this.settingsSubject.value;
      localStorage.setItem('streaming-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<ApplicationSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = this.deepMerge(currentSettings, updates);
    this.settingsSubject.next(newSettings);
    this.saveSettings();
  }

  /**
   * Reset settings to default
   */
  resetSettings(): void {
    this.settingsSubject.next(this.getDefaultSettings());
    this.saveSettings();
  }

  /**
   * Export settings
   */
  exportSettings(): string {
    return JSON.stringify(this.settingsSubject.value, null, 2);
  }

  /**
   * Import settings
   */
  importSettings(settingsJson: string): boolean {
    try {
      const settings = JSON.parse(settingsJson);
      this.settingsSubject.next(settings);
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}
