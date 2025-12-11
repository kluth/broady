import { Injectable, signal } from '@angular/core';

export interface SoundAlert {
  id: string;
  name: string;
  soundUrl: string;
  volume: number;
  trigger: 'follow' | 'subscribe' | 'donation' | 'raid' | 'bits' | 'custom';
  minValue?: number;
  cooldown: number;
  enabled: boolean;
  lastPlayed?: Date;
}

export interface SoundEffect {
  id: string;
  name: string;
  url: string;
  category: 'applause' | 'laugh' | 'airhorn' | 'music' | 'game' | 'meme' | 'other';
  duration: number;
  hotkey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SoundAlertsService {
  readonly alerts = signal<SoundAlert[]>([
    {
      id: '1',
      name: 'New Follower',
      soundUrl: '/assets/sounds/follow.mp3',
      volume: 0.7,
      trigger: 'follow',
      cooldown: 2,
      enabled: true
    },
    {
      id: '2',
      name: 'New Subscriber',
      soundUrl: '/assets/sounds/subscribe.mp3',
      volume: 0.8,
      trigger: 'subscribe',
      cooldown: 0,
      enabled: true
    },
    {
      id: '3',
      name: 'Donation Alert',
      soundUrl: '/assets/sounds/donation.mp3',
      volume: 0.9,
      trigger: 'donation',
      minValue: 5,
      cooldown: 1,
      enabled: true
    }
  ]);

  readonly soundEffects = signal<SoundEffect[]>([
    { id: '1', name: 'Applause', url: '/assets/sfx/applause.mp3', category: 'applause', duration: 3 },
    { id: '2', name: 'Laugh Track', url: '/assets/sfx/laugh.mp3', category: 'laugh', duration: 2 },
    { id: '3', name: 'Airhorn', url: '/assets/sfx/airhorn.mp3', category: 'airhorn', duration: 1, hotkey: 'F1' },
    { id: '4', name: 'Drum Roll', url: '/assets/sfx/drumroll.mp3', category: 'music', duration: 5 },
    { id: '5', name: 'Victory', url: '/assets/sfx/victory.mp3', category: 'game', duration: 3 },
    { id: '6', name: 'Sad Trombone', url: '/assets/sfx/trombone.mp3', category: 'meme', duration: 2 }
  ]);

  readonly masterVolume = signal(0.8);
  readonly isPlaying = signal(false);
  readonly currentlyPlaying = signal<string | null>(null);

  private audioContext: AudioContext | null = null;
  private audioBuffers = new Map<string, AudioBuffer>();

  constructor() {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playAlert(trigger: SoundAlert['trigger'], value?: number): Promise<void> {
    const alert = this.alerts().find(a => 
      a.enabled && a.trigger === trigger && (!a.minValue || (value && value >= a.minValue))
    );

    if (!alert) return;

    if (alert.lastPlayed) {
      const timeSince = (Date.now() - alert.lastPlayed.getTime()) / 1000;
      if (timeSince < alert.cooldown) return;
    }

    await this.playSound(alert.soundUrl, alert.volume);

    this.alerts.update(alerts =>
      alerts.map(a => a.id === alert.id ? { ...a, lastPlayed: new Date() } : a)
    );
  }

  async playEffect(effectId: string): Promise<void> {
    const effect = this.soundEffects().find(e => e.id === effectId);
    if (!effect) return;

    await this.playSound(effect.url, this.masterVolume());
  }

  async playEffectByHotkey(hotkey: string): Promise<void> {
    const effect = this.soundEffects().find(e => e.hotkey === hotkey);
    if (effect) {
      await this.playEffect(effect.id);
    }
  }

  private async playSound(url: string, volume: number): Promise<void> {
    if (this.isPlaying()) return;

    this.isPlaying.set(true);
    this.currentlyPlaying.set(url);

    const audio = new Audio(url);
    audio.volume = volume * this.masterVolume();

    return new Promise((resolve) => {
      audio.onended = () => {
        this.isPlaying.set(false);
        this.currentlyPlaying.set(null);
        resolve();
      };

      audio.onerror = () => {
        this.isPlaying.set(false);
        this.currentlyPlaying.set(null);
        resolve();
      };

      audio.play().catch(() => {
        this.isPlaying.set(false);
        this.currentlyPlaying.set(null);
        resolve();
      });
    });
  }

  addAlert(alert: Omit<SoundAlert, 'id'>): void {
    this.alerts.update(a => [...a, { ...alert, id: crypto.randomUUID() }]);
  }

  removeAlert(id: string): void {
    this.alerts.update(a => a.filter(alert => alert.id !== id));
  }

  toggleAlert(id: string): void {
    this.alerts.update(alerts =>
      alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  }

  addSoundEffect(effect: Omit<SoundEffect, 'id'>): void {
    this.soundEffects.update(e => [...e, { ...effect, id: crypto.randomUUID() }]);
  }

  removeSoundEffect(id: string): void {
    this.soundEffects.update(e => e.filter(effect => effect.id !== id));
  }

  setHotkey(effectId: string, hotkey: string): void {
    this.soundEffects.update(effects =>
      effects.map(e => e.id === effectId ? { ...e, hotkey } : e)
    );
  }
}
