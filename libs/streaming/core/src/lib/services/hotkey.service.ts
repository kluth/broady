import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Hotkey } from '../models/settings.model';

export interface HotkeyBinding {
  action: string;
  hotkey: Hotkey;
  callback: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class HotkeyService {
  private bindingsSubject = new BehaviorSubject<HotkeyBinding[]>([]);
  public readonly bindings$ = this.bindingsSubject.asObservable();

  constructor() {
    this.initializeKeyboardListener();
  }

  /**
   * Register a hotkey
   */
  registerHotkey(action: string, hotkey: Hotkey, callback: () => void): void {
    const bindings = this.bindingsSubject.value;
    const existingIndex = bindings.findIndex((b) => b.action === action);

    if (existingIndex >= 0) {
      bindings[existingIndex] = { action, hotkey, callback };
    } else {
      bindings.push({ action, hotkey, callback });
    }

    this.bindingsSubject.next([...bindings]);
  }

  /**
   * Unregister a hotkey
   */
  unregisterHotkey(action: string): void {
    const bindings = this.bindingsSubject.value.filter((b) => b.action !== action);
    this.bindingsSubject.next(bindings);
  }

  /**
   * Update hotkey
   */
  updateHotkey(action: string, hotkey: Hotkey): void {
    const bindings = this.bindingsSubject.value.map((binding) => {
      if (binding.action === action) {
        return { ...binding, hotkey };
      }
      return binding;
    });

    this.bindingsSubject.next(bindings);
  }

  /**
   * Initialize keyboard listener
   */
  private initializeKeyboardListener(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter((event) => {
          // Don't trigger hotkeys when typing in inputs
          const target = event.target as HTMLElement;
          return target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA';
        })
      )
      .subscribe((event) => {
        this.handleKeyPress(event);
      });
  }

  /**
   * Handle key press
   */
  private handleKeyPress(event: KeyboardEvent): void {
    const bindings = this.bindingsSubject.value;

    for (const binding of bindings) {
      if (this.matchesHotkey(event, binding.hotkey)) {
        event.preventDefault();
        binding.callback();
        break;
      }
    }
  }

  /**
   * Check if key event matches hotkey
   */
  private matchesHotkey(event: KeyboardEvent, hotkey: Hotkey): boolean {
    return (
      event.key.toLowerCase() === hotkey.key.toLowerCase() &&
      event.ctrlKey === hotkey.modifiers.ctrl &&
      event.altKey === hotkey.modifiers.alt &&
      event.shiftKey === hotkey.modifiers.shift &&
      event.metaKey === hotkey.modifiers.meta
    );
  }

  /**
   * Get hotkey string representation
   */
  getHotkeyString(hotkey: Hotkey): string {
    const modifiers: string[] = [];

    if (hotkey.modifiers.ctrl) modifiers.push('Ctrl');
    if (hotkey.modifiers.alt) modifiers.push('Alt');
    if (hotkey.modifiers.shift) modifiers.push('Shift');
    if (hotkey.modifiers.meta) modifiers.push('Meta');

    modifiers.push(hotkey.key.toUpperCase());

    return modifiers.join('+');
  }
}
