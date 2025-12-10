import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  signal,
  computed,
} from '@angular/core';

interface ChatPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
}

interface ChatMessage {
  id: string;
  platform: string;
  username: string;
  message: string;
  timestamp: Date;
  badges: string[];
  color: string;
  emotes?: { name: string; url: string }[];
  isCommand?: boolean;
  isModerator?: boolean;
  isSubscriber?: boolean;
}

interface ChatSettings {
  showTimestamps: boolean;
  showBadges: boolean;
  showPlatformIcons: boolean;
  fontSize: 'small' | 'medium' | 'large';
  filterProfanity: boolean;
  highlightMentions: boolean;
  enableSoundAlerts: boolean;
}

@Component({
  selector: 'streaming-chat-integration',
  imports: [],
  templateUrl: './chat-integration.html',
  styleUrl: './chat-integration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatIntegration implements OnDestroy {
  readonly platforms = signal<ChatPlatform[]>([
    { id: 'twitch', name: 'Twitch', icon: '🎮', color: '#9146FF', connected: false },
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000', connected: false },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2', connected: false },
    { id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2', connected: false },
  ]);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isPaused = signal(false);
  readonly searchQuery = signal('');
  readonly selectedPlatformFilter = signal<string>('all');
  readonly showSettings = signal(false);

  readonly settings = signal<ChatSettings>({
    showTimestamps: true,
    showBadges: true,
    showPlatformIcons: true,
    fontSize: 'medium',
    filterProfanity: false,
    highlightMentions: true,
    enableSoundAlerts: true,
  });

  readonly messageInput = signal('');

  readonly filteredMessages = computed(() => {
    let msgs = this.messages();
    const query = this.searchQuery().toLowerCase();
    const platformFilter = this.selectedPlatformFilter();

    if (platformFilter !== 'all') {
      msgs = msgs.filter(m => m.platform === platformFilter);
    }

    if (query) {
      msgs = msgs.filter(m =>
        m.username.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
      );
    }

    return msgs;
  });

  readonly connectedPlatforms = computed(() =>
    this.platforms().filter(p => p.connected)
  );

  readonly totalMessages = computed(() => this.messages().length);
  readonly messagesPerMinute = computed(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    return this.messages().filter(m => m.timestamp.getTime() > oneMinuteAgo).length;
  });

  private messageSimulatorInterval?: number;

  constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('chat_settings');
    if (savedSettings) {
      this.settings.set(JSON.parse(savedSettings));
    }

    // Simulate receiving messages for demo
    this.startMessageSimulator();

    // Auto-scroll effect
    effect(() => {
      if (!this.isPaused()) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.messageSimulatorInterval) {
      clearInterval(this.messageSimulatorInterval);
    }
  }

  togglePlatform(platformId: string): void {
    this.platforms.update(platforms =>
      platforms.map(p =>
        p.id === platformId ? { ...p, connected: !p.connected } : p
      )
    );
  }

  sendMessage(): void {
    const message = this.messageInput().trim();
    if (!message) return;

    const connectedPlatforms = this.connectedPlatforms();
    if (connectedPlatforms.length === 0) {
      alert('Please connect to at least one platform first!');
      return;
    }

    // Send to all connected platforms
    connectedPlatforms.forEach(platform => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        platform: platform.id,
        username: 'StreamerName',
        message,
        timestamp: new Date(),
        badges: ['🎤'],
        color: '#FFD700',
        isCommand: message.startsWith('/'),
      };

      this.addMessage(newMessage);
    });

    this.messageInput.set('');
  }

  clearChat(): void {
    if (confirm('Clear all chat messages?')) {
      this.messages.set([]);
    }
  }

  togglePause(): void {
    this.isPaused.update(p => !p);
  }

  exportChat(): void {
    const data = JSON.stringify(this.messages(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  toggleSettings(): void {
    this.showSettings.update(s => !s);
  }

  saveSettings(): void {
    localStorage.setItem('chat_settings', JSON.stringify(this.settings()));
    this.showSettings.set(false);
  }

  updateSetting<K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ): void {
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  private addMessage(message: ChatMessage): void {
    this.messages.update(msgs => {
      const newMsgs = [...msgs, message];
      // Keep only last 500 messages for performance
      return newMsgs.slice(-500);
    });

    // Play sound alert if enabled
    if (this.settings().enableSoundAlerts && message.username !== 'StreamerName') {
      this.playNotificationSound();
    }
  }

  private scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  private playNotificationSound(): void {
    // Create a simple beep sound
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  private startMessageSimulator(): void {
    const usernames = [
      'GamerPro123',
      'StreamFan99',
      'ChatMaster',
      'ViewerXYZ',
      'NightOwl',
      'TechEnthusiast',
      'CoolViewer',
      'StreamLover',
    ];

    const sampleMessages = [
      'Great stream!',
      'This is awesome!',
      'Hello everyone!',
      'Love the setup',
      'Following now!',
      'What camera are you using?',
      'Can you play X next?',
      'Thanks for streaming!',
      'This content is fire 🔥',
      'First time viewer, love it!',
    ];

    const badges = ['👑', '⭐', '💎', '🎖️', '🏆'];

    this.messageSimulatorInterval = window.setInterval(() => {
      if (this.isPaused()) return;

      const connectedPlatforms = this.connectedPlatforms();
      if (connectedPlatforms.length === 0) return;

      // 30% chance to generate a new message
      if (Math.random() > 0.7) {
        const platform = connectedPlatforms[
          Math.floor(Math.random() * connectedPlatforms.length)
        ];

        const message: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          platform: platform.id,
          username: usernames[Math.floor(Math.random() * usernames.length)],
          message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          timestamp: new Date(),
          badges: Math.random() > 0.5 ? [badges[Math.floor(Math.random() * badges.length)]] : [],
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          isModerator: Math.random() > 0.9,
          isSubscriber: Math.random() > 0.7,
        };

        this.addMessage(message);
      }
    }, 2000);
  }
}
