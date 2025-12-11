import { Injectable, signal, computed } from '@angular/core';

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

  /**
   * Scan for Stream Deck devices
   */
  async scanDevices(): Promise<StreamDeckDevice[]> {
    console.log('Scanning for Stream Deck devices...');

    // In real implementation, use Stream Deck SDK or HID API
    // const devices = await streamDeck.listDevices();

    // Simulated devices
    const mockDevices: StreamDeckDevice[] = [
      {
        id: 'sd-xl-001',
        model: 'stream-deck-xl',
        serialNumber: 'XL123456',
        name: 'Stream Deck XL',
        rows: 4,
        columns: 8,
        keyCount: 32,
        connected: true,
        brightness: 80,
        firmwareVersion: '1.2.3'
      },
      {
        id: 'sd-mini-001',
        model: 'stream-deck-mini',
        serialNumber: 'MINI789012',
        name: 'Stream Deck Mini',
        rows: 2,
        columns: 3,
        keyCount: 6,
        connected: true,
        brightness: 70,
        firmwareVersion: '1.1.0'
      }
    ];

    this.devices.set(mockDevices);
    this.initializeDefaultProfiles();

    return mockDevices;
  }

  /**
   * Connect to device
   */
  async connectDevice(deviceId: string): Promise<boolean> {
    console.log('Connecting to Stream Deck:', deviceId);

    // In real implementation, open HID connection
    // await device.open();

    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, connected: true } : d
      )
    );

    // Start listening for key presses
    this.startKeyListener(deviceId);

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

    // Stop listener
    this.stopKeyListener(deviceId);
  }

  /**
   * Set device brightness
   */
  setBrightness(deviceId: string, brightness: number): void {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be between 0-100');
    }

    // In real implementation, send command to device
    // device.setBrightness(brightness);

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
    console.log('Executing action:', action.type, action.settings);

    switch (action.type) {
      case 'scene-switch':
        // In real implementation, call scene service
        console.log('Switching to scene:', action.settings.sceneId);
        break;

      case 'source-toggle':
        console.log('Toggling source:', action.settings.sourceId);
        break;

      case 'start-stream':
        console.log('Starting stream');
        break;

      case 'stop-stream':
        console.log('Stopping stream');
        break;

      case 'start-recording':
        console.log('Starting recording');
        break;

      case 'stop-recording':
        console.log('Stopping recording');
        break;

      case 'mute-audio':
        console.log('Muting audio:', action.settings.sourceId);
        break;

      case 'unmute-audio':
        console.log('Unmuting audio:', action.settings.sourceId);
        break;

      case 'play-sound':
        console.log('Playing sound:', action.settings.soundFile);
        break;

      case 'show-alert':
        console.log('Showing alert:', action.settings.message);
        break;

      case 'run-script':
        console.log('Running script:', action.settings.scriptId);
        break;

      case 'run-workflow':
        console.log('Running workflow:', action.settings.workflowId);
        break;

      case 'text-to-speech':
        console.log('TTS:', action.settings.text);
        break;

      case 'multi-action':
        // Execute multiple actions in sequence
        if (action.multiActions) {
          for (const subAction of action.multiActions) {
            await this.executeAction(subAction);
            await this.delay(action.settings.delayBetween || 100);
          }
        }
        break;

      case 'folder':
        console.log('Opening folder:', action.settings.folderId);
        break;

      case 'website':
        console.log('Opening website:', action.settings.url);
        window.open(action.settings.url, '_blank');
        break;

      default:
        console.warn('Unknown action type:', action.type);
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
   * Start listening for key presses
   */
  private startKeyListener(deviceId: string): void {
    console.log('Starting key listener for:', deviceId);

    // In real implementation, listen to HID events
    // device.on('down', (keyIndex) => this.handleKeyPress(deviceId, keyIndex, true));
    // device.on('up', (keyIndex) => this.handleKeyPress(deviceId, keyIndex, false));

    // Simulated listener - in real app, this would be event-driven
    (window as any)[`streamDeckListener_${deviceId}`] = {
      press: (keyIndex: number) => this.handleKeyPress(deviceId, keyIndex, true),
      release: (keyIndex: number) => this.handleKeyPress(deviceId, keyIndex, false)
    };
  }

  /**
   * Stop listening for key presses
   */
  private stopKeyListener(deviceId: string): void {
    console.log('Stopping key listener for:', deviceId);
    delete (window as any)[`streamDeckListener_${deviceId}`];
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
    // device.fillKeyBuffer(keyIndex, buffer);

    console.log(`Updating key ${keyIndex} on device ${deviceId}`);
  }

  /**
   * Flash key for visual feedback
   */
  private flashKey(deviceId: string, keyIndex: number): void {
    console.log(`Flashing key ${keyIndex} on device ${deviceId}`);

    // In real implementation, temporarily change key appearance
    // device.fillKeyColor(keyIndex, 255, 255, 255);
    // setTimeout(() => this.updateKeyDisplay(deviceId, keyIndex), 100);
  }

  /**
   * Initialize default profiles
   */
  private initializeDefaultProfiles(): void {
    this.devices().forEach(device => {
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
