import { Component, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Scene } from '../../models/scene.model';
import { SceneService } from '../../services/scene.service';

@Component({
  selector: 'lib-scene-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="scene-list">
      <mat-card-header>
        <mat-card-title>Scenes</mat-card-title>
        <button mat-raised-button color="primary" (click)="onAddScene()">
          <mat-icon>add</mat-icon>
          Add Scene
        </button>
      </mat-card-header>

      <mat-card-content>
        <mat-list class="scene-items">
          @for (scene of sceneService.scenes(); track scene.id) {
            <mat-list-item
              class="scene-item"
              [class.active]="scene.id === sceneService.activeSceneId()"
              (click)="onSceneClick(scene)"
              (keyup.enter)="onSceneClick(scene)"
              (keyup.space)="onSceneClick(scene)"
              tabindex="0"
              role="button"
            >
              <div matListItemTitle>{{ scene.name }}</div>
              <div matListItemMeta class="scene-actions">
                @if (scene.locked) {
                  <mat-icon color="warn">lock</mat-icon>
                }
                <button mat-icon-button (click)="onEditScene(scene, $event)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="onDuplicateScene(scene, $event)" matTooltip="Duplicate">
                  <mat-icon>content_copy</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDeleteScene(scene, $event)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </mat-list-item>
          } @empty {
            <div class="empty-state">
              <mat-icon class="empty-icon">layers</mat-icon>
              <p>No scenes yet</p>
              <button mat-raised-button color="accent" (click)="onAddScene()">
                <mat-icon>add</mat-icon>
                Create First Scene
              </button>
            </div>
          }
        </mat-list>

        @if (sceneService.isTransitioning()) {
          <div class="transition-indicator">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Transitioning...</span>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .scene-list {
      height: 100%;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
    }

    .scene-items {
      max-height: 500px;
      overflow-y: auto;
    }

    .scene-item {
      cursor: pointer;
      transition: background 0.2s;
    }

    .scene-item.active {
      background: rgba(63, 81, 181, 0.2);
    }

    .scene-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .scene-item:hover .scene-actions {
      opacity: 1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .transition-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      justify-content: center;
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
