import { Injectable, signal, computed } from '@angular/core';

/**
 * Stream Health Monitor Service
 * Real-time monitoring of stream quality, connection health, and performance metrics
 */

export interface StreamHealth {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  bitrate: number; // kbps
  fps: number;
  droppedFrames: number;
  totalFrames: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  networkLatency: number; // ms
  bandwidth: number; // Mbps
  encodingLag: number; // ms
  uploadSpeed: number; // Mbps
  timestamp: Date;
}

export interface StreamMetrics {
  averageBitrate: number;
  averageFps: number;
  dropRate: number; // percentage
  uptime: number; // seconds
  totalDataSent: number; // MB
  peakViewers: number;
  currentViewers: number;
}

export interface StreamAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface BitrateRecommendation {
  recommended: number;
  min: number;
  max: number;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class StreamHealthMonitorService {
  // Current health state
  readonly currentHealth = signal<StreamHealth>({
    status: 'excellent',
    bitrate: 6000,
    fps: 60,
    droppedFrames: 0,
    totalFrames: 0,
    cpuUsage: 25,
    memoryUsage: 512,
    networkLatency: 20,
    bandwidth: 10,
    encodingLag: 5,
    uploadSpeed: 10,
    timestamp: new Date()
  });

  // Historical metrics
  readonly metrics = signal<StreamMetrics>({
    averageBitrate: 6000,
    averageFps: 60,
    dropRate: 0,
    uptime: 0,
    totalDataSent: 0,
    peakViewers: 0,
    currentViewers: 0
  });

  // Active alerts
  readonly alerts = signal<StreamAlert[]>([]);

  // Health history (last 60 data points)
  readonly healthHistory = signal<StreamHealth[]>([]);

  // Auto-optimization settings
  readonly autoOptimize = signal(true);
  readonly autoBitrateAdjustment = signal(true);

  // Monitoring state
  readonly isMonitoring = signal(false);
  private monitoringInterval?: ReturnType<typeof setInterval>;

  // Computed values
  readonly dropPercentage = computed(() => {
    const health = this.currentHealth();
    if (health.totalFrames === 0) return 0;
    return (health.droppedFrames / health.totalFrames) * 100;
  });

  readonly healthScore = computed(() => {
    const health = this.currentHealth();
    let score = 100;

    // Deduct points for issues
    score -= Math.min(this.dropPercentage() * 2, 30); // Max -30 for drops
    score -= Math.min((health.cpuUsage - 70) * 0.5, 20); // Max -20 for CPU
    score -= Math.min(health.networkLatency / 10, 20); // Max -20 for latency
    score -= Math.min((100 - health.memoryUsage / 1024 * 100) * 0.1, 10); // -10 for memory

    return Math.max(0, Math.min(100, score));
  });

  readonly bitrateRecommendation = computed((): BitrateRecommendation => {
    const health = this.currentHealth();
    const upload = health.uploadSpeed * 1000; // Convert to kbps

    // Use 70% of upload speed for safety
    const safeUpload = upload * 0.7;

    if (health.networkLatency > 100) {
      return {
        recommended: Math.min(3000, safeUpload),
        min: 2000,
        max: 4000,
        reason: 'High latency detected - reducing bitrate for stability'
      };
    }

    if (this.dropPercentage() > 1) {
      return {
        recommended: Math.max(2000, health.bitrate * 0.8),
        min: 2000,
        max: health.bitrate,
        reason: 'Dropped frames detected - reducing bitrate'
      };
    }

    if (health.cpuUsage > 80) {
      return {
        recommended: Math.min(4000, health.bitrate),
        min: 2000,
        max: 5000,
        reason: 'High CPU usage - consider reducing bitrate or resolution'
      };
    }

    return {
      recommended: Math.min(6000, safeUpload),
      min: 3000,
      max: Math.min(8000, safeUpload),
      reason: 'Optimal streaming conditions'
    };
  });

  constructor() {
    this.startMonitoring();
  }

  startMonitoring(): void {
    if (this.isMonitoring()) return;

    this.isMonitoring.set(true);

    // Update metrics every second
    this.monitoringInterval = setInterval(() => {
      this.updateHealthMetrics();
      this.checkForAlerts();

      if (this.autoOptimize()) {
        this.performAutoOptimization();
      }
    }, 1000);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring.set(false);
    }
  }

  private updateHealthMetrics(): void {
    const current = this.currentHealth();

    // Simulate real-time metrics (in production, these would come from actual stream)
    const newHealth: StreamHealth = {
      status: this.calculateHealthStatus(),
      bitrate: this.simulateBitrate(current.bitrate),
      fps: this.simulateFps(current.fps),
      droppedFrames: current.droppedFrames + Math.floor(Math.random() * 3),
      totalFrames: current.totalFrames + 60,
      cpuUsage: Math.max(10, Math.min(100, current.cpuUsage + (Math.random() - 0.5) * 10)),
      memoryUsage: Math.max(256, Math.min(2048, current.memoryUsage + (Math.random() - 0.5) * 50)),
      networkLatency: Math.max(5, Math.min(200, current.networkLatency + (Math.random() - 0.5) * 10)),
      bandwidth: Math.max(1, Math.min(50, current.bandwidth + (Math.random() - 0.5) * 2)),
      encodingLag: Math.max(0, Math.min(50, current.encodingLag + (Math.random() - 0.5) * 5)),
      uploadSpeed: Math.max(1, Math.min(50, current.uploadSpeed + (Math.random() - 0.5) * 1)),
      timestamp: new Date()
    };

    this.currentHealth.set(newHealth);

    // Update history (keep last 60 points = 1 minute)
    const history = [...this.healthHistory(), newHealth];
    if (history.length > 60) history.shift();
    this.healthHistory.set(history);

    // Update aggregate metrics
    this.updateMetrics();
  }

  private calculateHealthStatus(): StreamHealth['status'] {
    const score = this.healthScore();

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  private simulateBitrate(current: number): number {
    // Simulate bitrate variations
    const variance = current * 0.05; // 5% variance
    return Math.max(1000, Math.min(8000, current + (Math.random() - 0.5) * variance));
  }

  private simulateFps(current: number): number {
    // Simulate FPS variations
    const target = 60;
    const drift = (Math.random() - 0.5) * 2;
    return Math.max(30, Math.min(60, current + drift));
  }

  private updateMetrics(): void {
    const history = this.healthHistory();
    if (history.length === 0) return;

    const avgBitrate = history.reduce((sum, h) => sum + h.bitrate, 0) / history.length;
    const avgFps = history.reduce((sum, h) => sum + h.fps, 0) / history.length;

    const current = this.currentHealth();
    const dropRate = current.totalFrames > 0
      ? (current.droppedFrames / current.totalFrames) * 100
      : 0;

    this.metrics.update(m => ({
      ...m,
      averageBitrate: avgBitrate,
      averageFps: avgFps,
      dropRate,
      uptime: m.uptime + 1,
      totalDataSent: m.totalDataSent + (current.bitrate / 8 / 1024), // Convert kbps to MB
      currentViewers: Math.floor(Math.random() * 100) // Simulated
    }));
  }

  private checkForAlerts(): void {
    const health = this.currentHealth();
    const currentAlerts = this.alerts();

    // Check for dropped frames
    if (this.dropPercentage() > 5 && !this.hasActiveAlert('dropped-frames')) {
      this.addAlert({
        id: 'dropped-frames',
        severity: 'error',
        message: `High dropped frame rate: ${this.dropPercentage().toFixed(2)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for high CPU
    if (health.cpuUsage > 85 && !this.hasActiveAlert('high-cpu')) {
      this.addAlert({
        id: 'high-cpu',
        severity: 'warning',
        message: `High CPU usage: ${health.cpuUsage.toFixed(0)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for network issues
    if (health.networkLatency > 150 && !this.hasActiveAlert('high-latency')) {
      this.addAlert({
        id: 'high-latency',
        severity: 'warning',
        message: `High network latency: ${health.networkLatency.toFixed(0)}ms`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for low bitrate
    if (health.bitrate < 2000 && !this.hasActiveAlert('low-bitrate')) {
      this.addAlert({
        id: 'low-bitrate',
        severity: 'info',
        message: `Low bitrate detected: ${health.bitrate.toFixed(0)} kbps`,
        timestamp: new Date(),
        resolved: false
      });
    }
  }

  private hasActiveAlert(id: string): boolean {
    return this.alerts().some(a => a.id === id && !a.resolved);
  }

  private addAlert(alert: StreamAlert): void {
    this.alerts.update(alerts => [...alerts, alert]);
  }

  resolveAlert(id: string): void {
    this.alerts.update(alerts =>
      alerts.map(a => a.id === id ? { ...a, resolved: true } : a)
    );
  }

  clearResolvedAlerts(): void {
    this.alerts.update(alerts => alerts.filter(a => !a.resolved));
  }

  private performAutoOptimization(): void {
    if (!this.autoBitrateAdjustment()) return;

    const recommendation = this.bitrateRecommendation();
    const current = this.currentHealth();

    // Auto-adjust bitrate if significantly different
    const diff = Math.abs(current.bitrate - recommendation.recommended);
    if (diff > 500) { // Only adjust if difference > 500 kbps
      console.log(`Auto-adjusting bitrate from ${current.bitrate} to ${recommendation.recommended}`);
      this.currentHealth.update(h => ({ ...h, bitrate: recommendation.recommended }));
    }
  }

  manualBitrateAdjust(bitrate: number): void {
    this.currentHealth.update(h => ({ ...h, bitrate }));
  }

  resetMetrics(): void {
    this.currentHealth.update(h => ({
      ...h,
      droppedFrames: 0,
      totalFrames: 0
    }));

    this.metrics.set({
      averageBitrate: 6000,
      averageFps: 60,
      dropRate: 0,
      uptime: 0,
      totalDataSent: 0,
      peakViewers: 0,
      currentViewers: 0
    });

    this.healthHistory.set([]);
    this.alerts.set([]);
  }

  exportHealthReport(): string {
    const health = this.currentHealth();
    const metrics = this.metrics();
    const history = this.healthHistory();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      currentHealth: health,
      metrics,
      healthScore: this.healthScore(),
      dropPercentage: this.dropPercentage(),
      recommendation: this.bitrateRecommendation(),
      alerts: this.alerts(),
      history
    }, null, 2);
  }
}
