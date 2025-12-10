import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamingService } from '../../services/streaming.service';
import { RecordingService } from '../../services/recording.service';
import { VirtualCameraService } from '../../services/virtual-camera.service';
import { StudioModeService } from '../../services/studio-mode.service';

@Component({
  selector: 'lib-streaming-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="streaming-controls">
      <div class="control-row">
        <!-- Streaming -->
        <div class="control-group">
          @if (!isStreaming()) {
          <button
            class="btn-control btn-start-stream"
            (click)="startStreaming()"
            [disabled]="streamingDestinations().length === 0"
          >
            <span class="icon">🔴</span>
            Start Streaming
          </button>
          } @else {
          <button class="btn-control btn-stop-stream" (click)="stopStreaming()">
            <span class="icon">⏹</span>
            Stop Streaming
          </button>
          } @if (isStreaming()) {
          <div class="stream-stats">
            <span class="stat">
              <span class="stat-label">FPS:</span>
              <span class="stat-value">{{ streamStats().fps }}</span>
            </span>
            <span class="stat">
              <span class="stat-label">Bitrate:</span>
              <span class="stat-value"
                >{{ streamStats().bitrate | number : '1.0-0' }} kbps</span
              >
            </span>
            <span class="stat">
              <span class="stat-label">Dropped:</span>
              <span class="stat-value" [class.warning]="dropPercentage() > 1">
                {{ dropPercentage() | number : '1.2-2' }}%
              </span>
            </span>
          </div>
          }
        </div>

        <!-- Recording -->
        <div class="control-group">
          @if (!isRecording()) {
          <button
            class="btn-control btn-start-record"
            (click)="startRecording()"
          >
            <span class="icon">⚫</span>
            Start Recording
          </button>
          } @else {
          <button class="btn-control btn-stop-record" (click)="stopRecording()">
            <span class="icon">⏹</span>
            Stop Recording
          </button>
          } @if (isRecording()) {
          <div class="recording-indicator">
            <span class="pulse"></span>
            <span>{{ recordingDuration() }}</span>
          </div>
          }
        </div>

        <!-- Replay Buffer -->
        <div class="control-group">
          @if (replayBufferEnabled()) {
          <button class="btn-control btn-save-replay" (click)="saveReplay()">
            <span class="icon">💾</span>
            Save Replay
          </button>
          } @else {
          <button
            class="btn-control btn-enable-replay"
            (click)="enableReplayBuffer()"
          >
            <span class="icon">📼</span>
            Enable Replay Buffer
          </button>
          }
        </div>

        <!-- Virtual Camera -->
        <div class="control-group">
          @if (!virtualCameraActive()) {
          <button
            class="btn-control btn-start-vcam"
            (click)="startVirtualCamera()"
          >
            <span class="icon">📹</span>
            Start Virtual Camera
          </button>
          } @else {
          <button
            class="btn-control btn-stop-vcam"
            (click)="stopVirtualCamera()"
          >
            <span class="icon">⏹</span>
            Stop Virtual Camera
          </button>
          } @if (virtualCameraActive()) {
          <div class="vcam-status">
            <span class="vcam-indicator"></span>
            <span>{{ connectedApps().length }} app(s) connected</span>
          </div>
          }
        </div>

        <!-- Studio Mode -->
        <div class="control-group">
          <button
            class="btn-control"
            [class.active]="studioModeEnabled()"
            (click)="toggleStudioMode()"
          >
            <span class="icon">🎬</span>
            Studio Mode
          </button>

          @if (studioModeEnabled()) {
          <button
            class="btn-control btn-transition"
            (click)="transitionToPreview()"
            [disabled]="inTransition()"
          >
            <span class="icon">➡️</span>
            Transition
          </button>
          }
        </div>
      </div>

      <!-- Settings Quick Access -->
      <div class="settings-row">
        <button class="btn-settings" (click)="openSettings()">
          <span class="icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .streaming-controls {
        padding: 1rem;
        background: #1a1a1a;
        border-top: 1px solid #333;
        color: #fff;
      }

      .control-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-start-stream {
        background: #dc3545;
        color: #fff;
      }

      .btn-start-stream:hover:not(:disabled) {
        background: #c82333;
      }

      .btn-stop-stream {
        background: #6c757d;
        color: #fff;
      }

      .btn-start-record {
        background: #ffc107;
        color: #000;
      }

      .btn-start-record:hover {
        background: #e0a800;
      }

      .btn-stop-record {
        background: #6c757d;
        color: #fff;
      }

      .btn-control:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-control.active {
        background: #2a7fff;
        color: #fff;
      }

      .btn-transition {
        background: #28a745;
        color: #fff;
      }

      .btn-transition:hover:not(:disabled) {
        background: #218838;
      }

      .stream-stats {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: #2a2a2a;
        border-radius: 4px;
        font-size: 0.85rem;
      }

      .stat {
        display: flex;
        gap: 0.25rem;
      }

      .stat-label {
        color: #888;
      }

      .stat-value {
        color: #0f0;
        font-weight: 600;
      }

      .stat-value.warning {
        color: #ffc107;
      }

      .recording-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #2a2a2a;
        border-radius: 4px;
        font-size: 0.85rem;
      }

      .pulse {
        width: 8px;
        height: 8px;
        background: #dc3545;
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }

      .vcam-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #2a2a2a;
        border-radius: 4px;
        font-size: 0.85rem;
      }

      .vcam-indicator {
        width: 8px;
        height: 8px;
        background: #0f0;
        border-radius: 50%;
      }

      .settings-row {
        display: flex;
        justify-content: flex-end;
      }

      .btn-settings {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .btn-settings:hover {
        background: #333;
      }

      .icon {
        font-size: 1.1rem;
      }
    `,
  ],
})
export class StreamingControlsComponent {
  // Signal-based state
  private recordingStartTime = signal<Date | null>(null);

  // Computed signals - so clean!
  readonly isStreaming = computed(
    () => this.streamingService.streamingState().isStreaming
  readonly virtualCameraActive = signal(false);
  readonly studioModeEnabled = signal(false);
  readonly inTransition = signal(false);
  readonly connectedApps = signal<string[]>([]);
  readonly streamStats = computed(() => this.streamingService.streamingState());

  readonly dropPercentage = computed(() => {
    const stats = this.streamStats();
    if (stats.totalFrames === 0) return 0;
    return (stats.droppedFrames / stats.totalFrames) * 100;
  });

    totalFrames: 0,

  constructor(
    private streamingService: StreamingService,
    private recordingService: RecordingService,
    private virtualCameraService: VirtualCameraService,
    private studioModeService: StudioModeService
  ) {
    // Using effect to monitor recording state changes
    effect(() => {
      const recording = this.recordingService.isRecording();
      if (recording) {
        this.recordingStartTime.set(new Date());
      } else {
        this.recordingStartTime.set(null);
      }
    });
  }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
    try {
      await this.streamingService.startStreaming();
  private readonly streamingService = inject(StreamingService);
  private readonly recordingService = inject(RecordingService);
  private readonly virtualCameraService = inject(VirtualCameraService);
  private readonly studioModeService = inject(StudioModeService);

  constructor() {
    if (confirm('Stop streaming?')) {
      await this.streamingService.stopStreaming();
      const recording = this.recordingService.isRecording();
      this.isRecording.set(recording);
      if (recording) {
        this.recordingStartTime.set(new Date());
      } else {
        this.recordingStartTime.set(null);
      }
    }
  }

      const state = this.streamingService.streamingState();
      this.streamStats.set({
        fps: state.fps,
        bitrate: state.bitrate,
        droppedFrames: state.droppedFrames,
        totalFrames: state.totalFrames,

  enableReplayBuffer(): void {
    const duration = prompt('Enter replay buffer duration (seconds):', '30');
    if (duration) {
      this.recordingService.enableReplayBuffer(parseInt(duration, 10));
      this.replayBufferEnabled.set(true);
    }
  }

  async saveReplay(): Promise<void> {
    try {
      const path = await this.recordingService.saveReplayBuffer();
      alert(`Replay saved to: ${path}`);
    } catch (error) {
      alert('Failed to save replay: ' + error);
    }
  }

  async startVirtualCamera(): Promise<void> {
    try {
      await this.virtualCameraService.startVirtualCamera();
      this.virtualCameraActive.set(true);
    } catch (error) {
      alert('Failed to start virtual camera: ' + error);
    }
  }

  async stopVirtualCamera(): Promise<void> {
    try {
      await this.virtualCameraService.stopVirtualCamera();
      this.virtualCameraActive.set(false);
    } catch (error) {
      alert('Failed to stop virtual camera: ' + error);
    }
  }

  toggleStudioMode(): void {
    const enabled = this.studioModeEnabled();
    if (!enabled) {
      this.studioModeService.enableStudioMode('scene-1');
      this.studioModeEnabled.set(true);
    } else {
      this.studioModeService.disableStudioMode();
      this.studioModeEnabled.set(false);
    }
  }

  async transitionToPreview(): Promise<void> {
    this.inTransition.set(true);
    try {
      await this.studioModeService.transitionToPreview();
    } finally {
      this.inTransition.set(false);
    }
  }

  openSettings(): void {
    alert('Settings dialog would open here');
  }

  // Computed signal for destinations
  streamingDestinations = computed(() => {
    // In real implementation, this would come from streaming service
    return [];
  });
}
