import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import {
  AudioDevice,
  AudioDeviceType,
  AudioMixer,
  AudioTrackMixer,
  AudioFilter,
  MonitoringType,
  AudioMetering,
} from '../models/audio.model';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private inputDevicesSubject = new BehaviorSubject<AudioDevice[]>([]);
  private outputDevicesSubject = new BehaviorSubject<AudioDevice[]>([]);
  private activeInputDeviceSubject = new BehaviorSubject<AudioDevice | null>(
    null
  );
  private activeOutputDeviceSubject = new BehaviorSubject<AudioDevice | null>(
    null
  );
  private mixerSubject = new BehaviorSubject<AudioMixer | null>(null);
  private meteringData = new Map<string, BehaviorSubject<AudioMetering>>();

  public readonly inputDevices$ = this.inputDevicesSubject.asObservable();
  public readonly outputDevices$ = this.outputDevicesSubject.asObservable();
  public readonly activeInputDevice$ =
    this.activeInputDeviceSubject.asObservable();
  public readonly activeOutputDevice$ =
    this.activeOutputDeviceSubject.asObservable();
  public readonly mixer$ = this.mixerSubject.asObservable();

  // Signal-based API for reactive components
  public readonly mixer = signal<AudioMixer | null>(null);

  constructor() {
    this.discoverDevices();
  }

  /**
   * Discover available audio devices
   */
  private async discoverDevices(): Promise<void> {
    try {
      // Request permission and enumerate devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputDevices: AudioDevice[] = [];
      const outputDevices: AudioDevice[] = [];

      devices.forEach((device) => {
        if (device.kind === 'audioinput') {
          inputDevices.push({
            id: device.deviceId,
            name: device.label || `Microphone ${inputDevices.length + 1}`,
            type: AudioDeviceType.INPUT,
            channels: 2,
            sampleRate: 48000,
          });
        } else if (device.kind === 'audiooutput') {
          outputDevices.push({
            id: device.deviceId,
            name: device.label || `Speaker ${outputDevices.length + 1}`,
            type: AudioDeviceType.OUTPUT,
            channels: 2,
            sampleRate: 48000,
          });
        }
      });

      this.inputDevicesSubject.next(inputDevices);
      this.outputDevicesSubject.next(outputDevices);

      // Set default devices
      if (inputDevices.length > 0) {
        this.activeInputDeviceSubject.next(inputDevices[0]);
      }
      if (outputDevices.length > 0) {
        this.activeOutputDeviceSubject.next(outputDevices[0]);
      }
    } catch (error) {
      console.error('Failed to discover audio devices:', error);
      // Provide mock devices for testing
      this.provideMockDevices();
    }
  }

  /**
   * Provide mock devices for testing
   */
  private provideMockDevices(): void {
    const mockInputDevices: AudioDevice[] = [
      {
        id: 'input-1',
        name: 'Default Microphone',
        type: AudioDeviceType.INPUT,
        channels: 2,
        sampleRate: 48000,
      },
      {
        id: 'input-2',
        name: 'USB Microphone',
        type: AudioDeviceType.INPUT,
        channels: 2,
        sampleRate: 48000,
      },
    ];

    const mockOutputDevices: AudioDevice[] = [
      {
        id: 'output-1',
        name: 'Default Speakers',
        type: AudioDeviceType.OUTPUT,
        channels: 2,
        sampleRate: 48000,
      },
      {
        id: 'output-2',
        name: 'Headphones',
        type: AudioDeviceType.OUTPUT,
        channels: 2,
        sampleRate: 48000,
      },
    ];

    this.inputDevicesSubject.next(mockInputDevices);
    this.outputDevicesSubject.next(mockOutputDevices);

    if (mockInputDevices.length > 0) {
      this.activeInputDeviceSubject.next(mockInputDevices[0]);
    }
    if (mockOutputDevices.length > 0) {
      this.activeOutputDeviceSubject.next(mockOutputDevices[0]);
    }
  }

  /**
   * Get input devices
   */
  getInputDevices(): Observable<AudioDevice[]> {
    return this.inputDevices$;
  }

  /**
   * Get output devices
   */
  getOutputDevices(): Observable<AudioDevice[]> {
    return this.outputDevices$;
  }

  /**
   * Select an input device
   */
  selectInputDevice(deviceId: string): void {
    const device = this.inputDevicesSubject.value.find(
      (d) => d.id === deviceId
    );
    if (device) {
      this.activeInputDeviceSubject.next(device);
    }
  }

  /**
   * Select an output device
   */
  selectOutputDevice(deviceId: string): void {
    const device = this.outputDevicesSubject.value.find(
      (d) => d.id === deviceId
    );
    if (device) {
      this.activeOutputDeviceSubject.next(device);
    }
  }

  /**
   * Initialize the audio mixer
   */
  initializeMixer(): void {
    const mixer: AudioMixer = {
      id: this.generateId(),
      name: 'Main Mixer',
      tracks: [],
      masterVolume: 1.0,
      masterMuted: false,
    };

    this.updateMixer(mixer);
  }

  /**
   * Create an audio track
   */
  createAudioTrack(name: string, sourceIds: string[]): AudioTrackMixer {
    const mixer = this.mixerSubject.value;
    if (!mixer) {
      throw new Error('Mixer not initialized');
    }

    const track: AudioTrackMixer = {
      id: this.generateId(),
      name,
      sourceIds,
      volume: 1.0,
      muted: false,
      solo: false,
      pan: 0,
      monitoring: MonitoringType.NONE,
      filters: [],
      metering: {
        peak: [0, 0],
        magnitude: [0, 0],
        inputPeak: [0, 0],
        inputMagnitude: [0, 0],
      },
    };

    const updatedMixer = {
      ...mixer,
      tracks: [...mixer.tracks, track],
    };

    this.updateMixer(updatedMixer);
    this.startMetering(track.id);

    return track;
  }

  /**
   * Delete an audio track
   */
  deleteAudioTrack(trackId: string): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedMixer = {
      ...mixer,
      tracks: mixer.tracks.filter((t) => t.id !== trackId),
    };

    this.updateMixer(updatedMixer);
    this.stopMetering(trackId);
  }

  /**
   * Set track volume
   */
  setTrackVolume(trackId: string, volume: number): void {
    this.updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Mute track
   */
  muteTrack(trackId: string): void {
    this.updateTrack(trackId, { muted: true });
  }

  /**
   * Unmute track
   */
  unmuteTrack(trackId: string): void {
    this.updateTrack(trackId, { muted: false });
  }

  /**
   * Solo track
   */
  soloTrack(trackId: string): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedTracks = mixer.tracks.map((track) => ({
      ...track,
      solo: track.id === trackId,
    }));

    this.updateMixer({
      ...mixer,
      tracks: updatedTracks,
    });
  }

  /**
   * Set track panning
   */
  setTrackPan(trackId: string, pan: number): void {
    this.updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) });
  }

  /**
   * Set track monitoring
   */
  setTrackMonitoring(trackId: string, monitoring: MonitoringType): void {
    this.updateTrack(trackId, { monitoring });
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    this.updateMixer({
      ...mixer,
      masterVolume: Math.max(0, Math.min(1, volume)),
    });
  }

  /**
   * Mute master
   */
  muteMaster(): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    this.updateMixer({
      ...mixer,
      masterMuted: true,
    });
  }

  /**
   * Unmute master
   */
  unmuteMaster(): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    this.updateMixer({
      ...mixer,
      masterMuted: false,
    });
  }

  /**
   * Add filter to track
   */
  addFilterToTrack(trackId: string, filter: AudioFilter): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedTracks = mixer.tracks.map((track) => {
      if (track.id === trackId) {
        return {
          ...track,
          filters: [...track.filters, filter],
        };
      }
      return track;
    });

    this.updateMixer({
      ...mixer,
      tracks: updatedTracks,
    });
  }

  /**
   * Remove filter from track
   */
  removeFilterFromTrack(trackId: string, filterId: string): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedTracks = mixer.tracks.map((track) => {
      if (track.id === trackId) {
        return {
          ...track,
          filters: track.filters.filter((f) => f.id !== filterId),
        };
      }
      return track;
    });

    this.updateMixer({
      ...mixer,
      tracks: updatedTracks,
    });
  }

  /**
   * Update filter settings
   */
  updateFilterSettings(trackId: string, filterId: string, settings: any): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedTracks = mixer.tracks.map((track) => {
      if (track.id === trackId) {
        return {
          ...track,
          filters: track.filters.map((filter) => {
            if (filter.id === filterId) {
              return {
                ...filter,
                settings: { ...filter.settings, ...settings },
              };
            }
            return filter;
          }),
        };
      }
      return track;
    });

    this.updateMixer({
      ...mixer,
      tracks: updatedTracks,
    });
  }

  /**
   * Get track metering data
   */
  getTrackMetering(trackId: string): Observable<AudioMetering> {
    if (!this.meteringData.has(trackId)) {
      this.startMetering(trackId);
    }

    return this.meteringData.get(trackId)!.asObservable();
  }

  /**
   * Start metering for a track
   */
  private startMetering(trackId: string): void {
    const meteringSubject = new BehaviorSubject<AudioMetering>({
      peak: [0, 0],
      magnitude: [0, 0],
      inputPeak: [0, 0],
      inputMagnitude: [0, 0],
    });

    this.meteringData.set(trackId, meteringSubject);

    // Simulate metering data updates
    interval(50).subscribe(() => {
      const mixer = this.mixerSubject.value;
      if (!mixer) return;

      const track = mixer.tracks.find((t) => t.id === trackId);
      if (!track) {
        this.stopMetering(trackId);
        return;
      }

      // Generate simulated metering data
      const metering: AudioMetering = {
        peak: [Math.random() * track.volume, Math.random() * track.volume],
        magnitude: [
          Math.random() * track.volume * 0.8,
          Math.random() * track.volume * 0.8,
        ],
        inputPeak: [Math.random(), Math.random()],
        inputMagnitude: [Math.random() * 0.8, Math.random() * 0.8],
      };

      meteringSubject.next(metering);
    });
  }

  /**
   * Stop metering for a track
   */
  private stopMetering(trackId: string): void {
    const subject = this.meteringData.get(trackId);
    if (subject) {
      subject.complete();
      this.meteringData.delete(trackId);
    }
  }

  /**
   * Update a track
   */
  private updateTrack(
    trackId: string,
    updates: Partial<AudioTrackMixer>
  ): void {
    const mixer = this.mixerSubject.value;
    if (!mixer) return;

    const updatedTracks = mixer.tracks.map((track) => {
      if (track.id === trackId) {
        return { ...track, ...updates };
      }
      return track;
    });

    this.updateMixer({
      ...mixer,
      tracks: updatedTracks,
    });
  }

  /**
   * Update mixer and sync signal
   */
  private updateMixer(mixer: AudioMixer | null): void {
    this.mixerSubject.next(mixer);
    this.mixer.set(mixer);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
