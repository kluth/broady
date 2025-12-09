import { Injectable, signal, computed, effect } from '@angular/core';
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
  // Signals for reactive state
  private isRecordingSignal = signal<boolean>(false);
  private isPausedSignal = signal<boolean>(false);
  private recordingSettingsSignal = signal<RecordingSettings>({
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
  private replayBufferSignal = signal<ReplayBuffer>({
    enabled: false,
    duration: 30
  });
  private currentRecordingPathSignal = signal<string | null>(null);
  private recordingStartTimeSignal = signal<Date | null>(null);
  private recordedChunksSignal = signal<Blob[]>([]);

  // Public readonly signals
  public readonly isRecording = this.isRecordingSignal.asReadonly();
  public readonly isPaused = this.isPausedSignal.asReadonly();
  public readonly recordingSettings = this.recordingSettingsSignal.asReadonly();
  public readonly replayBuffer = this.replayBufferSignal.asReadonly();
  public readonly currentRecordingPath = this.currentRecordingPathSignal.asReadonly();
  public readonly recordingStartTime = this.recordingStartTimeSignal.asReadonly();

  // Computed signals
  public readonly recordingDuration = computed(() => {
    const startTime = this.recordingStartTimeSignal();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
  });

  public readonly formattedDuration = computed(() => {
    const duration = this.recordingDuration();
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private replayBufferData: Blob[] = [];
  private replayBufferInterval: number | null = null;

  constructor() {
    // Auto-cleanup
    effect((onCleanup) => {
      onCleanup(() => {
        this.cleanup();
      });
    });
  }

  /**
   * Start recording
   */
  async startRecording(stream?: MediaStream): Promise<string> {
    if (this.isRecordingSignal()) {
      throw new Error('Already recording');
    }

    // Get or use provided media stream
    this.mediaStream = stream || await this.getDisplayMedia();

    const settings = this.recordingSettingsSignal();
    const filename = this.generateFilename(settings.filename);
    const fullPath = `${settings.path}/${filename}.${settings.format}`;

    // Determine MIME type based on format
    const mimeType = this.getMimeType(settings.format);

    // Create MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: settings.videoBitrate * 1000,
      audioBitsPerSecond: settings.audioBitrate * 1000
    };

    this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    this.recordedChunksSignal.set([]);

    // Handle data available
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunksSignal.update(chunks => [...chunks, event.data]);

        // Update replay buffer if enabled
        if (this.replayBufferSignal().enabled) {
          this.updateReplayBuffer(event.data);
        }
      }
    };

    // Handle stop
    this.mediaRecorder.onstop = () => {
      this.finalizeRecording(fullPath);
    };

    // Start recording
    this.mediaRecorder.start(1000); // Capture in 1-second chunks

    this.isRecordingSignal.set(true);
    this.recordingStartTimeSignal.set(new Date());
    this.currentRecordingPathSignal.set(fullPath);

    console.log(`Started recording to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecordingSignal()) {
      throw new Error('Not currently recording');
    }

    const recordingPath = this.currentRecordingPathSignal();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.isRecordingSignal.set(false);
    this.isPausedSignal.set(false);
    this.recordingStartTimeSignal.set(null);

    console.log(`Stopped recording: ${recordingPath}`);
    return recordingPath;
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.isRecordingSignal()) {
      throw new Error('Not currently recording');
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPausedSignal.set(true);
      console.log('Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.isRecordingSignal()) {
      throw new Error('Not currently recording');
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPausedSignal.set(false);
      console.log('Recording resumed');
    }
  }

  /**
   * Update recording settings
   */
  updateSettings(settings: Partial<RecordingSettings>): void {
    this.recordingSettingsSignal.update(current => ({
      ...current,
      ...settings
    }));
  }

  /**
   * Enable replay buffer
   */
  enableReplayBuffer(duration: number): void {
    this.replayBufferSignal.set({
      enabled: true,
      duration
    });

    // Start buffer cleanup interval
    this.startReplayBufferCleanup();

    console.log(`Replay buffer enabled: ${duration} seconds`);
  }

  /**
   * Disable replay buffer
   */
  disableReplayBuffer(): void {
    this.replayBufferSignal.set({
      enabled: false,
      duration: 0
    });

    this.stopReplayBufferCleanup();
    this.replayBufferData = [];

    console.log('Replay buffer disabled');
  }

  /**
   * Save replay buffer
   */
  async saveReplayBuffer(): Promise<string> {
    const replayBuffer = this.replayBufferSignal();

    if (!replayBuffer.enabled) {
      throw new Error('Replay buffer is not enabled');
    }

    if (this.replayBufferData.length === 0) {
      throw new Error('Replay buffer is empty');
    }

    const settings = this.recordingSettingsSignal();
    const filename = `replay-${this.generateFilename(settings.filename)}`;
    const fullPath = `${settings.path}/${filename}.${settings.format}`;

    // Create blob from replay buffer
    const blob = new Blob(this.replayBufferData, {
      type: this.getMimeType(settings.format)
    });

    // Download the replay
    await this.downloadRecording(blob, `${filename}.${settings.format}`);

    console.log(`Saved replay buffer to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Split recording into chunks
   */
  async splitRecording(): Promise<void> {
    if (!this.isRecordingSignal()) {
      throw new Error('Not currently recording');
    }

    const currentPath = this.currentRecordingPathSignal();
    console.log(`Splitting recording at: ${currentPath}`);

    // Stop current recording and start new one
    await this.stopRecording();
    await this.startRecording(this.mediaStream!);
  }

  /**
   * Get display media stream
   */
  private async getDisplayMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: true
      });

      return stream;
    } catch (error) {
      console.error('Failed to get display media:', error);
      throw new Error('Failed to access screen/window capture');
    }
  }

  /**
   * Get MIME type for recording format
   */
  private getMimeType(format: RecordingFormat): string {
    const mimeTypes: Record<RecordingFormat, string> = {
      [RecordingFormat.MP4]: 'video/mp4',
      [RecordingFormat.MKV]: 'video/x-matroska',
      [RecordingFormat.FLV]: 'video/x-flv',
      [RecordingFormat.MOV]: 'video/quicktime',
      [RecordingFormat.TS]: 'video/mp2t'
    };

    // Fallback to WebM if format not supported
    const preferredType = mimeTypes[format];
    if (MediaRecorder.isTypeSupported(preferredType)) {
      return preferredType;
    }

    // Try WebM as fallback
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      console.warn(`Format ${format} not supported, using WebM VP9`);
      return 'video/webm;codecs=vp9';
    }

    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      console.warn(`Format ${format} not supported, using WebM VP8`);
      return 'video/webm;codecs=vp8';
    }

    console.warn(`Format ${format} not supported, using default`);
    return 'video/webm';
  }

  /**
   * Finalize recording and download
   */
  private async finalizeRecording(path: string): Promise<void> {
    const chunks = this.recordedChunksSignal();
    if (chunks.length === 0) {
      console.warn('No recorded data to save');
      return;
    }

    const settings = this.recordingSettingsSignal();
    const blob = new Blob(chunks, {
      type: this.getMimeType(settings.format)
    });

    // Download the recording
    const filename = path.split('/').pop() || 'recording';
    await this.downloadRecording(blob, filename);

    this.recordedChunksSignal.set([]);
    this.currentRecordingPathSignal.set(null);
  }

  /**
   * Download recording to user's computer
   */
  private async downloadRecording(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Update replay buffer
   */
  private updateReplayBuffer(chunk: Blob): void {
    this.replayBufferData.push(chunk);

    // Keep only the last N seconds based on chunk size
    // Assuming 1-second chunks, keep duration * 1 chunks
    const maxChunks = this.replayBufferSignal().duration;
    if (this.replayBufferData.length > maxChunks) {
      this.replayBufferData.shift();
    }
  }

  /**
   * Start replay buffer cleanup interval
   */
  private startReplayBufferCleanup(): void {
    if (this.replayBufferInterval) return;

    this.replayBufferInterval = window.setInterval(() => {
      const maxChunks = this.replayBufferSignal().duration;
      if (this.replayBufferData.length > maxChunks) {
        this.replayBufferData = this.replayBufferData.slice(-maxChunks);
      }
    }, 5000);
  }

  /**
   * Stop replay buffer cleanup interval
   */
  private stopReplayBufferCleanup(): void {
    if (this.replayBufferInterval) {
      clearInterval(this.replayBufferInterval);
      this.replayBufferInterval = null;
    }
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
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.stopReplayBufferCleanup();
  }
}
