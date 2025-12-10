import { Injectable, signal } from '@angular/core';

export interface StreamTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  scenes: TemplateScene[];
  sources: TemplateSource[];
  audioSettings: TemplateAudioSettings;
  streamSettings: TemplateStreamSettings;
  tags: string[];
}

export interface TemplateScene {
  id: string;
  name: string;
  sources: string[];
  transition: string;
}

export interface TemplateSource {
  id: string;
  name: string;
  type: 'camera' | 'display' | 'window' | 'image' | 'video' | 'browser' | 'text' | 'audio';
  settings: Record<string, unknown>;
}

export interface TemplateAudioSettings {
  micVolume: number;
  desktopVolume: number;
  musicVolume: number;
  filters: string[];
}

export interface TemplateStreamSettings {
  resolution: string;
  fps: number;
  bitrate: number;
  encoder: string;
  platforms: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StreamTemplatesService {
  readonly templates = signal<StreamTemplate[]>([
    this.getGamingTemplate(),
    this.getJustChattingTemplate(),
    this.getMusicTemplate(),
    this.getTutorialTemplate()
  ]);

  readonly currentTemplate = signal<StreamTemplate | null>(null);

  private getGamingTemplate(): StreamTemplate {
    return {
      id: 'gaming',
      name: 'Gaming Setup',
      description: 'Optimized for gaming streams with webcam and alerts',
      createdAt: new Date(),
      scenes: [
        { id: 's1', name: 'Main Game', sources: ['game', 'webcam', 'chat'], transition: 'fade' },
        { id: 's2', name: 'BRB', sources: ['brb-image', 'music'], transition: 'fade' },
        { id: 's3', name: 'Ending', sources: ['ending-image', 'socials'], transition: 'fade' }
      ],
      sources: [
        { id: 'game', name: 'Game Capture', type: 'display', settings: { fps: 60 } },
        { id: 'webcam', name: 'Webcam', type: 'camera', settings: { resolution: '1920x1080' } }
      ],
      audioSettings: {
        micVolume: 0.8,
        desktopVolume: 0.6,
        musicVolume: 0.3,
        filters: ['noise-suppression', 'compressor']
      },
      streamSettings: {
        resolution: '1920x1080',
        fps: 60,
        bitrate: 6000,
        encoder: 'x264',
        platforms: ['twitch']
      },
      tags: ['gaming', 'webcam', 'alerts']
    };
  }

  private getJustChattingTemplate(): StreamTemplate {
    return {
      id: 'justchatting',
      name: 'Just Chatting',
      description: 'Full screen webcam with chat overlay',
      createdAt: new Date(),
      scenes: [
        { id: 's1', name: 'Main', sources: ['webcam-full', 'chat-overlay'], transition: 'cut' }
      ],
      sources: [
        { id: 'webcam-full', name: 'Webcam Full', type: 'camera', settings: { fullscreen: true } }
      ],
      audioSettings: {
        micVolume: 1.0,
        desktopVolume: 0.2,
        musicVolume: 0.4,
        filters: ['noise-gate', 'eq']
      },
      streamSettings: {
        resolution: '1920x1080',
        fps: 30,
        bitrate: 4500,
        encoder: 'x264',
        platforms: ['twitch']
      },
      tags: ['chatting', 'webcam']
    };
  }

  private getMusicTemplate(): StreamTemplate {
    return {
      id: 'music',
      name: 'Music Performance',
      description: 'High quality audio for music streaming',
      createdAt: new Date(),
      scenes: [
        { id: 's1', name: 'Performance', sources: ['camera', 'visualizer'], transition: 'fade' }
      ],
      sources: [
        { id: 'camera', name: 'Camera', type: 'camera', settings: {} },
        { id: 'visualizer', name: 'Audio Visualizer', type: 'browser', settings: {} }
      ],
      audioSettings: {
        micVolume: 1.0,
        desktopVolume: 0.9,
        musicVolume: 0.9,
        filters: ['compressor', 'limiter', 'eq']
      },
      streamSettings: {
        resolution: '1920x1080',
        fps: 30,
        bitrate: 8000,
        encoder: 'x264',
        platforms: ['youtube']
      },
      tags: ['music', 'audio']
    };
  }

  private getTutorialTemplate(): StreamTemplate {
    return {
      id: 'tutorial',
      name: 'Tutorial/Teaching',
      description: 'Screen share with picture-in-picture webcam',
      createdAt: new Date(),
      scenes: [
        { id: 's1', name: 'Screen + Cam', sources: ['screen', 'webcam-pip'], transition: 'fade' },
        { id: 's2', name: 'Full Screen', sources: ['screen'], transition: 'cut' }
      ],
      sources: [
        { id: 'screen', name: 'Screen Capture', type: 'display', settings: {} },
        { id: 'webcam-pip', name: 'Webcam PIP', type: 'camera', settings: { size: 'small' } }
      ],
      audioSettings: {
        micVolume: 0.9,
        desktopVolume: 0.5,
        musicVolume: 0.2,
        filters: ['noise-suppression']
      },
      streamSettings: {
        resolution: '1920x1080',
        fps: 30,
        bitrate: 5000,
        encoder: 'x264',
        platforms: ['youtube']
      },
      tags: ['tutorial', 'education']
    };
  }

  saveCurrentAsTemplate(name: string, description?: string): StreamTemplate {
    const template: StreamTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
      scenes: [],
      sources: [],
      audioSettings: {
        micVolume: 0.8,
        desktopVolume: 0.6,
        musicVolume: 0.3,
        filters: []
      },
      streamSettings: {
        resolution: '1920x1080',
        fps: 60,
        bitrate: 6000,
        encoder: 'x264',
        platforms: []
      },
      tags: []
    };

    this.templates.update(t => [...t, template]);
    return template;
  }

  loadTemplate(templateId: string): void {
    const template = this.templates().find(t => t.id === templateId);
    if (template) {
      this.currentTemplate.set(template);
      console.log(`Loading template: ${template.name}`);
    }
  }

  deleteTemplate(templateId: string): void {
    if (['gaming', 'justchatting', 'music', 'tutorial'].includes(templateId)) {
      console.warn('Cannot delete built-in templates');
      return;
    }
    this.templates.update(t => t.filter(template => template.id !== templateId));
  }

  duplicateTemplate(templateId: string): StreamTemplate | null {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) return null;

    const duplicate: StreamTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      createdAt: new Date()
    };

    this.templates.update(t => [...t, duplicate]);
    return duplicate;
  }

  exportTemplate(templateId: string): string {
    const template = this.templates().find(t => t.id === templateId);
    return template ? JSON.stringify(template, null, 2) : '';
  }

  importTemplate(templateJson: string): boolean {
    try {
      const template = JSON.parse(templateJson) as StreamTemplate;
      template.id = crypto.randomUUID();
      template.createdAt = new Date();
      this.templates.update(t => [...t, template]);
      return true;
    } catch {
      return false;
    }
  }
}
