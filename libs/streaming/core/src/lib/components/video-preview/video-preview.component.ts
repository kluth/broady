import { Component, signal, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SceneService } from '../../services/scene.service';
import { RecordingService } from '../../services/recording.service';
import { StreamingService } from '../../services/streaming.service';

@Component({
  selector: 'streaming-video-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-preview">
      <div class="preview-container">
        <!-- Canvas for video rendering -->
        <canvas
          #previewCanvas
          class="preview-canvas"
          [width]="canvasWidth()"
          [height]="canvasHeight()"
        ></canvas>

        <!-- Overlay controls -->
        <div class="preview-overlay">
          @if (isLive()) {
            <div class="live-indicator">
              <span class="live-dot"></span>
              <span>LIVE</span>
            </div>
          }

          @if (isRecording()) {
            <div class="recording-indicator">
              <span class="recording-dot"></span>
              <span>REC {{ recordingDuration() }}</span>
            </div>
          }

          <!-- Stats Overlay -->
          @if (showStats()) {
            <div class="stats-overlay">
              <div class="stat">FPS: {{ currentFps() }}</div>
              <div class="stat">Resolution: {{ resolution() }}</div>
              @if (isLive()) {
                <div class="stat">Bitrate: {{ bitrate() }} kbps</div>
                <div class="stat">Dropped: {{ droppedFrames() }}</div>
              }
            </div>
          }

          <!-- Safe Areas -->
          @if (showSafeAreas()) {
            <div class="safe-area title-safe"></div>
            <div class="safe-area action-safe"></div>
          }

          <!-- Grid Overlay -->
          @if (showGrid()) {
            <div class="grid-overlay">
              @for (line of gridLines(); track $index) {
                <div class="grid-line" [style]="line"></div>
              }
            </div>
          }
        </div>

        <!-- No Scene Message -->
        @if (!activeScene()) {
          <div class="no-scene-message">
            <h2>No Active Scene</h2>
            <p>Create a scene to start</p>
          </div>
        }
      </div>

      <!-- Preview Controls -->
      <div class="preview-controls">
        <div class="control-group">
          <button
            class="btn-control"
            [class.active]="showStats()"
            (click)="toggleStats()"
            title="Toggle Stats"
          >
            📊 Stats
          </button>
          <button
            class="btn-control"
            [class.active]="showGrid()"
            (click)="toggleGrid()"
            title="Toggle Grid"
          >
            # Grid
          </button>
          <button
            class="btn-control"
            [class.active]="showSafeAreas()"
            (click)="toggleSafeAreas()"
            title="Toggle Safe Areas"
          >
            🔲 Safe
          </button>
        </div>

        <div class="control-group">
          <button class="btn-control" (click)="takeScreenshot()">
            📸 Screenshot
          </button>
          <button class="btn-control" (click)="toggleFullscreen()">
            ⛶ Fullscreen
          </button>
        </div>

        <div class="control-group">
          <span class="resolution-display">{{ resolution() }} @ {{ targetFps() }} FPS</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #000;
    }

    .preview-container {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      overflow: hidden;
    }

    .preview-canvas {
      max-width: 100%;
      max-height: 100%;
      background: #0a0a0a;
      border: 1px solid #333;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .live-indicator {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(220, 53, 69, 0.9);
      border-radius: 4px;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .recording-indicator {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(220, 53, 69, 0.9);
      border-radius: 4px;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      font-family: 'Courier New', monospace;
    }

    .recording-dot {
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .stats-overlay {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
    }

    .stat {
      color: #0f0;
    }

    .safe-area {
      position: absolute;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      pointer-events: none;
    }

    .title-safe {
      top: 10%;
      left: 10%;
      right: 10%;
      bottom: 10%;
    }

    .action-safe {
      top: 5%;
      left: 5%;
      right: 5%;
      bottom: 5%;
      border-color: rgba(255, 255, 0, 0.3);
    }

    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .grid-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.2);
    }

    .no-scene-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
    }

    .no-scene-message h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #444;
    }

    .no-scene-message p {
      font-size: 1rem;
      color: #555;
    }

    .preview-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #1a1a1a;
      border-top: 1px solid #333;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .control-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-control {
      padding: 0.5rem 0.75rem;
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-control:hover {
      background: #333;
    }

    .btn-control.active {
      background: #2a7fff;
      border-color: #2a7fff;
    }

    .resolution-display {
      font-size: 0.85rem;
      color: #888;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }

    /* Fullscreen styles */
    :host-context(.fullscreen) .preview-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
    }
  `]
})
export class VideoPreviewComponent {
  // ViewChild for canvas
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');

  // UI state signals
  private showStatsSignal = signal(true);
  private showGridSignal = signal(false);
  private showSafeAreasSignal = signal(false);
  private currentFpsSignal = signal(60);
  private isFullscreenSignal = signal(false);

  // Canvas dimensions
  readonly canvasWidth = signal(1920);
  readonly canvasHeight = signal(1080);

  // Computed signals
  readonly activeScene = computed(() => this.sceneService.activeScene());
  readonly isLive = computed(() => this.streamingService.isStreaming());
  readonly isRecording = computed(() => this.recordingService.isRecording());
  readonly recordingDuration = computed(() => this.recordingService.formattedDuration());

  readonly showStats = this.showStatsSignal.asReadonly();
  readonly showGrid = this.showGridSignal.asReadonly();
  readonly showSafeAreas = this.showSafeAreasSignal.asReadonly();
  readonly currentFps = this.currentFpsSignal.asReadonly();

  readonly resolution = computed(() => `${this.canvasWidth()}x${this.canvasHeight()}`);
  readonly targetFps = signal(60);

  readonly bitrate = computed(() => {
    const state = this.streamingService.streamingState();
    return Math.round(state.bitrate);
  });

  readonly droppedFrames = computed(() => {
    const state = this.streamingService.streamingState();
    return state.droppedFrames;
  });

  readonly gridLines = computed(() => {
    const lines = [];
    const rows = 3;
    const cols = 3;

    // Horizontal lines
    for (let i = 1; i < rows; i++) {
      lines.push({
        top: `${(i / rows) * 100}%`,
        left: '0',
        right: '0',
        height: '1px'
      });
    }

    // Vertical lines
    for (let i = 1; i < cols; i++) {
      lines.push({
        left: `${(i / cols) * 100}%`,
        top: '0',
        bottom: '0',
        width: '1px'
      });
    }

    return lines;
  });

  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  constructor(
    private sceneService: SceneService,
    private streamingService: StreamingService,
    private recordingService: RecordingService
  ) {
    // Start render loop
    effect(() => {
      this.startRenderLoop();

      return () => {
        this.stopRenderLoop();
      };
    });
  }

  toggleStats(): void {
    this.showStatsSignal.update(v => !v);
  }

  toggleGrid(): void {
    this.showGridSignal.update(v => !v);
  }

  toggleSafeAreas(): void {
    this.showSafeAreasSignal.update(v => !v);
  }

  takeScreenshot(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  toggleFullscreen(): void {
    const container = this.canvasRef()?.nativeElement.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      this.isFullscreenSignal.set(true);
    } else {
      document.exitFullscreen();
      this.isFullscreenSignal.set(false);
    }
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Calculate FPS
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = Math.round(1000 / delta);
        this.currentFpsSignal.set(fps);
      }
      this.lastFrameTime = timestamp;

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render active scene
      const scene = this.activeScene();
      if (scene) {
        this.renderScene(ctx, scene, canvas.width, canvas.height);
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderScene(ctx: CanvasRenderingContext2D, scene: any, width: number, height: number): void {
    // Render each source in the scene
    if (!scene.sources || scene.sources.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#333';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(scene.name, width / 2, height / 2);

      return;
    }

    // Sort sources by order (z-index)
    const sortedSources = [...scene.sources].sort((a, b) => a.order - b.order);

    sortedSources.forEach(item => {
      if (!item.visible) return;

      const transform = item.source.transform;

      // Save context
      ctx.save();

      // Apply transformations
      ctx.translate(transform.position.x, transform.position.y);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.scale.x, transform.scale.y);

      // Render based on source type
      this.renderSource(ctx, item.source);

      // Restore context
      ctx.restore();
    });
  }

  private renderSource(ctx: CanvasRenderingContext2D, source: any): void {
    // Placeholder rendering - in production, this would render actual video/images
    ctx.fillStyle = this.getSourceColor(source.type);
    ctx.fillRect(0, 0, 400, 300);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(source.name, 200, 150);
  }

  private getSourceColor(type: string): string {
    const colors: Record<string, string> = {
      'video_capture': '#2a7fff',
      'screen_capture': '#28a745',
      'window_capture': '#17a2b8',
      'audio_input': '#ffc107',
      'image': '#6f42c1',
      'text': '#fd7e14',
      'browser': '#e83e8c',
      'media': '#20c997',
      'color_source': '#6c757d'
    };

    return colors[type] || '#495057';
  }
}
