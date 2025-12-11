import { Injectable, signal, computed, inject } from '@angular/core';
import { SocketService } from './socket.service';

/**
 * Stream Deck Integration Service
 * Control Broady with Elgato Stream Deck and compatible devices
 */

export type StreamDeckModel =
  | 'stream-deck-original'
  | 'stream-deck-mini'
  | 'stream-deck-xl'
  | 'stream-deck-mk2'
  | 'stream-deck-plus'
  | 'stream-deck-pedal'
  | 'stream-deck-mobile';

export type ActionType =
  | 'scene-switch'
  | 'source-toggle'
  | 'start-stream'
  | 'stop-stream'
  | 'start-recording'
  | 'stop-recording'
  | 'mute-audio'
  | 'unmute-audio'
  | 'trigger-hotkey'
  | 'play-sound'
  | 'show-alert'
  | 'run-script'
  | 'run-workflow'
  | 'multi-action'
  | 'folder'
  | 'website'
  | 'text-to-speech'
  | 'set-game'
  | 'start-bet'
  | 'end-bet';

export interface StreamDeckDevice {
  id: string;
  model: StreamDeckModel;
  serialNumber: string;
  name: string;
  rows: number;
  columns: number;
  keyCount: number;
  connected: boolean;
  brightness: number;
  firmwareVersion?: string;
}

export interface StreamDeckKey {
  deviceId: string;
  keyIndex: number;
  row: number;
  column: number;
  action?: KeyAction;
  icon?: string; // Base64 image or icon name
  label?: string;
  backgroundColor?: string;
  labelColor?: string;
  folder?: string; // Folder ID if this is in a folder
}

export interface KeyAction {
  type: ActionType;
  id: string;
  name: string;
  settings: Record<string, any>;
  multiActions?: KeyAction[]; // For multi-action buttons
}

export interface StreamDeckProfile {
  id: string;
  name: string;
  deviceId: string;
  keys: StreamDeckKey[];
  autoSwitch?: {
    enabled: boolean;
    condition: 'scene' | 'game' | 'stream-state';
    value: string;
  };
}

export interface StreamDeckFolder {
  id: string;
  name: string;
  icon?: string;
  keys: StreamDeckKey[];
  parentFolder?: string;
}

export interface KeyPressEvent {
  deviceId: string;
  keyIndex: number;
  pressed: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StreamDeckService {
  private socket = inject(SocketService);

  // Connected devices
  readonly devices = signal<StreamDeckDevice[]>([]);

  // Active profiles
  readonly profiles = signal<StreamDeckProfile[]>([]);

  // Folders
  readonly folders = signal<StreamDeckFolder[]>([]);

  // Active profile per device
  readonly activeProfiles = signal<Map<string, string>>(new Map());

  // Current folder per device (for navigation)
  readonly currentFolders = signal<Map<string, string>>(new Map());

  // Key press history
  readonly keyPressHistory = signal<KeyPressEvent[]>([]);

  // Computed
  readonly connectedDevices = computed(() =>
    this.devices().filter(d => d.connected)
  );

  readonly totalKeys = computed(() =>
    this.devices().reduce((sum, d) => sum + d.keyCount, 0)
  );

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Listen for devices
    this.socket.on<any>('hardware:devices', (data) => {
      const decks = data.streamDecks || [];
      const mappedDecks: StreamDeckDevice[] = decks.map((d: any) => ({
        id: d.id,
        model: d.model,
        serialNumber: d.serialNumber,
        name: d.name,
        rows: d.rows,
        columns: d.columns,
        keyCount: d.keyCount,
        connected: d.connected,
        brightness: d.brightness,
        firmwareVersion: '1.0.0' // Mock version for virtual
      }));

      this.devices.set(mappedDecks);
      this.initializeDefaultProfiles();
    });

    // Listen for device status updates (e.g. brightness changed on device)
    this.socket.on<any>('streamdeck:status', (device) => {
      this.devices.update(devices => 
        devices.map(d => d.id === device.id ? { ...d, brightness: device.brightness } : d)
      );
    });

    // Listen for physical key presses (simulated from backend)
    this.socket.on<{deviceId: string, keyIndex: number}>('streamdeck:key-down', (data) => {
      this.handleKeyPress(data.deviceId, data.keyIndex, true);
    });

    this.socket.on<{deviceId: string, keyIndex: number}>('streamdeck:key-up', (data) => {
      this.handleKeyPress(data.deviceId, data.keyIndex, false);
    });
  }

  /**
   * Scan for Stream Deck devices
   */
  async scanDevices(): Promise<StreamDeckDevice[]> {
    console.log('Requesting Stream Deck list...');
    this.socket.emit('hardware:list-devices');
    
    // Return current list (will update via socket)
    return this.devices();
  }

  /**
   * Connect to device
   */
  async connectDevice(deviceId: string): Promise<boolean> {
    console.log('Connecting to Stream Deck:', deviceId);
    // In backend implementation, this is auto-handled, but we can simulate readiness
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, connected: true } : d
      )
    );
    return true;
  }

  /**
   * Disconnect device
   */
  disconnectDevice(deviceId: string): void {
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, connected: false } : d
      )
    );
  }

  /**
   * Set device brightness
   */
  setBrightness(deviceId: string, brightness: number): void {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be between 0-100');
    }

    // Send to backend
    this.socket.emit('streamdeck:set-brightness', { deviceId, brightness });

    // Optimistic update
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, brightness } : d
      )
    );
  }

  /**
   * Create profile
   */
  createProfile(name: string, deviceId: string): StreamDeckProfile {
    const device = this.devices().find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    const profile: StreamDeckProfile = {
      id: crypto.randomUUID(),
      name,
      deviceId,
      keys: Array.from({ length: device.keyCount }, (_, i) => ({
        deviceId,
        keyIndex: i,
        row: Math.floor(i / device.columns),
        column: i % device.columns
      }))
    };

    this.profiles.update(p => [...p, profile]);
    return profile;
  }

  /**
   * Set active profile
   */
  setActiveProfile(deviceId: string, profileId: string): void {
    const profile = this.profiles().find(p => p.id === profileId);
    if (!profile || profile.deviceId !== deviceId) {
      throw new Error('Invalid profile for this device');
    }

    this.activeProfiles.update(map => {
      const newMap = new Map(map);
      newMap.set(deviceId, profileId);
      return newMap;
    });

    // Update device display
    this.updateDeviceDisplay(deviceId);
  }

  /**
   * Get active profile for device
   */
  getActiveProfile(deviceId: string): StreamDeckProfile | undefined {
    const profileId = this.activeProfiles().get(deviceId);
    if (!profileId) return undefined;
    return this.profiles().find(p => p.id === profileId);
  }

  /**
   * Configure key
   */
  configureKey(
    profileId: string,
    keyIndex: number,
    config: Partial<StreamDeckKey>
  ): void {
    this.profiles.update(profiles =>
      profiles.map(p =>
        p.id === profileId
          ? {
              ...p,
              keys: p.keys.map((k, i) =>
                i === keyIndex ? { ...k, ...config } : k
              )
            }
          : p
      )
    );

    // Update device display if this is active profile
    const profile = this.profiles().find(p => p.id === profileId);
    if (profile) {
      const activeId = this.activeProfiles().get(profile.deviceId);
      if (activeId === profileId) {
        this.updateKeyDisplay(profile.deviceId, keyIndex);
      }
    }
  }

  /**
   * Set key action
   */
  setKeyAction(
    profileId: string,
    keyIndex: number,
    action: KeyAction
  ): void {
    this.configureKey(profileId, keyIndex, { action });
  }

  /**
   * Set key icon
   */
  async setKeyIcon(
    profileId: string,
    keyIndex: number,
    icon: string | File
  ): Promise<void> {
    let iconData: string;

    if (icon instanceof File) {
      // Convert file to base64
      iconData = await this.fileToBase64(icon);
    } else {
      iconData = icon;
    }

    this.configureKey(profileId, keyIndex, { icon: iconData });
  }

  /**
   * Create folder
   */
  createFolder(name: string, deviceId: string): StreamDeckFolder {
    const folder: StreamDeckFolder = {
      id: crypto.randomUUID(),
      name,
      keys: []
    };

    this.folders.update(f => [...f, folder]);
    return folder;
  }

  /**
   * Open folder
   */
  openFolder(deviceId: string, folderId: string): void {
    this.currentFolders.update(map => {
      const newMap = new Map(map);
      newMap.set(deviceId, folderId);
      return newMap;
    });

    this.updateDeviceDisplay(deviceId);
  }

  /**
   * Go back from folder
   */
  goBack(deviceId: string): void {
    const currentFolder = this.currentFolders().get(deviceId);
    if (!currentFolder) return;

    const folder = this.folders().find(f => f.id === currentFolder);
    if (folder?.parentFolder) {
      this.openFolder(deviceId, folder.parentFolder);
    } else {
      // Go back to profile root
      this.currentFolders.update(map => {
        const newMap = new Map(map);
        newMap.delete(deviceId);
        return newMap;
      });
      this.updateDeviceDisplay(deviceId);
    }
  }

  /**
   * Execute key action
   */
  async executeAction(action: KeyAction): Promise<void> {
    try {
      // Lazy load StreamActionsService to avoid circular dependencies
      const { StreamActionsService } = await import('./stream-actions.service');
      const actionsService = new StreamActionsService();

      switch (action.type) {
        case 'scene-switch':
          await actionsService.switchScene(action.settings['sceneId']);
          break;

        case 'source-toggle':
          await actionsService.toggleSource(action.settings['sourceId']);
          break;

        case 'start-stream':
          await actionsService.startStream();
          break;

        case 'stop-stream':
          await actionsService.stopStream();
          break;

        case 'start-recording':
          await actionsService.startRecording();
          break;

        case 'stop-recording':
          await actionsService.stopRecording();
          break;

        case 'mute-audio':
          await actionsService.muteAudio(action.settings['sourceId']);
          break;

        case 'unmute-audio':
          await actionsService.unmuteAudio(action.settings['sourceId']);
          break;

        case 'play-sound':
          await actionsService.playSound(action.settings['soundFile']);
          break;

        case 'show-alert':
          await actionsService.showAlert({
            message: action.settings['message'],
            title: action.settings['title'],
            duration: action.settings['duration']
          });
          break;

        case 'run-script':
          await actionsService.runScript(action.settings['scriptId']);
          break;

        case 'run-workflow':
          await actionsService.runWorkflow(action.settings['workflowId']);
          break;

        case 'text-to-speech':
          await actionsService.speak(action.settings['text']);
          break;

        case 'multi-action':
          // Execute multiple actions in sequence
          if (action.multiActions) {
            for (const subAction of action.multiActions) {
              await this.executeAction(subAction);
              await this.delay(action.settings['delayBetween'] || 100);
            }
          }
          break;

        case 'folder':
          // Folder actions are handled by the Stream Deck itself
          // This just updates the UI state
          break;

        case 'website':
          actionsService.openWebsite(action.settings['url']);
          break;

        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      throw error;
    }
  }

  /**
   * Handle key press
   */
  private async handleKeyPress(deviceId: string, keyIndex: number, pressed: boolean): Promise<void> {
    // Log event
    this.keyPressHistory.update(history => [
      ...history.slice(-99), // Keep last 100
      {
        deviceId,
        keyIndex,
        pressed,
        timestamp: new Date()
      }
    ]);

    // Only execute on key down
    if (!pressed) return;

    const profile = this.getActiveProfile(deviceId);
    if (!profile) return;

    const currentFolder = this.currentFolders().get(deviceId);

    let key: StreamDeckKey | undefined;

    if (currentFolder) {
      // Get key from folder
      const folder = this.folders().find(f => f.id === currentFolder);
      key = folder?.keys[keyIndex];
    } else {
      // Get key from profile
      key = profile.keys[keyIndex];
    }

    if (!key?.action) return;

    // Execute action
    await this.executeAction(key.action);

    // Visual feedback
    this.flashKey(deviceId, keyIndex);
  }

  /**
   * Simulate a physical key press (useful for testing virtual devices)
   */
  simulateKeyPress(deviceId: string, keyIndex: number): void {
    this.socket.emit('streamdeck:simulate-press', { deviceId, keyIndex });
  }

  /**
   * Start listening for key presses
   */
  private startKeyListener(deviceId: string): void {
    console.log('Starting key listener for:', deviceId);
    // Real listening happens via socket events in constructor
  }

  /**
   * Stop listening for key presses
   */
  private stopKeyListener(deviceId: string): void {
    console.log('Stopping key listener for:', deviceId);
  }

  /**
   * Update entire device display
   */
  private updateDeviceDisplay(deviceId: string): void {
    const profile = this.getActiveProfile(deviceId);
    if (!profile) return;

    const currentFolder = this.currentFolders().get(deviceId);
    const keys = currentFolder
      ? this.folders().find(f => f.id === currentFolder)?.keys || []
      : profile.keys;

    keys.forEach((key, index) => {
      this.updateKeyDisplay(deviceId, index);
    });
  }

  /**
   * Update single key display
   */
  private updateKeyDisplay(deviceId: string, keyIndex: number): void {
    // In real implementation, send image buffer to device
    // socket.emit('streamdeck:update-key', ...);

    console.log(`Updating key ${keyIndex} on device ${deviceId}`);
  }

  /**
   * Flash key for visual feedback
   */
  private flashKey(deviceId: string, keyIndex: number): void {
    console.log(`Flashing key ${keyIndex} on device ${deviceId}`);
  }

  /**
   * Initialize default profiles
   */
  private initializeDefaultProfiles(): void {
    this.devices().forEach(device => {
      // Only create if not exists
      if (!this.profiles().some(p => p.deviceId === device.id)) {
        const profile = this.createProfile('Default Profile', device.id);

        // Set some default actions
        if (device.keyCount >= 15) {
          // Stream controls
          this.setKeyAction(profile.id, 0, {
            type: 'start-stream',
            id: 'start-stream',
            name: 'Start Stream',
            settings: {}
          });

          this.setKeyAction(profile.id, 1, {
            type: 'stop-stream',
            id: 'stop-stream',
            name: 'Stop Stream',
            settings: {}
          });

          // Recording controls
          this.setKeyAction(profile.id, 2, {
            type: 'start-recording',
            id: 'start-recording',
            name: 'Start Recording',
            settings: {}
          });

          this.setKeyAction(profile.id, 3, {
            type: 'stop-recording',
            id: 'stop-recording',
            name: 'Stop Recording',
            settings: {}
          });

          // Scene switches (placeholder)
          for (let i = 5; i < 10; i++) {
            this.setKeyAction(profile.id, i, {
              type: 'scene-switch',
              id: `scene-${i}`,
              name: `Scene ${i - 4}`,
              settings: { sceneId: `scene-${i}` }
            });
          }
        }

        // Set as active profile
        this.setActiveProfile(device.id, profile.id);
      }
    });
  }

  /**
   * Export profile
   */
  exportProfile(profileId: string): string {
    const profile = this.profiles().find(p => p.id === profileId);
    if (!profile) throw new Error('Profile not found');

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile
   */
  importProfile(profileData: string): StreamDeckProfile {
    const profile: StreamDeckProfile = JSON.parse(profileData);
    profile.id = crypto.randomUUID(); // New ID

    this.profiles.update(p => [...p, profile]);
    return profile;
  }

  /**
   * Utility: Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Utility: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get device statistics
   */
  getDeviceStats(deviceId: string) {
    const history = this.keyPressHistory().filter(e => e.deviceId === deviceId);
    const device = this.devices().find(d => d.id === deviceId);

    return {
      totalPresses: history.length,
      mostUsedKey: this.getMostUsedKey(deviceId),
      averagePressesPerHour: this.calculatePressesPerHour(deviceId),
      uptime: device?.connected ? 'Active' : 'Disconnected'
    };
  }

  /**
   * Get most used key
   */
  private getMostUsedKey(deviceId: string): number {
    const history = this.keyPressHistory().filter(e => e.deviceId === deviceId && e.pressed);
    const counts = new Map<number, number>();

    history.forEach(e => {
      counts.set(e.keyIndex, (counts.get(e.keyIndex) || 0) + 1);
    });

    let maxKey = -1;
    let maxCount = 0;

    counts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        maxKey = key;
      }
    });

    return maxKey;
  }

  /**
   * Calculate presses per hour
   */
  private calculatePressesPerHour(deviceId: string): number {
    const history = this.keyPressHistory().filter(e => e.deviceId === deviceId && e.pressed);
    if (history.length === 0) return 0;

    const oldest = history[0].timestamp.getTime();
    const newest = history[history.length - 1].timestamp.getTime();
    const hours = (newest - oldest) / (1000 * 60 * 60);

    return hours > 0 ? Math.round(history.length / hours) : 0;
  }
}
