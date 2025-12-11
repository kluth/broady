import { Injectable, signal } from '@angular/core';

export interface SwitchTrigger {
  id: string;
  name: string;
  enabled: boolean;
  type: 'audio' | 'hotkey' | 'timer' | 'game' | 'media' | 'custom';
  targetScene: string;
  conditions: Record<string, unknown>;
}

export interface SceneSwitch {
  id: string;
  fromScene: string;
  toScene: string;
  trigger: string;
  timestamp: Date;
  isAutomatic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AutoSceneSwitcherService {
  readonly isEnabled = signal(true);
  readonly triggers = signal<SwitchTrigger[]>([]);
  readonly switchHistory = signal<SceneSwitch[]>([]);
  readonly currentScene = signal('Default');

  switchScene(targetScene: string, triggerName: string, isAutomatic: boolean): void {
    const previousScene = this.currentScene();
    if (previousScene === targetScene) return;

    const switchEvent: SceneSwitch = {
      id: crypto.randomUUID(),
      fromScene: previousScene,
      toScene: targetScene,
      trigger: triggerName,
      timestamp: new Date(),
      isAutomatic
    };

    this.currentScene.set(targetScene);
    this.switchHistory.update(h => [switchEvent, ...h].slice(0, 100));
  }

  addTrigger(trigger: Omit<SwitchTrigger, 'id'>): void {
    this.triggers.update(t => [...t, { ...trigger, id: crypto.randomUUID() }]);
  }

  removeTrigger(id: string): void {
    this.triggers.update(t => t.filter(trigger => trigger.id !== id));
  }
}
