import { Component, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { StreamingService } from '../../services/streaming.service';
import { RecordingService } from '../../services/recording.service';

interface Stat {
  label: string;
  value: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

interface PerformanceMetric {
  timestamp: number;
  fps: number;
  cpu: number;
  memory: number;
  bitrate: number;
}

@Component({
  selector: 'streaming-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatGridListModule,
    MatDividerModule
  ],
  templateUrl: './stats-dashboard.component.html',
  styleUrls: ['./stats-dashboard.component.css']
})
export class StatsDashboardComponent implements OnDestroy {
  // Current stats
  private fpsSignal = signal<number>(0);
  private cpuUsageSignal = signal<number>(0);
  private memoryUsageSignal = signal<number>(0);
  private currentBitrateSignal = signal<number>(0);
  private droppedFramesSignal = signal<number>(0);
  private skippedFramesSignal = signal<number>(0);
  private uptimeSignal = signal<number>(0);
  private viewerCountSignal = signal<number>(0);

  readonly fps = this.fpsSignal.asReadonly();
  readonly cpuUsage = this.cpuUsageSignal.asReadonly();
  readonly memoryUsage = this.memoryUsageSignal.asReadonly();
  readonly currentBitrate = this.currentBitrateSignal.asReadonly();
  readonly droppedFrames = this.droppedFramesSignal.asReadonly();
  readonly skippedFrames = this.skippedFramesSignal.asReadonly();
  readonly uptime = this.uptimeSignal.asReadonly();
  readonly viewerCount = this.viewerCountSignal.asReadonly();

  // Performance history
  private performanceHistorySignal = signal<PerformanceMetric[]>([]);
  readonly performanceHistory = this.performanceHistorySignal.asReadonly();

  // Computed stats
  readonly stats = computed<Stat[]>(() => [
    {
      label: 'FPS',
      value: `${this.fps()}`,
      icon: '🎬',
      trend: this.fps() >= 60 ? 'up' : this.fps() >= 30 ? 'stable' : 'down',
      color: this.fps() >= 60 ? '#28a745' : this.fps() >= 30 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'CPU',
      value: `${this.cpuUsage()}%`,
      icon: '⚡',
      trend: this.cpuUsage() < 50 ? 'stable' : this.cpuUsage() < 80 ? 'up' : 'down',
      color: this.cpuUsage() < 50 ? '#28a745' : this.cpuUsage() < 80 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'Memory',
      value: `${this.memoryUsage()}%`,
      icon: '💾',
      trend: this.memoryUsage() < 60 ? 'stable' : 'up',
      color: this.memoryUsage() < 60 ? '#28a745' : this.memoryUsage() < 85 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'Bitrate',
      value: `${(this.currentBitrate() / 1000).toFixed(1)} Mbps`,
      icon: '📊',
      trend: 'stable',
      color: '#2a7fff'
    },
    {
      label: 'Dropped',
      value: `${this.droppedFrames()}`,
      icon: '⚠️',
      trend: this.droppedFrames() === 0 ? 'stable' : 'down',
      color: this.droppedFrames() === 0 ? '#28a745' : this.droppedFrames() < 10 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'Skipped',
      value: `${this.skippedFrames()}`,
      icon: '⏭️',
      trend: this.skippedFrames() === 0 ? 'stable' : 'down',
      color: this.skippedFrames() === 0 ? '#28a745' : this.skippedFrames() < 10 ? '#ffc107' : '#dc3545'
    },
    {
      label: 'Uptime',
      value: this.formatUptime(this.uptime()),
      icon: '⏱️',
      trend: 'stable',
      color: '#2a7fff'
    },
    {
      label: 'Viewers',
      value: `${this.viewerCount()}`,
      icon: '👥',
      trend: 'stable',
      color: '#2a7fff'
    }
  ]);

  readonly isStreaming = computed(() => this.streamingService.isStreaming());
  readonly isRecording = computed(() => this.recordingService.isRecording());

  readonly healthScore = computed(() => {
    const fps = this.fps();
    const cpu = this.cpuUsage();
    const dropped = this.droppedFrames();

    let score = 100;

    if (fps < 60) score -= (60 - fps);
    if (cpu > 50) score -= (cpu - 50) / 2;
    if (dropped > 0) score -= dropped * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly healthStatus = computed(() => {
    const score = this.healthScore();
    if (score >= 90) return { text: 'Excellent', color: '#28a745', icon: '✅' };
    if (score >= 70) return { text: 'Good', color: '#28a745', icon: '👍' };
    if (score >= 50) return { text: 'Fair', color: '#ffc107', icon: '⚠️' };
    if (score >= 30) return { text: 'Poor', color: '#ff8c00', icon: '⚠️' };
    return { text: 'Critical', color: '#dc3545', icon: '🔴' };
  });

  private updateInterval: any;

  constructor(
    private streamingService: StreamingService,
    private recordingService: RecordingService
  ) {
    this.startMonitoring();

    effect(() => {
      // Update viewer count when streaming
      if (this.isStreaming()) {
        this.simulateViewerCount();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private startMonitoring(): void {
    this.updateInterval = setInterval(() => {
      this.updateStats();
    }, 1000); // Update every second
  }

  private stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private updateStats(): void {
    // Simulate real-time stats (in production, these would come from actual measurements)
    this.fpsSignal.set(Math.round(58 + Math.random() * 4)); // 58-62 FPS
    this.cpuUsageSignal.set(Math.round(30 + Math.random() * 30)); // 30-60%
    this.memoryUsageSignal.set(Math.round(45 + Math.random() * 20)); // 45-65%
    this.currentBitrateSignal.set(Math.round(5000 + Math.random() * 2000)); // 5-7 Mbps

    // Randomly add dropped/skipped frames
    if (Math.random() < 0.1) {
      this.droppedFramesSignal.update(v => v + 1);
    }
    if (Math.random() < 0.05) {
      this.skippedFramesSignal.update(v => v + 1);
    }

    // Update uptime
    if (this.isStreaming() || this.isRecording()) {
      this.uptimeSignal.update(v => v + 1);
    }

    // Add to performance history
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      fps: this.fps(),
      cpu: this.cpuUsage(),
      memory: this.memoryUsage(),
      bitrate: this.currentBitrate()
    };

    this.performanceHistorySignal.update(history => {
      const newHistory = [...history, metric];
      // Keep only last 60 seconds
      return newHistory.slice(-60);
    });
  }

  private simulateViewerCount(): void {
    // Simulate viewer count changes
    const change = Math.round((Math.random() - 0.5) * 5);
    this.viewerCountSignal.update(v => Math.max(0, v + change));
  }

  getIconName(emoji: string): string {
    const iconMap: Record<string, string> = {
      '🎬': 'movie',
      '⚡': 'flash_on',
      '💾': 'storage',
      '📊': 'bar_chart',
      '⚠️': 'warning',
      '⏭️': 'skip_next',
      '⏱️': 'schedule',
      '👥': 'people'
    };
    return iconMap[emoji] || 'info';
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getGraphPoints(history: PerformanceMetric[], key: keyof PerformanceMetric, maxValue: number): string {
    if (history.length === 0) return '';

    const width = 600;
    const height = 200;
    const pointWidth = width / Math.max(history.length - 1, 1);

    return history
      .map((metric, index) => {
        const value = typeof metric[key] === 'number' ? metric[key] as number : 0;
        const x = index * pointWidth;
        const y = height - (value / maxValue) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }

  resetStats(): void {
    this.droppedFramesSignal.set(0);
    this.skippedFramesSignal.set(0);
    this.uptimeSignal.set(0);
    this.viewerCountSignal.set(0);
    this.performanceHistorySignal.set([]);
  }

  exportStats(): void {
    const stats = {
      timestamp: new Date().toISOString(),
      averageFps: this.calculateAverage(this.performanceHistory().map(m => m.fps)),
      averageCpu: this.calculateAverage(this.performanceHistory().map(m => m.cpu)),
      averageMemory: this.calculateAverage(this.performanceHistory().map(m => m.memory)),
      averageBitrate: this.calculateAverage(this.performanceHistory().map(m => m.bitrate)),
      droppedFrames: this.droppedFrames(),
      skippedFrames: this.skippedFrames(),
      uptime: this.uptime(),
      healthScore: this.healthScore(),
      performanceHistory: this.performanceHistory()
    };

    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }
}
