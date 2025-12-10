import { Injectable, signal } from '@angular/core';

export interface ChromaKeySettings {
  enabled: boolean;
  color: string;
  similarity: number;
  smoothness: number;
  spillReduction: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChromaKeyService {
  readonly settings = signal<ChromaKeySettings>({
    enabled: false,
    color: '#00FF00',
    similarity: 0.4,
    smoothness: 0.08,
    spillReduction: 0.15
  });

  enable(): void {
    this.settings.update(s => ({ ...s, enabled: true }));
  }

  disable(): void {
    this.settings.update(s => ({ ...s, enabled: false }));
  }

  setColor(color: string): void {
    this.settings.update(s => ({ ...s, color }));
  }
}
