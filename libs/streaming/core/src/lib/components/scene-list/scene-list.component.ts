import { Component, output, effect, inject } from '@angular/core';
import { Scene } from '../../models/scene.model';
import { SceneService } from '../../services/scene.service';

@Component({
  selector: 'lib-scene-list',
  standalone: true,
  imports: [],
  template: `
    <div class="scene-list">
      <div class="scene-list-header">
        <h3>Scenes</h3>
        <button (click)="onAddScene()" class="btn-add">+ Add Scene</button>
      </div>

      <div class="scene-items">
        @for (scene of sceneService.scenes(); track scene.id) {
          <div
            class="scene-item"
            [class.active]="scene.id === sceneService.activeSceneId()"
            (click)="onSceneClick(scene)"
            (keyup.enter)="onSceneClick(scene)"
            (keyup.space)="onSceneClick(scene)"
            tabindex="0"
            role="button"
          >
            <div class="scene-name">{{ scene.name }}</div>
            <div class="scene-actions">
              @if (scene.locked) {
                <span class="icon-lock">🔒</span>
              }
              <button (click)="onEditScene(scene, $event)" class="btn-icon">✏️</button>
              <button (click)="onDuplicateScene(scene, $event)" class="btn-icon">📋</button>
              <button (click)="onDeleteScene(scene, $event)" class="btn-icon">🗑️</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>No scenes yet</p>
            <button (click)="onAddScene()" class="btn-primary">Create First Scene</button>
          </div>
        }
      </div>

      @if (sceneService.isTransitioning()) {
        <div class="transition-indicator">
          <div class="spinner"></div>
          <span>Transitioning...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .scene-list {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      color: #fff;
    }

    .scene-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #333;
    }

    .scene-items {
      flex: 1;
      overflow-y: auto;
    }

    .scene-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid #222;
      transition: background 0.2s;
    }

    .scene-item:hover {
      background: #252525;
    }

    .scene-item.active {
      background: #2a7fff;
    }

    .scene-actions {
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .scene-item:hover .scene-actions {
      opacity: 1;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
    }

    .btn-add, .btn-primary {
      padding: 0.5rem 1rem;
      background: #2a7fff;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-add:hover, .btn-primary:hover {
      background: #1e5fd9;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #888;
    }

    .transition-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #2a2a2a;
      border-top: 1px solid #333;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #444;
      border-top-color: #2a7fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SceneListComponent {
  // Modern Angular inputs/outputs
  readonly sceneSelected = output<Scene>();
  readonly sceneDeleted = output<Scene>();

  readonly sceneService = inject(SceneService);

  constructor() {
    // Using effect for side effects
    effect(() => {
      console.log('Current scenes:', this.sceneService.scenes().length);
    });
  }

  onSceneClick(scene: Scene): void {
    this.sceneService.setActiveScene(scene.id);
    this.sceneSelected.emit(scene);
  }

  onAddScene(): void {
    const name = prompt('Enter scene name:');
    if (name) {
      this.sceneService.createScene(name);
    }
  }

  onEditScene(scene: Scene, event: Event): void {
    event.stopPropagation();
    const newName = prompt('Enter new name:', scene.name);
    if (newName && newName !== scene.name) {
      this.sceneService.renameScene(scene.id, newName);
    }
  }

  onDuplicateScene(scene: Scene, event: Event): void {
    event.stopPropagation();
    this.sceneService.duplicateScene(scene.id);
  }

  onDeleteScene(scene: Scene, event: Event): void {
    event.stopPropagation();
    if (confirm(`Delete scene "${scene.name}"?`)) {
      this.sceneService.deleteScene(scene.id);
      this.sceneDeleted.emit(scene);
    }
  }
}
