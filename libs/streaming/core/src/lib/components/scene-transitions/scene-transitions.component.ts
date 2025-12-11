import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TransitionType, Transition } from '../../models/scene.model';
import { SceneService } from '../../services/scene.service';

@Component({
  selector: 'streaming-scene-transitions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './scene-transitions.component.html',
  styleUrls: ['./scene-transitions.component.css'],
})
export class SceneTransitionsComponent {
  // Current transition settings
  private currentTransitionSignal = signal<Transition>({
    type: TransitionType.FADE,
    duration: 300,
    settings: {},
  });

  readonly currentTransition = this.currentTransitionSignal.asReadonly();

  // Available transition types
  readonly transitionTypes = Object.values(TransitionType);

  // Transition presets
  readonly presets = [
    { name: 'Quick Cut', type: TransitionType.CUT, duration: 0 },
    { name: 'Fast Fade', type: TransitionType.FADE, duration: 150 },
    { name: 'Smooth Fade', type: TransitionType.FADE, duration: 300 },
    { name: 'Long Fade', type: TransitionType.FADE, duration: 600 },
    {
      name: 'Swipe Left',
      type: TransitionType.SWIPE,
      duration: 400,
      settings: { direction: 'left' },
    },
    {
      name: 'Swipe Right',
      type: TransitionType.SWIPE,
      duration: 400,
      settings: { direction: 'right' },
    },
    {
      name: 'Slide Up',
      type: TransitionType.SLIDE,
      duration: 500,
      settings: { direction: 'up' },
    },
    {
      name: 'Slide Down',
      type: TransitionType.SLIDE,
      duration: 500,
      settings: { direction: 'down' },
    },
    {
      name: 'Fade to Black',
      type: TransitionType.FADE_TO_COLOR,
      duration: 500,
      settings: { color: '#000000' },
    },
    {
      name: 'Fade to White',
      type: TransitionType.FADE_TO_COLOR,
      duration: 500,
      settings: { color: '#FFFFFF' },
    },
  ];

  readonly transitionInfo = computed(() => {
    const t = this.currentTransition();
    return this.getTransitionInfo(t.type);
  });

  constructor(public sceneService: SceneService) {}

  updateTransitionType(type: TransitionType): void {
    this.currentTransitionSignal.update((t) => ({
      ...t,
      type,
      settings: this.getDefaultSettings(type),
    }));
  }

  updateDuration(duration: number): void {
    this.currentTransitionSignal.update((t) => ({
      ...t,
      duration: Math.max(0, Math.min(5000, duration)),
    }));
  }

  updateSetting(key: string, value: any): void {
    this.currentTransitionSignal.update((t) => ({
      ...t,
      settings: {
        ...t.settings,
        [key]: value,
      },
    }));
  }

  applyPreset(preset: (typeof this.presets)[0]): void {
    this.currentTransitionSignal.set({
      type: preset.type,
      duration: preset.duration,
      settings: preset.settings || {},
    });
  }

  previewTransition(): void {
    const transition = this.currentTransition();
    console.log('Previewing transition:', transition);
    // In a real app, this would trigger a visual preview
    // For now, we'll just log it
  }

  getTransitionName(type: TransitionType): string {
    const names: Record<TransitionType, string> = {
      [TransitionType.CUT]: 'Cut',
      [TransitionType.FADE]: 'Fade',
      [TransitionType.SWIPE]: 'Swipe',
      [TransitionType.SLIDE]: 'Slide',
      [TransitionType.STINGER]: 'Stinger',
      [TransitionType.FADE_TO_COLOR]: 'Fade to Color',
      [TransitionType.WIPE]: 'Wipe',
      [TransitionType.LUMA_WIPE]: 'Luma Wipe',
    };
    return names[type] || type;
  }

  getTransitionInfo(type: TransitionType): {
    description: string;
    icon: string;
    settings: Array<{
      key: string;
      label: string;
      type: string;
      options?: any[];
    }>;
  } {
    const info: Record<TransitionType, any> = {
      [TransitionType.CUT]: {
        description: 'Instant switch between scenes',
        icon: '✂️',
        settings: [],
      },
      [TransitionType.FADE]: {
        description: 'Smooth fade between scenes',
        icon: '🌓',
        settings: [],
      },
      [TransitionType.SWIPE]: {
        description: 'Swipe from one scene to another',
        icon: '➡️',
        settings: [
          {
            key: 'direction',
            label: 'Direction',
            type: 'select',
            options: ['left', 'right', 'up', 'down'],
          },
        ],
      },
      [TransitionType.SLIDE]: {
        description: 'Slide from one scene to another',
        icon: '⬅️',
        settings: [
          {
            key: 'direction',
            label: 'Direction',
            type: 'select',
            options: ['left', 'right', 'up', 'down'],
          },
        ],
      },
      [TransitionType.STINGER]: {
        description: 'Use a video stinger for transitions',
        icon: '🎬',
        settings: [
          { key: 'videoPath', label: 'Stinger Video', type: 'file' },
          {
            key: 'transitionPoint',
            label: 'Transition Point (ms)',
            type: 'number',
          },
        ],
      },
      [TransitionType.FADE_TO_COLOR]: {
        description: 'Fade through a solid color',
        icon: '🎨',
        settings: [{ key: 'color', label: 'Color', type: 'color' }],
      },
      [TransitionType.WIPE]: {
        description: 'Wipe across the screen',
        icon: '↔️',
        settings: [
          {
            key: 'direction',
            label: 'Direction',
            type: 'select',
            options: ['left', 'right', 'up', 'down'],
          },
        ],
      },
      [TransitionType.LUMA_WIPE]: {
        description: 'Use a luma matte for transition',
        icon: '🖼️',
        settings: [
          { key: 'imagePath', label: 'Luma Image', type: 'file' },
          { key: 'invert', label: 'Invert', type: 'checkbox' },
        ],
      },
    };

    return info[type] || { description: '', icon: '', settings: [] };
  }

  private getDefaultSettings(type: TransitionType): any {
    const defaults: Record<TransitionType, any> = {
      [TransitionType.CUT]: {},
      [TransitionType.FADE]: {},
      [TransitionType.SWIPE]: { direction: 'left' },
      [TransitionType.SLIDE]: { direction: 'left' },
      [TransitionType.STINGER]: { videoPath: '', transitionPoint: 0 },
      [TransitionType.FADE_TO_COLOR]: { color: '#000000' },
      [TransitionType.WIPE]: { direction: 'left' },
      [TransitionType.LUMA_WIPE]: { imagePath: '', invert: false },
    };
    return defaults[type] || {};
  }
}
