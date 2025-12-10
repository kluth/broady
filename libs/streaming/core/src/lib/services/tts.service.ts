import { Injectable, signal } from '@angular/core';

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'browser' | 'elevenlabs' | 'google' | 'amazon';
}

export interface TTSMessage {
  id: string;
  text: string;
  voice: TTSVoice;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  type: 'chat' | 'donation' | 'alert' | 'custom';
}

export interface TTSSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceId: string;
  filterProfanity: boolean;
  maxLength: number;
  minDonation: number;
  readUsername: boolean;
  skipEmotes: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TTSService {
  readonly isEnabled = signal(true);
  readonly isSpeaking = signal(false);
  readonly queue = signal<TTSMessage[]>([]);
  
  readonly settings = signal<TTSSettings>({
    enabled: true,
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    voiceId: 'default',
    filterProfanity: true,
    maxLength: 200,
    minDonation: 3,
    readUsername: true,
    skipEmotes: true
  });

  readonly availableVoices = signal<TTSVoice[]>([
    { id: 'brian', name: 'Brian', language: 'en-US', gender: 'male', provider: 'browser' },
    { id: 'amy', name: 'Amy', language: 'en-US', gender: 'female', provider: 'browser' },
    { id: 'emma', name: 'Emma', language: 'en-GB', gender: 'female', provider: 'browser' },
    { id: 'russell', name: 'Russell', language: 'en-AU', gender: 'male', provider: 'browser' }
  ]);

  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadBrowserVoices();
    }
  }

  private loadBrowserVoices(): void {
    if (!this.synthesis) return;

    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      const browserVoices: TTSVoice[] = voices.slice(0, 10).map((v, i) => ({
        id: `browser-${i}`,
        name: v.name,
        language: v.lang,
        gender: v.name.toLowerCase().includes('female') ? 'female' : 'male',
        provider: 'browser' as const
      }));

      this.availableVoices.update(existing => {
        const custom = existing.filter(v => v.provider !== 'browser');
        return [...browserVoices, ...custom];
      });
    }
  }

  speak(text: string, type: TTSMessage['type'] = 'custom', priority: TTSMessage['priority'] = 'normal'): void {
    if (!this.settings().enabled) return;

    const processedText = this.processText(text);
    if (!processedText) return;

    const voice = this.availableVoices().find(v => v.id === this.settings().voiceId) || this.availableVoices()[0];

    const message: TTSMessage = {
      id: crypto.randomUUID(),
      text: processedText,
      voice,
      timestamp: new Date(),
      priority,
      type
    };

    if (priority === 'high') {
      this.queue.update(q => [message, ...q]);
    } else {
      this.queue.update(q => [...q, message]);
    }

    if (!this.isSpeaking()) {
      this.processQueue();
    }
  }

  speakChatMessage(username: string, message: string): void {
    const settings = this.settings();
    
    let text = message;
    if (settings.readUsername) {
      text = `${username} says: ${message}`;
    }

    this.speak(text, 'chat', 'low');
  }

  speakDonation(donorName: string, amount: number, message?: string): void {
    const settings = this.settings();
    if (amount < settings.minDonation) return;

    let text = `${donorName} donated $${amount}`;
    if (message) {
      text += `. ${message}`;
    }

    this.speak(text, 'donation', 'high');
  }

  private processText(text: string): string {
    const settings = this.settings();
    
    let processed = text.trim();

    if (settings.skipEmotes) {
      processed = processed.replace(/:[a-zA-Z0-9_]+:/g, '');
      processed = processed.replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '');
    }

    if (settings.filterProfanity) {
      processed = this.filterBadWords(processed);
    }

    if (processed.length > settings.maxLength) {
      processed = processed.substring(0, settings.maxLength) + '...';
    }

    return processed.trim();
  }

  private filterBadWords(text: string): string {
    const badWords = ['badword1', 'badword2'];
    let filtered = text;
    
    badWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });

    return filtered;
  }

  private async processQueue(): Promise<void> {
    const message = this.queue()[0];
    if (!message) return;

    this.isSpeaking.set(true);

    if (this.synthesis) {
      await this.speakWithBrowser(message);
    }

    this.queue.update(q => q.slice(1));
    this.isSpeaking.set(false);

    if (this.queue().length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private speakWithBrowser(message: TTSMessage): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message.text);
      const settings = this.settings();

      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  skip(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.queue.update(q => q.slice(1));
    this.isSpeaking.set(false);
  }

  clearQueue(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.queue.set([]);
    this.isSpeaking.set(false);
  }

  updateSettings(settings: Partial<TTSSettings>): void {
    this.settings.update(s => ({ ...s, ...settings }));
  }

  setVoice(voiceId: string): void {
    this.settings.update(s => ({ ...s, voiceId }));
  }
}
