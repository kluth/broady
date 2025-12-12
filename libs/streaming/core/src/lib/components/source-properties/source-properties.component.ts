import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Source, Transform, Filter, FilterType } from '../../models/source.model';
import { SourceService } from '../../services/source.service';

@Component({
  selector: 'streaming-source-properties',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './source-properties.component.html',
  styleUrls: ['./source-properties.component.css']
})
export class SourcePropertiesComponent {
  // Input for the selected source
  readonly sourceId = input<string | null>(null);

  // Events
  readonly propertyChanged = output<{ sourceId: string; property: string; value: any }>();
  readonly filterAdded = output<{ sourceId: string; filterType: FilterType }>();
  readonly filterRemoved = output<{ sourceId: string; filterId: string }>();

  // UI state
  private selectedTabSignal = signal<'transform' | 'filters' | 'audio' | 'advanced'>('transform');
  readonly selectedTab = this.selectedTabSignal.asReadonly();

  // Computed source from service
  readonly source = computed(() => {
    const id = this.sourceId();
    if (!id) return null;
    return this.sourceService.getSource(id);
  });

  readonly hasFilters = computed(() => {
    const src = this.source();
    return src && src.filters && src.filters.length > 0;
  });

  readonly transform = computed(() => this.source()?.transform);
  readonly filters = computed(() => this.source()?.filters || []);

  // Available filter types for dropdown
  readonly filterTypes = Object.values(FilterType);

  constructor(private sourceService: SourceService) {}

  selectTab(tab: 'transform' | 'filters' | 'audio' | 'advanced'): void {
    this.selectedTabSignal.set(tab);
  }

  // Transform controls
  updatePosition(axis: 'x' | 'y', value: number): void {
    const src = this.source();
    if (!src) return;

    const newTransform: Transform = {
      ...src.transform,
      position: { ...src.transform.position, [axis]: value }
    };

    this.sourceService.updateSource(src.id, { transform: newTransform });
    this.propertyChanged.emit({ sourceId: src.id, property: `position.${axis}`, value });
  }

  updateScale(axis: 'x' | 'y', value: number): void {
    const src = this.source();
    if (!src) return;

    const newTransform: Transform = {
      ...src.transform,
      scale: { ...src.transform.scale, [axis]: value }
    };

    this.sourceService.updateSource(src.id, { transform: newTransform });
    this.propertyChanged.emit({ sourceId: src.id, property: `scale.${axis}`, value });
  }

  updateRotation(value: number): void {
    const src = this.source();
    if (!src) return;

    const newTransform: Transform = {
      ...src.transform,
      rotation: value
    };

    this.sourceService.updateSource(src.id, { transform: newTransform });
    this.propertyChanged.emit({ sourceId: src.id, property: 'rotation', value });
  }

  updateCrop(edge: 'top' | 'bottom' | 'left' | 'right', value: number): void {
    const src = this.source();
    if (!src) return;

    const newTransform: Transform = {
      ...src.transform,
      crop: { ...src.transform.crop, [edge]: value }
    };

    this.sourceService.updateSource(src.id, { transform: newTransform });
    this.propertyChanged.emit({ sourceId: src.id, property: `crop.${edge}`, value });
  }

  updateBoundsType(type: 'none' | 'stretch' | 'scale' | 'crop'): void {
    const src = this.source();
    if (!src) return;

    const newTransform: Transform = {
      ...src.transform,
      boundsType: type
    };

    this.sourceService.updateSource(src.id, { transform: newTransform });
    this.propertyChanged.emit({ sourceId: src.id, property: 'boundsType', value: type });
  }

  // Audio controls
  updateVolume(value: number): void {
    const src = this.source();
    if (!src) return;

    this.sourceService.updateSource(src.id, { volume: value });
    this.propertyChanged.emit({ sourceId: src.id, property: 'volume', value });
  }

  toggleMute(): void {
    const src = this.source();
    if (!src) return;

    this.sourceService.updateSource(src.id, { muted: !src.muted });
    this.propertyChanged.emit({ sourceId: src.id, property: 'muted', value: !src.muted });
  }

  // Visibility controls
  toggleVisibility(): void {
    const src = this.source();
    if (!src) return;

    this.sourceService.updateSource(src.id, { visible: !src.visible });
    this.propertyChanged.emit({ sourceId: src.id, property: 'visible', value: !src.visible });
  }

  toggleLock(): void {
    const src = this.source();
    if (!src) return;

    this.sourceService.updateSource(src.id, { locked: !src.locked });
    this.propertyChanged.emit({ sourceId: src.id, property: 'locked', value: !src.locked });
  }

  // Filter management
  addFilter(filterType: FilterType): void {
    const src = this.source();
    if (!src) return;

    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      name: this.getFilterName(filterType),
      type: filterType,
      enabled: true,
      settings: this.getDefaultFilterSettings(filterType)
    };

    this.sourceService.addFilter(src.id, newFilter);
    this.filterAdded.emit({ sourceId: src.id, filterType });
  }

  removeFilter(filterId: string): void {
    const src = this.source();
    if (!src) return;

    this.sourceService.removeFilter(src.id, filterId);
    this.filterRemoved.emit({ sourceId: src.id, filterId });
  }

  toggleFilter(filterId: string): void {
    const src = this.source();
    if (!src) return;

    const filter = src.filters.find(f => f.id === filterId);
    if (!filter) return;

    this.sourceService.updateFilter(src.id, filterId, { enabled: !filter.enabled });
  }

  moveFilterUp(filterId: string): void {
    const src = this.source();
    if (!src) return;

    const index = src.filters.findIndex(f => f.id === filterId);
    if (index <= 0) return;

    const newFilters = [...src.filters];
    [newFilters[index - 1], newFilters[index]] = [newFilters[index], newFilters[index - 1]];

    this.sourceService.updateSource(src.id, { filters: newFilters });
  }

  moveFilterDown(filterId: string): void {
    const src = this.source();
    if (!src) return;

    const index = src.filters.findIndex(f => f.id === filterId);
    if (index < 0 || index >= src.filters.length - 1) return;

    const newFilters = [...src.filters];
    [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];

    this.sourceService.updateSource(src.id, { filters: newFilters });
  }

  resetTransform(): void {
    const src = this.source();
    if (!src) return;

    const defaultTransform: Transform = {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
      alignment: 5,
      boundsType: 'none',
      boundsAlignment: 0,
      bounds: { x: 0, y: 0 }
    };

    this.sourceService.updateSource(src.id, { transform: defaultTransform });
  }

  getFilterName(type: FilterType): string {
    const names: Record<FilterType, string> = {
      [FilterType.CHROMA_KEY]: 'Chroma Key',
      [FilterType.COLOR_CORRECTION]: 'Color Correction',
      [FilterType.COLOR_GRADE]: 'Color Grade',
      [FilterType.SHARPEN]: 'Sharpen',
      [FilterType.BLUR]: 'Blur',
      [FilterType.NOISE_SUPPRESSION]: 'Noise Suppression',
      [FilterType.NOISE_GATE]: 'Noise Gate',
      [FilterType.COMPRESSOR]: 'Compressor',
      [FilterType.GAIN]: 'Gain',
      [FilterType.LIMITER]: 'Limiter',
      [FilterType.EXPANDER]: 'Expander',
      [FilterType.VST]: 'VST Plugin',
      [FilterType.LUT]: 'Apply LUT',
      [FilterType.SCALING]: 'Scaling/Aspect Ratio',
      [FilterType.SCROLL]: 'Scroll',
      [FilterType.RENDER_DELAY]: 'Render Delay',
      [FilterType.MASK]: 'Image Mask'
    };
    return names[type] || type;
  }

  private getDefaultFilterSettings(type: FilterType): any {
    const defaults: Record<FilterType, any> = {
      [FilterType.CHROMA_KEY]: {
        keyColor: '#00FF00',
        similarity: 400,
        smoothness: 80,
        spillReduction: 100
      },
      [FilterType.COLOR_CORRECTION]: {
        gamma: 0,
        contrast: 0,
        brightness: 0,
        saturation: 0,
        hueShift: 0
      },
      [FilterType.COLOR_GRADE]: {
        shadows: { r: 0, g: 0, b: 0 },
        midtones: { r: 0, g: 0, b: 0 },
        highlights: { r: 0, g: 0, b: 0 }
      },
      [FilterType.SHARPEN]: { amount: 0.5 },
      [FilterType.BLUR]: { amount: 1.0, algorithm: 'gaussian' },
      [FilterType.NOISE_SUPPRESSION]: { level: -30 },
      [FilterType.NOISE_GATE]: {
        threshold: -30,
        attack: 25,
        hold: 200,
        release: 150
      },
      [FilterType.COMPRESSOR]: {
        threshold: -18,
        ratio: 3,
        attack: 6,
        release: 60,
        outputGain: 0
      },
      [FilterType.GAIN]: { db: 0 },
      [FilterType.LIMITER]: { threshold: -6, release: 60 },
      [FilterType.EXPANDER]: { ratio: 2, threshold: -40, attack: 10, release: 50 },
      [FilterType.VST]: { plugin: '', preset: '' },
      [FilterType.LUT]: { lutFile: '' },
      [FilterType.SCALING]: { resolution: 'source', filter: 'bicubic' },
      [FilterType.SCROLL]: { horizontal: 0, vertical: 0, loop: true },
      [FilterType.RENDER_DELAY]: { delayMs: 0 },
      [FilterType.MASK]: { imagePath: '', type: 'alpha' }
    };
    return defaults[type] || {};
  }
}
