import { Injectable, signal, computed } from '@angular/core';
import {
  Scene,
  SceneCollection,
  SceneItem,
  Transition,
  TransitionType
} from '../models/scene.model';
import { Source } from '../models/source.model';

@Injectable({
  providedIn: 'root'
})
export class SceneService {
  // Signals - much cleaner than BehaviorSubject!
  private scenesSignal = signal<Scene[]>([]);
  private activeSceneIdSignal = signal<string | null>(null);
  private sceneCollectionsSignal = signal<SceneCollection[]>([]);
  private activeCollectionIdSignal = signal<string | null>(null);
  private isTransitioningSignal = signal<boolean>(false);
  private defaultTransitionSignal = signal<Transition>({
    type: TransitionType.FADE,
    duration: 300,
    settings: {}
  });

  // Public readonly signals
  public readonly scenes = this.scenesSignal.asReadonly();
  public readonly activeSceneId = this.activeSceneIdSignal.asReadonly();
  public readonly sceneCollections = this.sceneCollectionsSignal.asReadonly();
  public readonly activeCollectionId = this.activeCollectionIdSignal.asReadonly();
  public readonly isTransitioning = this.isTransitioningSignal.asReadonly();
  public readonly defaultTransition = this.defaultTransitionSignal.asReadonly();

  // Computed signal for active scene
  public readonly activeScene = computed(() => {
    const id = this.activeSceneIdSignal();
    if (!id) return null;
    return this.scenesSignal().find((s) => s.id === id) || null;
  });

  // No initialization needed

  /**
   * Create a new scene
   */
  createScene(name: string): Scene {
    const scene: Scene = {
      id: this.generateId(),
      name,
      sources: [],
      enabled: true,
      locked: false
    };

    this.scenesSignal.update(scenes => [...scenes, scene]);

    // Set as active if it's the first scene
    if (this.scenesSignal().length === 1) {
      this.setActiveScene(scene.id);
    }

    return scene;
  }

  /**
   * Delete a scene
   */
  deleteScene(sceneId: string): void {
    this.scenesSignal.update(scenes => scenes.filter((s) => s.id !== sceneId));

    // If deleted scene was active, switch to another
    const scenes = this.scenesSignal();
    if (this.activeSceneIdSignal() === sceneId && scenes.length > 0) {
      this.setActiveScene(scenes[0].id);
    }
  }

  /**
   * Rename a scene
   */
  renameScene(sceneId: string, newName: string): void {
    this.scenesSignal.update(scenes =>
      scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, name: newName } : scene
      )
    );
  }

  /**
   * Duplicate a scene
   */
  duplicateScene(sceneId: string): Scene | null {
    const sourceScene = this.scenesSignal().find((s) => s.id === sceneId);
    if (!sourceScene) return null;

    const duplicatedScene: Scene = {
      ...sourceScene,
      id: this.generateId(),
      name: `${sourceScene.name} (Copy)`,
      sources: sourceScene.sources.map((item) => ({
        ...item,
        id: this.generateId()
      }))
    };

    this.scenesSignal.update(scenes => [...scenes, duplicatedScene]);

    return duplicatedScene;
  }

  /**
   * Get a specific scene by ID
   */
  getScene(sceneId: string): Scene | null {
    return this.scenesSignal().find((s) => s.id === sceneId) || null;
  }

  /**
   * Set the active scene
   */
  setActiveScene(sceneId: string): void {
    const scene = this.scenesSignal().find((s) => s.id === sceneId);
    if (scene) {
      this.activeSceneIdSignal.set(sceneId);
    }
  }

  /**
   * Transition to a scene with animation
   */
  transitionToScene(sceneId: string, transition?: Transition): void {
    const targetScene = this.scenesSignal().find((s) => s.id === sceneId);
    if (!targetScene) return;

    const transitionToUse = transition || this.defaultTransitionSignal();

    this.isTransitioningSignal.set(true);

    // Simulate transition
    setTimeout(() => {
      this.setActiveScene(sceneId);
      this.isTransitioningSignal.set(false);
    }, transitionToUse.duration);
  }

  /**
   * Add a source to a scene
   */
  addSourceToScene(sceneId: string, source: Source, order?: number): SceneItem | null {
    const scenes = this.scenesSignal();
    const scene = scenes.find((s) => s.id === sceneId);

    if (!scene) return null;

    const sceneItem: SceneItem = {
      id: this.generateId(),
      sourceId: source.id,
      source,
      order: order !== undefined ? order : scene.sources.length,
      visible: true,
      locked: false
    };

    const updatedScene = {
      ...scene,
      sources: [...scene.sources, sceneItem].sort((a, b) => a.order - b.order)
    };

    this.scenesSignal.update(scenes =>
      scenes.map((s) => (s.id === sceneId ? updatedScene : s))
    );

    return sceneItem;
  }

  /**
   * Remove a source from a scene
   */
  removeSourceFromScene(sceneId: string, sceneItemId: string): void {
    this.scenesSignal.update(scenes =>
      scenes.map(scene => {
        if (scene.id === sceneId) {
          return {
            ...scene,
            sources: scene.sources.filter((item) => item.id !== sceneItemId)
          };
        }
        return scene;
      })
    );
  }

  /**
   * Reorder a scene item
   */
  reorderSceneItem(sceneId: string, sceneItemId: string, newOrder: number): void {
    this.scenesSignal.update(scenes =>
      scenes.map(scene => {
        if (scene.id === sceneId) {
          const sources = [...scene.sources];
          const itemIndex = sources.findIndex((item) => item.id === sceneItemId);

          if (itemIndex === -1) return scene;

          // Remove item
          const [item] = sources.splice(itemIndex, 1);

          // Insert at new position
          sources.splice(newOrder, 0, item);

          // Update order values
          const updatedSources = sources.map((source, index) => ({
            ...source,
            order: index
          }));

          return {
            ...scene,
            sources: updatedSources
          };
        }
        return scene;
      })
    );
  }

  /**
   * Update scene item transform
   */
  updateSceneItemTransform(
    sceneId: string,
    sceneItemId: string,
    transform: Partial<SceneItem['source']['transform']>
  ): void {
    this.scenesSignal.update(scenes =>
      scenes.map(scene => {
        if (scene.id === sceneId) {
          const updatedSources = scene.sources.map((item) => {
            if (item.id === sceneItemId) {
              return {
                ...item,
                source: {
                  ...item.source,
                  transform: {
                    ...item.source.transform,
                    ...transform
                  }
                }
              };
            }
            return item;
          });

          return {
            ...scene,
            sources: updatedSources
          };
        }
        return scene;
      })
    );
  }

  /**
   * Set default transition
   */
  setDefaultTransition(transition: Transition): void {
    this.defaultTransitionSignal.set(transition);
  }

  /**
   * Set transition duration
   */
  setTransitionDuration(duration: number): void {
    this.defaultTransitionSignal.update(transition => ({
      ...transition,
      duration
    }));
  }

  /**
   * Create a scene collection
   */
  createSceneCollection(name: string): SceneCollection {
    const collection: SceneCollection = {
      id: this.generateId(),
      name,
      scenes: [...this.scenesSignal()],
      activeSceneId: this.activeSceneIdSignal() || ''
    };

    this.sceneCollectionsSignal.update(collections => [...collections, collection]);
    this.activeCollectionIdSignal.set(collection.id);

    return collection;
  }

  /**
   * Load a scene collection
   */
  loadSceneCollection(collectionId: string): void {
    const collection = this.sceneCollectionsSignal().find(
      (c) => c.id === collectionId
    );

    if (!collection) return;

    this.scenesSignal.set([...collection.scenes]);
    this.activeSceneIdSignal.set(collection.activeSceneId);
    this.activeCollectionIdSignal.set(collectionId);
  }

  /**
   * Delete a scene collection
   */
  deleteSceneCollection(collectionId: string): void {
    this.sceneCollectionsSignal.update(collections =>
      collections.filter((c) => c.id !== collectionId)
    );
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
