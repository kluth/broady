import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RecordingSettings,
  RecordingFormat,
  ReplayBuffer,
  VideoEncoder,
  AudioEncoder
} from '../models/streaming.model';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  private isRecordingSubject = new BehaviorSubject<boolean>(false);
  private recordingSettingsSubject = new BehaviorSubject<RecordingSettings>({
    format: RecordingFormat.MP4,
    path: './recordings',
    filename: 'recording-%YYYY%-%MM%-%DD%-%hh%-%mm%-%ss%',
    videoEncoder: VideoEncoder.X264,
    audioEncoder: AudioEncoder.AAC,
    videoBitrate: 40000,
    audioBitrate: 160,
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    multitrack: false,
    tracks: []
  });
  private replayBufferSubject = new BehaviorSubject<ReplayBuffer>({
    enabled: false,
    duration: 30
  });
  private currentRecordingPathSubject = new BehaviorSubject<string | null>(null);

  public readonly isRecording$ = this.isRecordingSubject.asObservable();
  public readonly recordingSettings$ = this.recordingSettingsSubject.asObservable();
  public readonly replayBuffer$ = this.replayBufferSubject.asObservable();
  public readonly currentRecordingPath$ = this.currentRecordingPathSubject.asObservable();

  constructor() {}

  /**
   * Start recording
   */
  async startRecording(): Promise<string> {
    if (this.isRecordingSubject.value) {
      throw new Error('Already recording');
    }

    const settings = this.recordingSettingsSubject.value;
    const filename = this.generateFilename(settings.filename);
    const fullPath = `${settings.path}/${filename}.${settings.format}`;

    // In a real implementation, this would start actual video/audio encoding
    this.isRecordingSubject.next(true);
    this.currentRecordingPathSubject.next(fullPath);

    console.log(`Started recording to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecordingSubject.value) {
      throw new Error('Not currently recording');
    }

    const recordingPath = this.currentRecordingPathSubject.value;

    this.isRecordingSubject.next(false);
    this.currentRecordingPathSubject.next(null);

    console.log(`Stopped recording: ${recordingPath}`);
    return recordingPath;
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    console.log('Recording paused');
    // Implementation for pause functionality
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    console.log('Recording resumed');
    // Implementation for resume functionality
  }

  /**
   * Update recording settings
   */
  updateSettings(settings: Partial<RecordingSettings>): void {
    const currentSettings = this.recordingSettingsSubject.value;
    this.recordingSettingsSubject.next({
      ...currentSettings,
      ...settings
    });
  }

  /**
   * Enable replay buffer
   */
  enableReplayBuffer(duration: number): void {
    this.replayBufferSubject.next({
      enabled: true,
      duration
    });
    console.log(`Replay buffer enabled: ${duration} seconds`);
  }

  /**
   * Disable replay buffer
   */
  disableReplayBuffer(): void {
    this.replayBufferSubject.next({
      enabled: false,
      duration: 0
    });
    console.log('Replay buffer disabled');
  }

  /**
   * Save replay buffer
   */
  async saveReplayBuffer(): Promise<string> {
    const replayBuffer = this.replayBufferSubject.value;

    if (!replayBuffer.enabled) {
      throw new Error('Replay buffer is not enabled');
    }

    const settings = this.recordingSettingsSubject.value;
    const filename = `replay-${this.generateFilename(settings.filename)}`;
    const fullPath = `${settings.path}/${filename}.${settings.format}`;

    console.log(`Saved replay buffer to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Generate filename from template
   */
  private generateFilename(template: string): string {
    const now = new Date();

    return template
      .replace('%YYYY%', now.getFullYear().toString())
      .replace('%MM%', (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace('%DD%', now.getDate().toString().padStart(2, '0'))
      .replace('%hh%', now.getHours().toString().padStart(2, '0'))
      .replace('%mm%', now.getMinutes().toString().padStart(2, '0'))
      .replace('%ss%', now.getSeconds().toString().padStart(2, '0'));
  }

  /**
   * Split recording into chunks
   */
  async splitRecording(): Promise<void> {
    if (!this.isRecordingSubject.value) {
      throw new Error('Not currently recording');
    }

    const currentPath = this.currentRecordingPathSubject.value;
    console.log(`Splitting recording at: ${currentPath}`);

    // Stop current recording and start new one
    await this.stopRecording();
    await this.startRecording();
  }
}
