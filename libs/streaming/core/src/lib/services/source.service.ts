import { Injectable, signal, computed } from '@angular/core';
import { Source, SourceType, Filter, Transform } from '../models/source.model';

@Injectable({
  providedIn: 'root'
})
export class SourceService {
  // Signals - much cleaner than BehaviorSubject!
  private sourcesSignal = signal<Source[]>([]);

  // Public readonly signals
  public readonly sources = this.sourcesSignal.asReadonly();

  constructor() {}

  /**
   * Create a new source
   */
  createSource(
    name: string,
    type: SourceType,
    settings: any = {}
  ): Source {
    const source: Source = {
      id: this.generateId(),
      name,
      type,
      enabled: true,
      settings,
      transform: this.getDefaultTransform(),
      filters: [],
      volume: 1.0,
      muted: false,
      locked: false,
      visible: true
    };

    this.sourcesSignal.update(sources => [...sources, source]);

    return source;
  }

  /**
   * Delete a source
   */
  deleteSource(sourceId: string): void {
    this.sourcesSignal.update(sources => sources.filter((s) => s.id !== sourceId));
  }

  /**
   * Get a source by ID
   */
  getSource(sourceId: string): Source | null {
    return this.sourcesSignal().find((s) => s.id === sourceId) || null;
  }

  /**
   * Update source settings
   */
  updateSourceSettings(sourceId: string, settings: any): void {
    this.updateSource(sourceId, { settings });
  }

  /**
   * Update source transform
   */
  updateSourceTransform(sourceId: string, transform: Partial<Transform>): void {
    this.sourcesSignal.update(sources =>
      sources.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            transform: {
              ...source.transform,
              ...transform
            }
          };
        }
        return source;
      })
    );
  }

  /**
   * Add filter to source
   */
  addFilter(sourceId: string, filter: Filter): void {
    this.sourcesSignal.update(sources =>
      sources.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            filters: [...source.filters, filter]
          };
        }
        return source;
      })
    );
  }

  /**
   * Remove filter from source
   */
  removeFilter(sourceId: string, filterId: string): void {
    this.sourcesSignal.update(sources =>
      sources.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            filters: source.filters.filter((f) => f.id !== filterId)
          };
        }
        return source;
      })
    );
  }

  /**
   * Update filter settings
   */
  updateFilter(sourceId: string, filterId: string, updates: Partial<Filter>): void {
    this.sourcesSignal.update(sources =>
      sources.map(source => {
        if (source.id === sourceId) {
          return {
            ...source,
            filters: source.filters.map(filter =>
              filter.id === filterId ? { ...filter, ...updates } : filter
            )
          };
        }
        return source;
      })
    );
  }

  /**
   * Toggle source visibility
   */
  toggleVisibility(sourceId: string): void {
    const sources = this.sourcesSubject.value;
    const source = sources.find((s) => s.id === sourceId);

    if (!source) return;

    this.updateSource(sourceId, { visible: !source.visible });
  }

  /**
   * Set source volume
   */
  setVolume(sourceId: string, volume: number): void {
    this.updateSource(sourceId, { volume: Math.max(0, Math.min(1, volume)) });
  }

  /**
   * Mute source
   */
  mute(sourceId: string): void {
    this.updateSource(sourceId, { muted: true });
  }

  /**
   * Unmute source
   */
  unmute(sourceId: string): void {
    this.updateSource(sourceId, { muted: false });
  }

  /**
   * Lock source
   */
  lock(sourceId: string): void {
    this.updateSource(sourceId, { locked: true });
  }

  /**
   * Unlock source
   */
  unlock(sourceId: string): void {
    this.updateSource(sourceId, { locked: false });
  }

  /**
   * Duplicate source
   */
  duplicateSource(sourceId: string): Source | null {
    const source = this.sourcesSignal().find((s) => s.id === sourceId);

    if (!source) return null;

    const duplicatedSource: Source = {
      ...source,
      id: this.generateId(),
      name: `${source.name} (Copy)`,
      transform: {
        ...source.transform,
        position: {
          x: source.transform.position.x + 20,
          y: source.transform.position.y + 20
        }
      }
    };

    this.sourcesSignal.update(sources => [...sources, duplicatedSource]);

    return duplicatedSource;
  }

  /**
   * Update source
   */
  updateSource(sourceId: string, updates: Partial<Source>): void {
    this.sourcesSignal.update(sources =>
      sources.map((source) => {
        if (source.id === sourceId) {
          return { ...source, ...updates };
        }
        return source;
      })
    );
  }

  /**
   * Get default transform
   */
  private getDefaultTransform(): Transform {
    return {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
      alignment: 5,
      boundsType: 'none',
      boundsAlignment: 0,
      bounds: { x: 1920, y: 1080 }
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
