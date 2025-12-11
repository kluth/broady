import { Component, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { SceneService } from '../../services/scene.service';
import { SourceService } from '../../services/source.service';
import { SourceType, Source } from '../../models/source.model';

interface SourceTypeOption {
  type: SourceType;
  name: string;
  description: string;
  icon: string;
  category: 'video' | 'audio' | 'media' | 'other';
}

@Component({
  selector: 'streaming-sources-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './sources-manager.component.html',
  styleUrls: ['./sources-manager.component.css']
})
export class SourcesManagerComponent {
  // Events
  readonly onSourceSelected = output<Source>();
  readonly onSourceAdded = output<Source>();

  // UI state
  private showAddDialogSignal = signal<boolean>(false);
  private selectedSourceIdSignal = signal<string | null>(null);
  private draggedSourceIdSignal = signal<string | null>(null);

  readonly showAddDialog = this.showAddDialogSignal.asReadonly();
  readonly selectedSourceId = this.selectedSourceIdSignal.asReadonly();
  readonly draggedSourceId = this.draggedSourceIdSignal.asReadonly();

  // Add source form
  private newSourceNameSignal = signal<string>('');
  private selectedSourceTypeSignal = signal<SourceType>(SourceType.VIDEO_CAPTURE);

  readonly newSourceName = this.newSourceNameSignal.asReadonly();
  readonly selectedSourceType = this.selectedSourceTypeSignal.asReadonly();

  // Available source types
  readonly sourceTypes: SourceTypeOption[] = [
    {
      type: SourceType.VIDEO_CAPTURE,
      name: 'Video Capture Device',
      description: 'Webcam, capture card',
      icon: '📹',
      category: 'video'
    },
    {
      type: SourceType.SCREEN_CAPTURE,
      name: 'Display Capture',
      description: 'Capture entire screen',
      icon: '🖥️',
      category: 'video'
    },
    {
      type: SourceType.WINDOW_CAPTURE,
      name: 'Window Capture',
      description: 'Capture specific window',
      icon: '🪟',
      category: 'video'
    },
    {
      type: SourceType.GAME_CAPTURE,
      name: 'Game Capture',
      description: 'Optimized game capture',
      icon: '🎮',
      category: 'video'
    },
    {
      type: SourceType.BROWSER,
      name: 'Browser Source',
      description: 'Web page, overlays',
      icon: '🌐',
      category: 'other'
    },
    {
      type: SourceType.IMAGE,
      name: 'Image',
      description: 'Static image file',
      icon: '🖼️',
      category: 'media'
    },
    {
      type: SourceType.MEDIA,
      name: 'Media Source',
      description: 'Video/audio files',
      icon: '📺',
      category: 'media'
    },
    {
      type: SourceType.TEXT,
      name: 'Text (GDI+)',
      description: 'Scrolling or static text',
      icon: '📝',
      category: 'other'
    },
    {
      type: SourceType.COLOR_SOURCE,
      name: 'Color Source',
      description: 'Solid color background',
      icon: '🎨',
      category: 'other'
    },
    {
      type: SourceType.AUDIO_INPUT,
      name: 'Audio Input Capture',
      description: 'Microphone, line in',
      icon: '🎤',
      category: 'audio'
    },
    {
      type: SourceType.AUDIO_OUTPUT,
      name: 'Audio Output Capture',
      description: 'Desktop audio',
      icon: '🔊',
      category: 'audio'
    }
  ];

  // Computed values
  readonly activeScene = computed(() => this.sceneService.activeScene());

  readonly sceneSources = computed(() => {
    const scene = this.activeScene();
    if (!scene) return [];

    return scene.sources
      .sort((a, b) => a.order - b.order)
      .map(item => item.source);
  });

  readonly hasSelectedSource = computed(() => this.selectedSourceId() !== null);

  readonly selectedSource = computed(() => {
    const id = this.selectedSourceId();
    if (!id) return null;
    return this.sceneSources().find(s => s.id === id) || null;
  });

  readonly categorizedSourceTypes = computed(() => {
    const categories: Record<string, SourceTypeOption[]> = {
      video: [],
      audio: [],
      media: [],
      other: []
    };

    this.sourceTypes.forEach(type => {
      categories[type.category].push(type);
    });

    return categories;
  });

  constructor(
    public sceneService: SceneService,
    private sourceService: SourceService
  ) {}

  // Source selection
  selectSource(sourceId: string): void {
    this.selectedSourceIdSignal.set(sourceId);
    const source = this.sceneSources().find(s => s.id === sourceId);
    if (source) {
      this.onSourceSelected.emit(source);
    }
  }

  // Add source dialog
  openAddDialog(): void {
    this.showAddDialogSignal.set(true);
    this.newSourceNameSignal.set('');
    this.selectedSourceTypeSignal.set(SourceType.VIDEO_CAPTURE);
  }

  closeAddDialog(): void {
    this.showAddDialogSignal.set(false);
  }

  updateSourceName(name: string): void {
    this.newSourceNameSignal.set(name);
  }

  selectSourceType(type: SourceType): void {
    this.selectedSourceTypeSignal.set(type);
  }

  addSource(): void {
    const name = this.newSourceName();
    const type = this.selectedSourceType();

    if (!name.trim()) {
      alert('Please enter a source name');
      return;
    }

    const source = this.sourceService.createSource(name, type);

    // Add to active scene
    const scene = this.activeScene();
    if (scene) {
      this.sceneService.addSourceToScene(scene.id, source);
    }

    this.onSourceAdded.emit(source);
    this.closeAddDialog();
  }

  // Source management
  removeSource(sourceId: string): void {
    if (confirm('Are you sure you want to remove this source?')) {
      const scene = this.activeScene();
      if (scene) {
        this.sceneService.removeSourceFromScene(scene.id, sourceId);
      }

      if (this.selectedSourceId() === sourceId) {
        this.selectedSourceIdSignal.set(null);
      }
    }
  }

  duplicateSource(sourceId: string): void {
    const duplicated = this.sourceService.duplicateSource(sourceId);
    if (duplicated) {
      const scene = this.activeScene();
      if (scene) {
        this.sceneService.addSourceToScene(scene.id, duplicated);
      }
    }
  }

  toggleSourceVisibility(sourceId: string): void {
    this.sourceService.toggleVisibility(sourceId);
  }

  toggleSourceLock(sourceId: string): void {
    const source = this.sceneSources().find(s => s.id === sourceId);
    if (source) {
      this.sourceService.updateSource(sourceId, { locked: !source.locked });
    }
  }

  // Drag and drop
  onDragStart(sourceId: string, event: DragEvent): void {
    this.draggedSourceIdSignal.set(sourceId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', sourceId);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(targetSourceId: string, event: DragEvent): void {
    event.preventDefault();

    const draggedId = this.draggedSourceId();
    if (!draggedId || draggedId === targetSourceId) {
      this.draggedSourceIdSignal.set(null);
      return;
    }

    const scene = this.activeScene();
    if (!scene) return;

    // Get current order
    const sources = [...scene.sources];
    const draggedIndex = sources.findIndex(s => s.source.id === draggedId);
    const targetIndex = sources.findIndex(s => s.source.id === targetSourceId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder
    const [removed] = sources.splice(draggedIndex, 1);
    sources.splice(targetIndex, 0, removed);

    // Update orders
    sources.forEach((item, index) => {
      item.order = index;
    });

    // Update scene (in a real implementation, would call sceneService.updateSourceOrder)
    console.log('Reordered sources:', sources);

    this.draggedSourceIdSignal.set(null);
  }

  onDragEnd(): void {
    this.draggedSourceIdSignal.set(null);
  }

  // Move sources up/down
  moveSourceUp(sourceId: string): void {
    const scene = this.activeScene();
    if (!scene) return;

    const sources = [...scene.sources].sort((a, b) => a.order - b.order);
    const index = sources.findIndex(s => s.source.id === sourceId);

    if (index > 0) {
      [sources[index - 1], sources[index]] = [sources[index], sources[index - 1]];
      sources.forEach((item, i) => item.order = i);
      console.log('Moved source up');
    }
  }

  moveSourceDown(sourceId: string): void {
    const scene = this.activeScene();
    if (!scene) return;

    const sources = [...scene.sources].sort((a, b) => a.order - b.order);
    const index = sources.findIndex(s => s.source.id === sourceId);

    if (index < sources.length - 1) {
      [sources[index], sources[index + 1]] = [sources[index + 1], sources[index]];
      sources.forEach((item, i) => item.order = i);
      console.log('Moved source down');
    }
  }

  moveToTop(sourceId: string): void {
    console.log('Move to top:', sourceId);
  }

  moveToBottom(sourceId: string): void {
    console.log('Move to bottom:', sourceId);
  }

  // Context menu actions
  renameSource(sourceId: string): void {
    const source = this.sceneSources().find(s => s.id === sourceId);
    if (!source) return;

    const newName = prompt('Enter new name:', source.name);
    if (newName && newName.trim()) {
      this.sourceService.updateSource(sourceId, { name: newName.trim() });
    }
  }

  getSourceIcon(type: SourceType): string {
    const option = this.sourceTypes.find(t => t.type === type);
    return option?.icon || '📦';
  }
}
