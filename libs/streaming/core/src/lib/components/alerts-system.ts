import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  computed,
  effect,
} from '@angular/core';

export type AlertType = 'follower' | 'subscriber' | 'donation' | 'raid' | 'host' | 'cheer' | 'custom';

interface Alert {
  id: string;
  type: AlertType;
  username: string;
  message?: string;
  amount?: number;
  months?: number;
  tier?: number;
  viewerCount?: number;
  timestamp: Date;
  displayed: boolean;
}

interface AlertConfig {
  type: AlertType;
  enabled: boolean;
  minAmount?: number;
  duration: number;
  soundVolume: number;
  soundFile?: string;
  imageUrl?: string;
  textTemplate: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  animation: 'slide' | 'fade' | 'bounce' | 'zoom';
}

interface AlertTemplate {
  name: string;
  backgroundColor: string;
  textColor: string;
  animation: 'slide' | 'fade' | 'bounce' | 'zoom';
}

@Component({
  selector: 'streaming-alerts-system',
  imports: [],
  templateUrl: './alerts-system.html',
  styleUrl: './alerts-system.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsSystem implements OnDestroy {
  readonly alertQueue = signal<Alert[]>([]);
  readonly currentAlert = signal<Alert | null>(null);
  readonly alertHistory = signal<Alert[]>([]);
  readonly showConfig = signal(false);
  readonly showHistory = signal(false);
  readonly selectedConfigType = signal<AlertType>('follower');
  readonly testAlertType = signal<AlertType>('follower');

  readonly alertConfigs = signal<Map<AlertType, AlertConfig>>(
    new Map([
      [
        'follower',
        {
          type: 'follower',
          enabled: true,
          duration: 5000,
          soundVolume: 0.7,
          textTemplate: '{username} is now following!',
          backgroundColor: '#9146FF',
          textColor: '#FFFFFF',
          fontSize: 24,
          animation: 'slide',
        },
      ],
      [
        'subscriber',
        {
          type: 'subscriber',
          enabled: true,
          duration: 7000,
          soundVolume: 0.8,
          textTemplate: '{username} subscribed! (Tier {tier}, {months} months)',
          backgroundColor: '#FF6B6B',
          textColor: '#FFFFFF',
          fontSize: 26,
          animation: 'bounce',
        },
      ],
      [
        'donation',
        {
          type: 'donation',
          enabled: true,
          minAmount: 1,
          duration: 8000,
          soundVolume: 0.9,
          textTemplate: '{username} donated ${amount}! {message}',
          backgroundColor: '#FFD700',
          textColor: '#000000',
          fontSize: 28,
          animation: 'zoom',
        },
      ],
      [
        'raid',
        {
          type: 'raid',
          enabled: true,
          duration: 10000,
          soundVolume: 1.0,
          textTemplate: '{username} is raiding with {viewerCount} viewers!',
          backgroundColor: '#FF4500',
          textColor: '#FFFFFF',
          fontSize: 30,
          animation: 'bounce',
        },
      ],
      [
        'host',
        {
          type: 'host',
          enabled: true,
          duration: 6000,
          soundVolume: 0.7,
          textTemplate: '{username} is hosting with {viewerCount} viewers!',
          backgroundColor: '#00D9FF',
          textColor: '#000000',
          fontSize: 24,
          animation: 'slide',
        },
      ],
      [
        'cheer',
        {
          type: 'cheer',
          enabled: true,
          minAmount: 100,
          duration: 6000,
          soundVolume: 0.8,
          textTemplate: '{username} cheered {amount} bits! {message}',
          backgroundColor: '#9C27B0',
          textColor: '#FFFFFF',
          fontSize: 24,
          animation: 'fade',
        },
      ],
    ])
  );

  readonly templates: AlertTemplate[] = [
    { name: 'Default', backgroundColor: '#9146FF', textColor: '#FFFFFF', animation: 'slide' },
    { name: 'Fire', backgroundColor: '#FF4500', textColor: '#FFFFFF', animation: 'bounce' },
    { name: 'Ocean', backgroundColor: '#00D9FF', textColor: '#000000', animation: 'fade' },
    { name: 'Gold', backgroundColor: '#FFD700', textColor: '#000000', animation: 'zoom' },
    { name: 'Neon', backgroundColor: '#00FF00', textColor: '#000000', animation: 'bounce' },
  ];

  readonly selectedConfig = computed(() =>
    this.alertConfigs().get(this.selectedConfigType())
  );

  readonly queueSize = computed(() => this.alertQueue().length);
  readonly totalAlerts = computed(() => this.alertHistory().length);
  readonly enabledAlertsCount = computed(() => {
    let count = 0;
    this.alertConfigs().forEach(config => {
      if (config.enabled) count++;
    });
    return count;
  });

  private alertDisplayTimeout?: number;
  private alertSimulatorInterval?: number;

  constructor() {
    // Load configs from localStorage
    const savedConfigs = localStorage.getItem('alert_configs');
    if (savedConfigs) {
      const parsed = JSON.parse(savedConfigs);
      this.alertConfigs.set(new Map(Object.entries(parsed)));
    }

    // Start alert simulator for demo
    this.startAlertSimulator();

    // Process queue
    effect(() => {
      if (!this.currentAlert() && this.alertQueue().length > 0) {
        this.displayNextAlert();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.alertDisplayTimeout) {
      clearTimeout(this.alertDisplayTimeout);
    }
    if (this.alertSimulatorInterval) {
      clearInterval(this.alertSimulatorInterval);
    }
  }

  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'displayed'>): void {
    const config = this.alertConfigs().get(alert.type);
    if (!config?.enabled) return;

    // Check minimum amount if applicable
    if (config.minAmount && alert.amount && alert.amount < config.minAmount) {
      return;
    }

    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      displayed: false,
    };

    this.alertQueue.update(queue => [...queue, newAlert]);
  }

  testAlert(type: AlertType): void {
    const testData: Record<AlertType, Omit<Alert, 'id' | 'timestamp' | 'displayed'>> = {
      follower: { type: 'follower', username: 'TestUser123' },
      subscriber: { type: 'subscriber', username: 'TestSub', tier: 1, months: 3 },
      donation: { type: 'donation', username: 'GenerousDonor', amount: 50, message: 'Great stream!' },
      raid: { type: 'raid', username: 'RaidLeader', viewerCount: 250 },
      host: { type: 'host', username: 'HostUser', viewerCount: 100 },
      cheer: { type: 'cheer', username: 'CheerLeader', amount: 500, message: 'Hype!' },
      custom: { type: 'custom', username: 'CustomUser', message: 'Custom alert!' },
    };

    this.addAlert(testData[type]);
  }

  skipCurrentAlert(): void {
    if (this.currentAlert()) {
      this.finishCurrentAlert();
    }
  }

  clearQueue(): void {
    if (confirm('Clear all queued alerts?')) {
      this.alertQueue.set([]);
    }
  }

  clearHistory(): void {
    if (confirm('Clear alert history?')) {
      this.alertHistory.set([]);
    }
  }

  toggleConfig(): void {
    this.showConfig.update(v => !v);
  }

  toggleHistory(): void {
    this.showHistory.update(v => !v);
  }

  updateConfig(type: AlertType, updates: Partial<AlertConfig>): void {
    const configs = this.alertConfigs();
    const config = configs.get(type);
    if (config) {
      configs.set(type, { ...config, ...updates });
      this.alertConfigs.set(new Map(configs));
      this.saveConfigs();
    }
  }

  applyTemplate(template: AlertTemplate): void {
    const type = this.selectedConfigType();
    this.updateConfig(type, {
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      animation: template.animation,
    });
  }

  exportConfig(): void {
    const configs: Record<string, AlertConfig> = {};
    this.alertConfigs().forEach((config, type) => {
      configs[type] = config;
    });

    const data = JSON.stringify(configs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alert-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private displayNextAlert(): void {
    const queue = this.alertQueue();
    if (queue.length === 0) return;

    const alert = queue[0];
    const config = this.alertConfigs().get(alert.type);
    if (!config) return;

    this.currentAlert.set(alert);
    this.alertQueue.update(q => q.slice(1));

    // Play alert sound
    this.playAlertSound(config);

    // Auto-hide after duration
    this.alertDisplayTimeout = window.setTimeout(() => {
      this.finishCurrentAlert();
    }, config.duration);
  }

  private finishCurrentAlert(): void {
    const alert = this.currentAlert();
    if (alert) {
      this.alertHistory.update(history => [
        { ...alert, displayed: true },
        ...history.slice(0, 99), // Keep last 100
      ]);
      this.currentAlert.set(null);
    }

    if (this.alertDisplayTimeout) {
      clearTimeout(this.alertDisplayTimeout);
      this.alertDisplayTimeout = undefined;
    }
  }

  private playAlertSound(config: AlertConfig): void {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different alert types
    const frequencies: Record<AlertType, number> = {
      follower: 523.25, // C5
      subscriber: 659.25, // E5
      donation: 783.99, // G5
      raid: 880.0, // A5
      host: 698.46, // F5
      cheer: 739.99, // F#5
      custom: 587.33, // D5
    };

    oscillator.frequency.value = frequencies[config.type] || 440;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(config.soundVolume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  private saveConfigs(): void {
    const configs: Record<string, AlertConfig> = {};
    this.alertConfigs().forEach((config, type) => {
      configs[type] = config;
    });
    localStorage.setItem('alert_configs', JSON.stringify(configs));
  }

  private startAlertSimulator(): void {
    const usernames = ['StreamFan99', 'GamerPro', 'ChillViewer', 'HypeUser', 'SupportSquad'];
    const messages = ['Great stream!', 'Keep it up!', 'Love the content!', 'Amazing!'];

    this.alertSimulatorInterval = window.setInterval(() => {
      // 20% chance to generate alert
      if (Math.random() > 0.8) {
        const alertTypes: AlertType[] = ['follower', 'subscriber', 'donation', 'raid', 'host', 'cheer'];
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const username = usernames[Math.floor(Math.random() * usernames.length)];

        switch (type) {
          case 'follower':
            this.addAlert({ type, username });
            break;
          case 'subscriber':
            this.addAlert({ type, username, tier: Math.floor(Math.random() * 3) + 1, months: Math.floor(Math.random() * 24) + 1 });
            break;
          case 'donation':
            this.addAlert({ type, username, amount: Math.floor(Math.random() * 100) + 1, message: messages[Math.floor(Math.random() * messages.length)] });
            break;
          case 'raid':
            this.addAlert({ type, username, viewerCount: Math.floor(Math.random() * 500) + 10 });
            break;
          case 'host':
            this.addAlert({ type, username, viewerCount: Math.floor(Math.random() * 200) + 5 });
            break;
          case 'cheer':
            this.addAlert({ type, username, amount: Math.floor(Math.random() * 1000) + 100, message: messages[Math.floor(Math.random() * messages.length)] });
            break;
        }
      }
    }, 5000);
  }

  formatAlertText(alert: Alert): string {
    const config = this.alertConfigs().get(alert.type);
    if (!config) return '';

    let text = config.textTemplate;
    text = text.replace('{username}', alert.username);
    text = text.replace('{amount}', String(alert.amount || 0));
    text = text.replace('{months}', String(alert.months || 0));
    text = text.replace('{tier}', String(alert.tier || 1));
    text = text.replace('{viewerCount}', String(alert.viewerCount || 0));
    text = text.replace('{message}', alert.message || '');
    return text;
  }

  getAlertIcon(type: AlertType): string {
    const icons: Record<AlertType, string> = {
      follower: '👤',
      subscriber: '⭐',
      donation: '💰',
      raid: '⚔️',
      host: '🏠',
      cheer: '💎',
      custom: '🔔',
    };
    return icons[type];
  }

  getAlertTypeName(type: AlertType): string {
    const names: Record<AlertType, string> = {
      follower: 'Follower',
      subscriber: 'Subscriber',
      donation: 'Donation',
      raid: 'Raid',
      host: 'Host',
      cheer: 'Cheer',
      custom: 'Custom',
    };
    return names[type];
  }
}
