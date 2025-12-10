import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';

export type PlatformType = 'twitch' | 'youtube' | 'facebook' | 'kick' | 'tiktok' | 'custom';

export type StreamStatus = 'disconnected' | 'connecting' | 'live' | 'error' | 'stopping';

interface Platform {
  id: string;
  type: PlatformType;
  name: string;
  enabled: boolean;
  streamKey: string;
  streamUrl: string;
  status: StreamStatus;
  bitrate: number;
  resolution: string;
  fps: number;
  viewerCount: number;
  uploadSpeed: number;
  droppedFrames: number;
  lastError?: string;
}

interface StreamPreset {
  name: string;
  resolution: string;
  fps: number;
  bitrate: number;
  description: string;
}

@Component({
  selector: 'streaming-multistream',
  imports: [],
  templateUrl: './multistream.html',
  styleUrl: './multistream.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Multistream implements OnDestroy {
  readonly platforms = signal<Platform[]>([]);
  readonly selectedPlatformId = signal<string | null>(null);
  readonly showAddDialog = signal(false);
  readonly showPresetsDialog = signal(false);
  readonly isStreamingAny = signal(false);

  readonly streamPresets: StreamPreset[] = [
    { name: '1080p 60fps High', resolution: '1920x1080', fps: 60, bitrate: 6000, description: 'High quality for fast internet' },
    { name: '1080p 30fps Medium', resolution: '1920x1080', fps: 30, bitrate: 4500, description: 'Balanced quality' },
    { name: '720p 60fps Medium', resolution: '1280x720', fps: 60, bitrate: 4500, description: 'Smooth gaming' },
    { name: '720p 30fps Low', resolution: '1280x720', fps: 30, bitrate: 2500, description: 'Lower bandwidth' },
    { name: '480p 30fps Ultra Low', resolution: '854x480', fps: 30, bitrate: 1000, description: 'Slow connections' },
  ];

  readonly selectedPlatform = computed(() => {
    const id = this.selectedPlatformId();
    return this.platforms().find(p => p.id === id);
  });

  readonly enabledPlatforms = computed(() =>
    this.platforms().filter(p => p.enabled)
  );

  readonly livePlatforms = computed(() =>
    this.platforms().filter(p => p.status === 'live')
  );

  readonly totalViewers = computed(() =>
    this.platforms().reduce((sum, p) => sum + (p.status === 'live' ? p.viewerCount : 0), 0)
  );

  private statsInterval?: number;

  constructor() {
    // Load from localStorage
    const saved = localStorage.getItem('multistream_platforms');
    if (saved) {
      this.platforms.set(JSON.parse(saved));
    }

    // Start stats simulator
    this.startStatsSimulator();

    // Update isStreamingAny
    effect(() => {
      this.isStreamingAny.set(this.livePlatforms().length > 0);
    });
  }

  ngOnDestroy(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  addPlatform(type: PlatformType): void {
    const newPlatform: Platform = {
      id: `platform-${Date.now()}-${Math.random()}`,
      type,
      name: this.getPlatformName(type),
      enabled: false,
      streamKey: '',
      streamUrl: this.getDefaultStreamUrl(type),
      status: 'disconnected',
      bitrate: 4500,
      resolution: '1920x1080',
      fps: 30,
      viewerCount: 0,
      uploadSpeed: 0,
      droppedFrames: 0,
    };

    this.platforms.update(platforms => [...platforms, newPlatform]);
    this.selectedPlatformId.set(newPlatform.id);
    this.showAddDialog.set(false);
    this.saveToStorage();
  }

  addPlatformByType(type: string): void {
    this.addPlatform(type as PlatformType);
  }

  removePlatform(id: string): void {
    const platform = this.platforms().find(p => p.id === id);
    if (platform?.status === 'live') {
      alert('Stop streaming to this platform before removing it.');
      return;
    }

    if (confirm('Remove this platform?')) {
      this.platforms.update(platforms => platforms.filter(p => p.id !== id));
      if (this.selectedPlatformId() === id) {
        this.selectedPlatformId.set(null);
      }
      this.saveToStorage();
    }
  }

  updatePlatform(id: string, updates: Partial<Platform>): void {
    this.platforms.update(platforms =>
      platforms.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    this.saveToStorage();
  }

  togglePlatform(id: string): void {
    const platform = this.platforms().find(p => p.id === id);
    if (!platform) return;

    if (platform.enabled && platform.status === 'live') {
      alert('Stop streaming before disabling this platform.');
      return;
    }

    this.updatePlatform(id, { enabled: !platform.enabled });
  }

  startStreaming(id: string): void {
    const platform = this.platforms().find(p => p.id === id);
    if (!platform) return;

    if (!platform.streamKey.trim()) {
      alert('Please enter a stream key first!');
      return;
    }

    // Simulate connection process
    this.updatePlatform(id, { status: 'connecting', lastError: undefined });

    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      if (success) {
        this.updatePlatform(id, { status: 'live', viewerCount: Math.floor(Math.random() * 50) });
      } else {
        this.updatePlatform(id, {
          status: 'error',
          lastError: 'Failed to connect. Check your stream key and internet connection.',
        });
      }
    }, 2000);
  }

  stopStreaming(id: string): void {
    const platform = this.platforms().find(p => p.id === id);
    if (!platform) return;

    this.updatePlatform(id, { status: 'stopping' });

    setTimeout(() => {
      this.updatePlatform(id, {
        status: 'disconnected',
        viewerCount: 0,
        uploadSpeed: 0,
        droppedFrames: 0,
      });
    }, 1000);
  }

  startAllStreaming(): void {
    const enabled = this.enabledPlatforms();
    if (enabled.length === 0) {
      alert('Please enable at least one platform first!');
      return;
    }

    const notConfigured = enabled.filter(p => !p.streamKey.trim());
    if (notConfigured.length > 0) {
      alert(`Please configure stream keys for: ${notConfigured.map(p => p.name).join(', ')}`);
      return;
    }

    enabled.forEach(p => {
      if (p.status === 'disconnected') {
        this.startStreaming(p.id);
      }
    });
  }

  stopAllStreaming(): void {
    const live = this.livePlatforms();
    if (live.length === 0) return;

    if (confirm(`Stop streaming to all ${live.length} platform(s)?`)) {
      live.forEach(p => this.stopStreaming(p.id));
    }
  }

  applyPreset(platformId: string, preset: StreamPreset): void {
    this.updatePlatform(platformId, {
      resolution: preset.resolution,
      fps: preset.fps,
      bitrate: preset.bitrate,
    });
    this.showPresetsDialog.set(false);
  }

  testConnection(id: string): void {
    const platform = this.platforms().find(p => p.id === id);
    if (!platform) return;

    if (!platform.streamKey.trim()) {
      alert('Please enter a stream key first!');
      return;
    }

    this.updatePlatform(id, { status: 'connecting' });

    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        alert('Connection test successful!');
        this.updatePlatform(id, { status: 'disconnected', lastError: undefined });
      } else {
        alert('Connection test failed. Check your stream key and URL.');
        this.updatePlatform(id, {
          status: 'error',
          lastError: 'Connection test failed',
        });
      }
    }, 1500);
  }

  exportConfig(): void {
    // Remove sensitive data before export
    const exportData = this.platforms().map(p => ({
      ...p,
      streamKey: '', // Don't export stream keys
      viewerCount: 0,
      uploadSpeed: 0,
      droppedFrames: 0,
      status: 'disconnected' as StreamStatus,
    }));

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multistream-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getPlatformIcon(type: PlatformType): string {
    const icons: Record<PlatformType, string> = {
      twitch: '🎮',
      youtube: '📺',
      facebook: '👥',
      kick: '⚡',
      tiktok: '🎵',
      custom: '🌐',
    };
    return icons[type];
  }

  getPlatformName(type: PlatformType): string {
    const names: Record<PlatformType, string> = {
      twitch: 'Twitch',
      youtube: 'YouTube',
      facebook: 'Facebook Gaming',
      kick: 'Kick',
      tiktok: 'TikTok',
      custom: 'Custom RTMP',
    };
    return names[type];
  }

  getPlatformColor(type: PlatformType): string {
    const colors: Record<PlatformType, string> = {
      twitch: '#9146FF',
      youtube: '#FF0000',
      facebook: '#1877F2',
      kick: '#53FC18',
      tiktok: '#FE2C55',
      custom: '#6C757D',
    };
    return colors[type];
  }

  getStatusColor(status: StreamStatus): string {
    const colors: Record<StreamStatus, string> = {
      disconnected: '#6C757D',
      connecting: '#FFC107',
      live: '#00FF88',
      error: '#FF4C4C',
      stopping: '#FFA500',
    };
    return colors[status];
  }

  getStatusLabel(status: StreamStatus): string {
    const labels: Record<StreamStatus, string> = {
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      live: 'Live',
      error: 'Error',
      stopping: 'Stopping...',
    };
    return labels[status];
  }

  private getDefaultStreamUrl(type: PlatformType): string {
    const urls: Record<PlatformType, string> = {
      twitch: 'rtmp://live.twitch.tv/app/',
      youtube: 'rtmp://a.rtmp.youtube.com/live2/',
      facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      kick: 'rtmp://stream.kick.com/live/',
      tiktok: 'rtmp://live.tiktok.com/live/',
      custom: 'rtmp://',
    };
    return urls[type];
  }

  private startStatsSimulator(): void {
    this.statsInterval = window.setInterval(() => {
      this.platforms.update(platforms =>
        platforms.map(p => {
          if (p.status !== 'live') return p;

          return {
            ...p,
            viewerCount: Math.max(0, p.viewerCount + Math.floor(Math.random() * 10 - 4)),
            uploadSpeed: p.bitrate + Math.random() * 500 - 250,
            droppedFrames: p.droppedFrames + (Math.random() > 0.9 ? 1 : 0),
          };
        })
      );
    }, 3000);
  }

  private saveToStorage(): void {
    localStorage.setItem('multistream_platforms', JSON.stringify(this.platforms()));
  }
}
