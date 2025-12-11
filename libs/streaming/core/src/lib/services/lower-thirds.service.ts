import { Injectable, signal } from '@angular/core';

export interface LowerThird {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  style: LowerThirdStyle;
  duration: number;
  animation: 'slide' | 'fade' | 'zoom' | 'none';
  visible: boolean;
  timestamp?: Date;
}

export interface LowerThirdStyle {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right';
  opacity: number;
}

export interface LowerThirdTemplate {
  id: string;
  name: string;
  style: LowerThirdStyle;
}

@Injectable({
  providedIn: 'root'
})
export class LowerThirdsService {
  readonly activeLowerThird = signal<LowerThird | null>(null);
  readonly templates = signal<LowerThirdTemplate[]>([
    {
      id: '1',
      name: 'Modern Blue',
      style: {
        backgroundColor: '#1e40af',
        textColor: '#ffffff',
        accentColor: '#3b82f6',
        fontSize: 24,
        fontFamily: 'Inter, sans-serif',
        position: 'bottom-left',
        opacity: 0.95
      }
    }
  ]);

  show(title: string, subtitle?: string, templateId = '1', duration = 10000): void {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) return;

    const lowerThird: LowerThird = {
      id: crypto.randomUUID(),
      name: 'Lower Third',
      title,
      subtitle,
      style: template.style,
      duration,
      animation: 'slide',
      visible: true,
      timestamp: new Date()
    };

    this.activeLowerThird.set(lowerThird);

    if (duration > 0) {
      setTimeout(() => this.hide(), duration);
    }
  }

  hide(): void {
    const current = this.activeLowerThird();
    if (current) {
      this.activeLowerThird.set({ ...current, visible: false });
      setTimeout(() => this.activeLowerThird.set(null), 500);
    }
  }
}
