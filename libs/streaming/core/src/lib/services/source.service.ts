import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Source, SourceType, Filter, Transform } from '../models/source.model';

@Injectable({
  providedIn: 'root'
})
export class SourceService {
  private sourcesSubject = new BehaviorSubject<Source[]>([]);

  public readonly sources$ = this.sourcesSubject.asObservable();

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

    const sources = [...this.sourcesSubject.value, source];
    this.sourcesSubject.next(sources);

    return source;
  }

  /**
   * Delete a source
   */
  deleteSource(sourceId: string): void {
    const sources = this.sourcesSubject.value.filter((s) => s.id !== sourceId);
    this.sourcesSubject.next(sources);
  }

  /**
   * Get a source by ID
   */
  getSource(sourceId: string): Observable<Source | null> {
    return new Observable((observer) => {
      const subscription = this.sources$.subscribe((sources) => {
        const source = sources.find((s) => s.id === sourceId);
        observer.next(source || null);
      });

      return () => subscription.unsubscribe();
    });
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
    const sources = this.sourcesSubject.value;
    const source = sources.find((s) => s.id === sourceId);

    if (!source) return;

    const updatedSource = {
      ...source,
      transform: {
        ...source.transform,
        ...transform
      }
    };

    this.sourcesSubject.next(
      sources.map((s) => (s.id === sourceId ? updatedSource : s))
    );
  }

  /**
   * Add filter to source
   */
  addFilter(sourceId: string, filter: Filter): void {
    const sources = this.sourcesSubject.value;
    const source = sources.find((s) => s.id === sourceId);

    if (!source) return;

    const updatedSource = {
      ...source,
      filters: [...source.filters, filter]
    };

    this.sourcesSubject.next(
      sources.map((s) => (s.id === sourceId ? updatedSource : s))
    );
  }

  /**
   * Remove filter from source
   */
  removeFilter(sourceId: string, filterId: string): void {
    const sources = this.sourcesSubject.value;
    const source = sources.find((s) => s.id === sourceId);

    if (!source) return;

    const updatedSource = {
      ...source,
      filters: source.filters.filter((f) => f.id !== filterId)
    };

    this.sourcesSubject.next(
      sources.map((s) => (s.id === sourceId ? updatedSource : s))
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
    const source = this.sourcesSubject.value.find((s) => s.id === sourceId);

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

    const sources = [...this.sourcesSubject.value, duplicatedSource];
    this.sourcesSubject.next(sources);

    return duplicatedSource;
  }

  /**
   * Update source
   */
  private updateSource(sourceId: string, updates: Partial<Source>): void {
    const sources = this.sourcesSubject.value.map((source) => {
      if (source.id === sourceId) {
        return { ...source, ...updates };
      }
      return source;
    });

    this.sourcesSubject.next(sources);
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
