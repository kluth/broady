import { Injectable, signal } from '@angular/core';

export interface Clip {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  duration: number;
  recordingId: string;
  createdAt: Date;
  thumbnailUrl?: string;
  url?: string;
  views: number;
  likes: number;
  source: 'manual' | 'auto' | 'highlight';
  tags: string[];
  platform?: 'twitch' | 'youtube' | 'twitter' | 'tiktok';
  status: 'processing' | 'ready' | 'uploaded' | 'failed';
}

export interface ClipTemplate {
  id: string;
  name: string;
  duration: number;
  intro?: string;
  outro?: string;
  overlayUrl?: string;
  musicUrl?: string;
  transitionStyle: 'fade' | 'cut' | 'wipe' | 'zoom';
}

@Injectable({
  providedIn: 'root'
})
export class ClipCreatorService {
  readonly clips = signal<Clip[]>([]);
  readonly templates = signal<ClipTemplate[]>([
    {
      id: '1',
      name: 'Quick Clip',
      duration: 30,
      transitionStyle: 'cut'
    },
    {
      id: '2',
      name: 'Highlight Reel',
      duration: 60,
      intro: '/assets/intros/highlight.mp4',
      outro: '/assets/outros/subscribe.mp4',
      transitionStyle: 'fade'
    },
    {
      id: '3',
      name: 'Social Media',
      duration: 15,
      transitionStyle: 'zoom'
    }
  ]);

  readonly isProcessing = signal(false);
  readonly processingProgress = signal(0);

  async createClip(
    recordingId: string,
    startTime: number,
    duration: number,
    title: string,
    template?: ClipTemplate
  ): Promise<Clip> {
    const clip: Clip = {
      id: crypto.randomUUID(),
      title,
      startTime,
      duration,
      recordingId,
      createdAt: new Date(),
      views: 0,
      likes: 0,
      source: 'manual',
      tags: [],
      status: 'processing'
    };

    this.clips.update(c => [clip, ...c]);
    this.processClip(clip, template);

    return clip;
  }

  private async processClip(clip: Clip, template?: ClipTemplate): Promise<void> {
    this.isProcessing.set(true);
    this.processingProgress.set(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      this.processingProgress.set(i);
    }

    this.clips.update(clips =>
      clips.map(c => c.id === clip.id ? { ...c, status: 'ready' as const, url: `/clips/${clip.id}.mp4` } : c)
    );

    this.isProcessing.set(false);
    this.processingProgress.set(0);
  }

  async autoCreateClipFromHighlight(recordingId: string, highlightTime: number): Promise<Clip> {
    const clip = await this.createClip(
      recordingId,
      Math.max(0, highlightTime - 5),
      30,
      'Auto-generated Highlight'
    );

    this.clips.update(clips =>
      clips.map(c => c.id === clip.id ? { ...c, source: 'auto' as const } : c)
    );

    return clip;
  }

  async uploadToP latform(clipId: string, platform: Clip['platform']): Promise<void> {
    const clip = this.clips().find(c => c.id === clipId);
    if (!clip || clip.status !== 'ready') return;

    this.clips.update(clips =>
      clips.map(c => c.id === clipId ? { ...c, status: 'processing' as const } : c)
    );

    await new Promise(resolve => setTimeout(resolve, 2000));

    this.clips.update(clips =>
      clips.map(c => c.id === clipId ? { ...c, status: 'uploaded' as const, platform } : c)
    );
  }

  addTag(clipId: string, tag: string): void {
    this.clips.update(clips =>
      clips.map(c => c.id === clipId && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c)
    );
  }

  deleteClip(clipId: string): void {
    this.clips.update(c => c.filter(clip => clip.id !== clipId));
  }

  incrementViews(clipId: string): void {
    this.clips.update(clips =>
      clips.map(c => c.id === clipId ? { ...c, views: c.views + 1 } : c)
    );
  }

  likeClip(clipId: string): void {
    this.clips.update(clips =>
      clips.map(c => c.id === clipId ? { ...c, likes: c.likes + 1 } : c)
    );
  }

  createTemplate(name: string, duration: number, options?: Partial<ClipTemplate>): ClipTemplate {
    const template: ClipTemplate = {
      id: crypto.randomUUID(),
      name,
      duration,
      transitionStyle: 'fade',
      ...options
    };

    this.templates.update(t => [...t, template]);
    return template;
  }
}
