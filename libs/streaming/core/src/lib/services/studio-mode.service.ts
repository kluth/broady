import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StudioMode, StudioModeState } from '../models/studio-mode.model';
import { TransitionType } from '../models/scene.model';

@Injectable({
  providedIn: 'root'
})
export class StudioModeService {
  private studioModeSubject = new BehaviorSubject<StudioMode>({
    enabled: false,
    previewSceneId: '',
    programSceneId: '',
    transition: {
      type: 'fade',
      duration: 300,
      settings: {}
    },
    verticalLayout: false
  });

  private studioModeStateSubject = new BehaviorSubject<StudioModeState>({
    inStudioMode: false,
    inTransition: false,
    transitionProgress: 0,
    previewScene: '',
    programScene: ''
  });

  public readonly studioMode$ = this.studioModeSubject.asObservable();
  public readonly studioModeState$ = this.studioModeStateSubject.asObservable();

  /**
   * Enable studio mode
   */
  enableStudioMode(programSceneId: string, previewSceneId?: string): void {
    const studioMode = this.studioModeSubject.value;

    this.studioModeSubject.next({
      ...studioMode,
      enabled: true,
      programSceneId,
      previewSceneId: previewSceneId || programSceneId
    });

    this.studioModeStateSubject.next({
      inStudioMode: true,
      inTransition: false,
      transitionProgress: 0,
      previewScene: previewSceneId || programSceneId,
      programScene: programSceneId
    });
  }

  /**
   * Disable studio mode
   */
  disableStudioMode(): void {
    const studioMode = this.studioModeSubject.value;

    this.studioModeSubject.next({
      ...studioMode,
      enabled: false
    });

    this.studioModeStateSubject.next({
      inStudioMode: false,
      inTransition: false,
      transitionProgress: 0,
      previewScene: '',
      programScene: studioMode.programSceneId
    });
  }

  /**
   * Set preview scene
   */
  setPreviewScene(sceneId: string): void {
    const studioMode = this.studioModeSubject.value;
    const state = this.studioModeStateSubject.value;

    if (!studioMode.enabled) {
      throw new Error('Studio mode is not enabled');
    }

    this.studioModeSubject.next({
      ...studioMode,
      previewSceneId: sceneId
    });

    this.studioModeStateSubject.next({
      ...state,
      previewScene: sceneId
    });
  }

  /**
   * Transition to preview (go live)
   */
  async transitionToPreview(): Promise<void> {
    const studioMode = this.studioModeSubject.value;
    const state = this.studioModeStateSubject.value;

    if (!studioMode.enabled) {
      throw new Error('Studio mode is not enabled');
    }

    // Start transition
    this.studioModeStateSubject.next({
      ...state,
      inTransition: true,
      transitionProgress: 0
    });

    // Simulate transition progress
    const duration = studioMode.transition.duration;
    const steps = 60;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));

      const progress = i / steps;
      this.studioModeStateSubject.next({
        ...this.studioModeStateSubject.value,
        transitionProgress: progress
      });
    }

    // Complete transition
    const newProgramScene = studioMode.previewSceneId;

    this.studioModeSubject.next({
      ...studioMode,
      programSceneId: newProgramScene
    });

    this.studioModeStateSubject.next({
      inStudioMode: true,
      inTransition: false,
      transitionProgress: 1,
      previewScene: newProgramScene,
      programScene: newProgramScene
    });
  }

  /**
   * Swap preview and program scenes
   */
  swapScenes(): void {
    const studioMode = this.studioModeSubject.value;
    const state = this.studioModeStateSubject.value;

    if (!studioMode.enabled) {
      throw new Error('Studio mode is not enabled');
    }

    this.studioModeSubject.next({
      ...studioMode,
      previewSceneId: studioMode.programSceneId,
      programSceneId: studioMode.previewSceneId
    });

    this.studioModeStateSubject.next({
      ...state,
      previewScene: studioMode.programSceneId,
      programScene: studioMode.previewSceneId
    });
  }

  /**
   * Set transition type
   */
  setTransition(type: string, duration: number, settings: any = {}): void {
    const studioMode = this.studioModeSubject.value;

    this.studioModeSubject.next({
      ...studioMode,
      transition: {
        type,
        duration,
        settings
      }
    });
  }

  /**
   * Toggle layout orientation
   */
  toggleLayout(): void {
    const studioMode = this.studioModeSubject.value;

    this.studioModeSubject.next({
      ...studioMode,
      verticalLayout: !studioMode.verticalLayout
    });
  }
}
