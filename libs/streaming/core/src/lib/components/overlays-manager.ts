import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
} from '@angular/core';

export type OverlayType =
  | 'webcam'
  | 'text'
  | 'image'
  | 'video'
  | 'browser'
  | 'alertbox'
  | 'chatbox'
  | 'timer'
  | 'scoreboard'
  | 'logo';

interface Overlay {
  id: string;
  type: OverlayType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  rotation: number;
  content?: string;
  url?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

interface OverlayPreset {
  name: string;
  description: string;
  overlays: Omit<Overlay, 'id'>[];
}

@Component({
  selector: 'streaming-overlays-manager',
  imports: [],
  templateUrl: './overlays-manager.html',
  styleUrl: './overlays-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaysManager {
  readonly overlays = signal<Overlay[]>([]);
  readonly selectedOverlayId = signal<string | null>(null);
  readonly showAddDialog = signal(false);
  readonly showPresetsDialog = signal(false);
  readonly newOverlayType = signal<OverlayType>('text');
  readonly previewMode = signal(false);

  readonly presets: OverlayPreset[] = [
    {
      name: 'Gaming Stream',
      description: 'Perfect for gaming streams with webcam, alerts, and chat',
      overlays: [
        {
          type: 'webcam',
          name: 'Webcam',
          x: 20,
          y: 20,
          width: 320,
          height: 240,
          opacity: 1,
          zIndex: 10,
          visible: true,
          locked: false,
          rotation: 0,
          borderRadius: 12,
        },
        {
          type: 'alertbox',
          name: 'Alerts',
          x: 50,
          y: 10,
          width: 400,
          height: 100,
          opacity: 1,
          zIndex: 100,
          visible: true,
          locked: false,
          rotation: 0,
        },
        {
          type: 'chatbox',
          name: 'Chat',
          x: 80,
          y: 20,
          width: 300,
          height: 400,
          opacity: 0.9,
          zIndex: 5,
          visible: true,
          locked: false,
          rotation: 0,
        },
      ],
    },
    {
      name: 'Talk Show',
      description: 'Clean layout for talk shows and podcasts',
      overlays: [
        {
          type: 'text',
          name: 'Title',
          x: 50,
          y: 5,
          width: 600,
          height: 80,
          opacity: 1,
          zIndex: 10,
          visible: true,
          locked: false,
          rotation: 0,
          content: 'Your Show Title',
          fontSize: 48,
          fontColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
        },
        {
          type: 'logo',
          name: 'Logo',
          x: 5,
          y: 5,
          width: 120,
          height: 120,
          opacity: 1,
          zIndex: 15,
          visible: true,
          locked: false,
          rotation: 0,
        },
      ],
    },
    {
      name: 'Tournament',
      description: 'Professional esports tournament layout',
      overlays: [
        {
          type: 'scoreboard',
          name: 'Scoreboard',
          x: 50,
          y: 90,
          width: 500,
          height: 100,
          opacity: 1,
          zIndex: 20,
          visible: true,
          locked: false,
          rotation: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        {
          type: 'timer',
          name: 'Match Timer',
          x: 50,
          y: 5,
          width: 200,
          height: 60,
          opacity: 1,
          zIndex: 15,
          visible: true,
          locked: false,
          rotation: 0,
          fontSize: 36,
          fontColor: '#FFD700',
        },
      ],
    },
  ];

  readonly selectedOverlay = computed(() => {
    const id = this.selectedOverlayId();
    return this.overlays().find(o => o.id === id);
  });

  readonly visibleOverlays = computed(() =>
    this.overlays().filter(o => o.visible)
  );

  readonly totalOverlays = computed(() => this.overlays().length);

  constructor() {
    // Load from localStorage
    const saved = localStorage.getItem('stream_overlays');
    if (saved) {
      this.overlays.set(JSON.parse(saved));
    }
  }

  addOverlay(type: OverlayType): void {
    const newOverlay: Overlay = {
      id: `overlay-${Date.now()}-${Math.random()}`,
      type,
      name: this.getDefaultName(type),
      x: 30 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      width: this.getDefaultWidth(type),
      height: this.getDefaultHeight(type),
      opacity: 1,
      zIndex: this.getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      ...this.getTypeDefaults(type),
    };

    this.overlays.update(overlays => [...overlays, newOverlay]);
    this.selectedOverlayId.set(newOverlay.id);
    this.showAddDialog.set(false);
    this.saveToStorage();
  }

  addOverlayByType(type: string): void {
    this.addOverlay(type as OverlayType);
  }

  removeOverlay(id: string): void {
    if (confirm('Remove this overlay?')) {
      this.overlays.update(overlays => overlays.filter(o => o.id !== id));
      if (this.selectedOverlayId() === id) {
        this.selectedOverlayId.set(null);
      }
      this.saveToStorage();
    }
  }

  duplicateOverlay(id: string): void {
    const overlay = this.overlays().find(o => o.id === id);
    if (!overlay) return;

    const duplicate: Overlay = {
      ...overlay,
      id: `overlay-${Date.now()}-${Math.random()}`,
      name: `${overlay.name} (Copy)`,
      x: overlay.x + 5,
      y: overlay.y + 5,
      zIndex: this.getNextZIndex(),
    };

    this.overlays.update(overlays => [...overlays, duplicate]);
    this.selectedOverlayId.set(duplicate.id);
    this.saveToStorage();
  }

  toggleVisibility(id: string): void {
    this.overlays.update(overlays =>
      overlays.map(o => (o.id === id ? { ...o, visible: !o.visible } : o))
    );
    this.saveToStorage();
  }

  toggleLock(id: string): void {
    this.overlays.update(overlays =>
      overlays.map(o => (o.id === id ? { ...o, locked: !o.locked } : o))
    );
    this.saveToStorage();
  }

  updateOverlay(id: string, updates: Partial<Overlay>): void {
    this.overlays.update(overlays =>
      overlays.map(o => (o.id === id ? { ...o, ...updates } : o))
    );
    this.saveToStorage();
  }

  moveUp(id: string): void {
    const overlay = this.overlays().find(o => o.id === id);
    if (overlay) {
      this.updateOverlay(id, { zIndex: overlay.zIndex + 1 });
    }
  }

  moveDown(id: string): void {
    const overlay = this.overlays().find(o => o.id === id);
    if (overlay && overlay.zIndex > 0) {
      this.updateOverlay(id, { zIndex: overlay.zIndex - 1 });
    }
  }

  applyPreset(preset: OverlayPreset): void {
    if (
      this.overlays().length > 0 &&
      !confirm('This will replace all current overlays. Continue?')
    ) {
      return;
    }

    const newOverlays: Overlay[] = preset.overlays.map(o => ({
      ...o,
      id: `overlay-${Date.now()}-${Math.random()}`,
    }));

    this.overlays.set(newOverlays);
    this.selectedOverlayId.set(null);
    this.showPresetsDialog.set(false);
    this.saveToStorage();
  }

  exportOverlays(): void {
    const data = JSON.stringify(this.overlays(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stream-overlays-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearAllOverlays(): void {
    if (confirm('Remove all overlays?')) {
      this.overlays.set([]);
      this.selectedOverlayId.set(null);
      this.saveToStorage();
    }
  }

  getOverlayIcon(type: OverlayType): string {
    const icons: Record<OverlayType, string> = {
      webcam: '📹',
      text: '📝',
      image: '🖼️',
      video: '🎬',
      browser: '🌐',
      alertbox: '🔔',
      chatbox: '💬',
      timer: '⏱️',
      scoreboard: '🏆',
      logo: '⭐',
    };
    return icons[type];
  }

  getOverlayTypeName(type: OverlayType): string {
    const names: Record<OverlayType, string> = {
      webcam: 'Webcam',
      text: 'Text',
      image: 'Image',
      video: 'Video',
      browser: 'Browser Source',
      alertbox: 'Alert Box',
      chatbox: 'Chat Box',
      timer: 'Timer',
      scoreboard: 'Scoreboard',
      logo: 'Logo',
    };
    return names[type];
  }

  private getDefaultName(type: OverlayType): string {
    const count = this.overlays().filter(o => o.type === type).length + 1;
    return `${this.getOverlayTypeName(type)} ${count}`;
  }

  private getDefaultWidth(type: OverlayType): number {
    const widths: Record<OverlayType, number> = {
      webcam: 320,
      text: 400,
      image: 300,
      video: 640,
      browser: 800,
      alertbox: 500,
      chatbox: 350,
      timer: 200,
      scoreboard: 600,
      logo: 150,
    };
    return widths[type];
  }

  private getDefaultHeight(type: OverlayType): number {
    const heights: Record<OverlayType, number> = {
      webcam: 240,
      text: 80,
      image: 300,
      video: 360,
      browser: 600,
      alertbox: 120,
      chatbox: 400,
      timer: 80,
      scoreboard: 120,
      logo: 150,
    };
    return heights[type];
  }

  private getTypeDefaults(type: OverlayType): Partial<Overlay> {
    switch (type) {
      case 'text':
        return {
          content: 'Your Text Here',
          fontSize: 24,
          fontColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
        };
      case 'timer':
        return {
          content: '00:00:00',
          fontSize: 36,
          fontColor: '#FFD700',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 8,
        };
      case 'scoreboard':
        return {
          content: 'Team A: 0 | Team B: 0',
          fontSize: 28,
          fontColor: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 10,
        };
      default:
        return {};
    }
  }

  private getNextZIndex(): number {
    const maxZ = Math.max(0, ...this.overlays().map(o => o.zIndex));
    return maxZ + 1;
  }

  private saveToStorage(): void {
    localStorage.setItem('stream_overlays', JSON.stringify(this.overlays()));
  }
}
