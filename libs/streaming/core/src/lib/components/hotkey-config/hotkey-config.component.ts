import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { HotkeyService, HotkeyBinding } from '../../services/hotkey.service';
import { Hotkey } from '../../models/settings.model';

interface HotkeyCategory {
  name: string;
  actions: HotkeyAction[];
}

interface HotkeyAction {
  id: string;
  name: string;
  description: string;
  defaultHotkey?: Hotkey;
}

@Component({
  selector: 'streaming-hotkey-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './hotkey-config.component.html',
  styleUrls: ['./hotkey-config.component.css']
})
export class HotkeyConfigComponent {
  // Hotkey recording state
  private recordingActionSignal = signal<string | null>(null);
  private recordedKeysSignal = signal<Hotkey | null>(null);

  readonly recordingAction = this.recordingActionSignal.asReadonly();
  readonly recordedKeys = this.recordedKeysSignal.asReadonly();

  // Filter
  private searchQuerySignal = signal<string>('');
  readonly searchQuery = this.searchQuerySignal.asReadonly();

  // Available hotkey actions grouped by category
  readonly categories: HotkeyCategory[] = [
    {
      name: 'Streaming',
      actions: [
        { id: 'streaming.start', name: 'Start Streaming', description: 'Begin streaming to enabled destinations', defaultHotkey: { key: 'F10', modifiers: { ctrl: false, alt: false, shift: false, meta: false } } },
        { id: 'streaming.stop', name: 'Stop Streaming', description: 'Stop all active streams', defaultHotkey: { key: 'F10', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
      ]
    },
    {
      name: 'Recording',
      actions: [
        { id: 'recording.start', name: 'Start Recording', description: 'Begin local recording', defaultHotkey: { key: 'F9', modifiers: { ctrl: false, alt: false, shift: false, meta: false } } },
        { id: 'recording.stop', name: 'Stop Recording', description: 'Stop local recording', defaultHotkey: { key: 'F9', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
        { id: 'recording.pause', name: 'Pause Recording', description: 'Pause/unpause recording', defaultHotkey: { key: 'F9', modifiers: { ctrl: false, alt: true, shift: false, meta: false } } },
      ]
    },
    {
      name: 'Replay Buffer',
      actions: [
        { id: 'replay.start', name: 'Start Replay Buffer', description: 'Enable replay buffer', defaultHotkey: { key: 'F11', modifiers: { ctrl: false, alt: false, shift: false, meta: false } } },
        { id: 'replay.save', name: 'Save Replay', description: 'Save current replay buffer', defaultHotkey: { key: 'F11', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
      ]
    },
    {
      name: 'Scenes',
      actions: [
        { id: 'scene.next', name: 'Next Scene', description: 'Switch to next scene', defaultHotkey: { key: 'PageDown', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
        { id: 'scene.previous', name: 'Previous Scene', description: 'Switch to previous scene', defaultHotkey: { key: 'PageUp', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
        { id: 'scene.1', name: 'Switch to Scene 1', description: 'Activate scene 1' },
        { id: 'scene.2', name: 'Switch to Scene 2', description: 'Activate scene 2' },
        { id: 'scene.3', name: 'Switch to Scene 3', description: 'Activate scene 3' },
        { id: 'scene.4', name: 'Switch to Scene 4', description: 'Activate scene 4' },
      ]
    },
    {
      name: 'Audio',
      actions: [
        { id: 'audio.mute_all', name: 'Mute All', description: 'Mute all audio sources', defaultHotkey: { key: 'M', modifiers: { ctrl: true, alt: true, shift: false, meta: false } } },
        { id: 'audio.mute_desktop', name: 'Mute Desktop Audio', description: 'Toggle desktop audio mute' },
        { id: 'audio.mute_mic', name: 'Mute Microphone', description: 'Toggle microphone mute', defaultHotkey: { key: 'M', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
        { id: 'audio.push_to_talk', name: 'Push to Talk', description: 'Activate microphone while held' },
        { id: 'audio.push_to_mute', name: 'Push to Mute', description: 'Mute microphone while held' },
      ]
    },
    {
      name: 'Studio Mode',
      actions: [
        { id: 'studio.enable', name: 'Enable Studio Mode', description: 'Activate studio mode preview' },
        { id: 'studio.transition', name: 'Execute Transition', description: 'Transition preview to program', defaultHotkey: { key: 'Enter', modifiers: { ctrl: true, alt: false, shift: false, meta: false } } },
      ]
    },
    {
      name: 'General',
      actions: [
        { id: 'general.screenshot', name: 'Take Screenshot', description: 'Capture current preview', defaultHotkey: { key: 'F12', modifiers: { ctrl: false, alt: false, shift: false, meta: false } } },
        { id: 'general.fullscreen', name: 'Toggle Fullscreen', description: 'Toggle preview fullscreen', defaultHotkey: { key: 'F11', modifiers: { ctrl: false, alt: false, shift: true, meta: false } } },
        { id: 'general.stats', name: 'Toggle Stats', description: 'Show/hide stats overlay' },
      ]
    }
  ];

  readonly filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.categories;

    return this.categories
      .map(category => ({
        ...category,
        actions: category.actions.filter(action =>
          action.name.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.id.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.actions.length > 0);
  });

  constructor(public hotkeyService: HotkeyService) {
    effect(() => {
      // Listen for keyboard events when recording
      if (this.recordingAction()) {
        document.addEventListener('keydown', this.handleRecordKeyDown);
      } else {
        document.removeEventListener('keydown', this.handleRecordKeyDown);
      }
    });
  }

  updateSearch(query: string): void {
    this.searchQuerySignal.set(query);
  }

  startRecording(actionId: string): void {
    this.recordingActionSignal.set(actionId);
    this.recordedKeysSignal.set(null);
  }

  stopRecording(): void {
    this.recordingActionSignal.set(null);
    this.recordedKeysSignal.set(null);
  }

  private handleRecordKeyDown = (event: KeyboardEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    // Ignore modifier-only keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      return;
    }

    const hotkey: Hotkey = {
      key: event.key,
      modifiers: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }
    };

    this.recordedKeysSignal.set(hotkey);

    // Automatically assign after 500ms
    setTimeout(() => {
      const actionId = this.recordingAction();
      if (actionId && this.recordedKeys()) {
        this.assignHotkey(actionId, this.recordedKeys()!);
        this.stopRecording();
      }
    }, 500);
  };

  assignHotkey(actionId: string, hotkey: Hotkey): void {
    this.hotkeyService.updateHotkey(actionId, hotkey);
  }

  clearHotkey(actionId: string): void {
    this.hotkeyService.unregisterHotkey(actionId);
  }

  getHotkeyForAction(actionId: string): string {
    // This would normally come from the service
    // For now, we'll return a placeholder
    return '';
  }

  resetToDefaults(): void {
    this.categories.forEach(category => {
      category.actions.forEach(action => {
        if (action.defaultHotkey) {
          this.assignHotkey(action.id, action.defaultHotkey);
        } else {
          this.clearHotkey(action.id);
        }
      });
    });
  }

  exportConfig(): void {
    // Export hotkey configuration as JSON
    const config = {
      version: '1.0',
      hotkeys: {} as Record<string, Hotkey>
    };

    console.log('Exporting hotkey config:', config);
    // In a real app, this would download a JSON file
  }

  importConfig(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        console.log('Importing hotkey config:', config);
        // Apply imported configuration
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    };
    reader.readAsText(file);
  }

  getHotkeyString(hotkey: Hotkey): string {
    return this.hotkeyService.getHotkeyString(hotkey);
  }
}
