import { Injectable, inject, signal, computed } from '@angular/core';
import { StreamDeckService } from './streamdeck.service';
import { AudioHardwareService } from './audio-hardware.service';
import { SmartLightingService } from './smart-lighting.service';
import { HardwareControlService } from './hardware-control.service';

/**
 * Hardware Integration Manager
 * Coordinates all hardware integrations and provides unified interface
 */

export interface HardwareStatus {
  category: 'stream-deck' | 'audio' | 'lighting' | 'camera' | 'midi' | 'gamepad';
  deviceCount: number;
  connectedCount: number;
  devices: {
    id: string;
    name: string;
    connected: boolean;
    type: string;
  }[];
}

export interface HardwareEvent {
  id: string;
  timestamp: Date;
  category: string;
  device: string;
  event: string;
  data?: any;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    category: 'stream' | 'donation' | 'follower' | 'raid' | 'time' | 'custom';
    condition?: any;
  };
  actions: HardwareAction[];
}

export interface HardwareAction {
  type: 'lighting-scene' | 'lighting-effect' | 'stream-deck-profile' | 'audio-mute' | 'camera-preset' | 'custom';
  target: string;
  parameters?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HardwareIntegrationService {
  // Inject hardware services
  private streamDeck = inject(StreamDeckService);
  private audioHardware = inject(AudioHardwareService);
  private smartLighting = inject(SmartLightingService);
  private hardwareControl = inject(HardwareControlService);

  // Events history
  readonly events = signal<HardwareEvent[]>([]);

  // Automation rules
  readonly automationRules = signal<AutomationRule[]>([]);

  // Initialization status
  readonly initialized = signal(false);
  readonly initializing = signal(false);

  // Computed statuses
  readonly allHardwareStatus = computed<HardwareStatus[]>(() => [
    {
      category: 'stream-deck',
      deviceCount: this.streamDeck.devices().length,
      connectedCount: this.streamDeck.connectedDevices().length,
      devices: this.streamDeck.devices().map(d => ({
        id: d.id,
        name: d.name,
        connected: d.connected,
        type: d.model
      }))
    },
    {
      category: 'audio',
      deviceCount: this.audioHardware.devices().length,
      connectedCount: this.audioHardware.connectedDevices().length,
      devices: this.audioHardware.devices().map(d => ({
        id: d.id,
        name: d.name,
        connected: d.connected,
        type: d.type
      }))
    },
    {
      category: 'lighting',
      deviceCount: this.smartLighting.lights().length,
      connectedCount: this.smartLighting.connectedLights().length,
      devices: this.smartLighting.lights().map(l => ({
        id: l.id,
        name: l.name,
        connected: l.connected,
        type: l.brand
      }))
    },
    {
      category: 'camera',
      deviceCount: this.hardwareControl.ptzCameras().length + this.hardwareControl.dslrCameras().length,
      connectedCount: this.hardwareControl.connectedPTZ().length + this.hardwareControl.connectedDSLR().length,
      devices: [
        ...this.hardwareControl.ptzCameras().map(c => ({
          id: c.id,
          name: c.name,
          connected: c.connected,
          type: 'PTZ'
        })),
        ...this.hardwareControl.dslrCameras().map(c => ({
          id: c.id,
          name: c.name,
          connected: c.connected,
          type: 'DSLR'
        }))
      ]
    },
    {
      category: 'midi',
      deviceCount: this.hardwareControl.midiControllers().length,
      connectedCount: this.hardwareControl.connectedMIDI().length,
      devices: this.hardwareControl.midiControllers().map(m => ({
        id: m.id,
        name: m.name,
        connected: m.connected,
        type: m.type
      }))
    },
    {
      category: 'gamepad',
      deviceCount: this.hardwareControl.gameControllers().length,
      connectedCount: this.hardwareControl.gameControllers().filter(g => g.connected).length,
      devices: this.hardwareControl.gameControllers().map(g => ({
        id: g.id,
        name: g.name,
        connected: g.connected,
        type: g.brand
      }))
    }
  ]);

  readonly totalDevices = computed(() =>
    this.allHardwareStatus().reduce((sum, s) => sum + s.deviceCount, 0)
  );

  readonly connectedDevices = computed(() =>
    this.allHardwareStatus().reduce((sum, s) => sum + s.connectedCount, 0)
  );

  readonly recentEvents = computed(() =>
    this.events().slice(-50) // Last 50 events
  );

  /**
   * Initialize all hardware
   */
  async initializeAll(): Promise<void> {
    if (this.initializing() || this.initialized()) {
      console.log('Already initialized or initializing');
      return;
    }

    this.initializing.set(true);
    console.log('Initializing all hardware...');

    try {
      // Discover all hardware in parallel
      await Promise.all([
        this.discoverStreamDecks(),
        this.discoverAudioHardware(),
        this.discoverLighting(),
        this.discoverCameras(),
        this.discoverMIDI()
      ]);

      this.initialized.set(true);
      this.logEvent('system', 'System', 'Hardware initialized');
      console.log('All hardware initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hardware:', error);
      this.logEvent('system', 'System', 'Hardware initialization failed', { error });
    } finally {
      this.initializing.set(false);
    }
  }

  /**
   * Discover Stream Decks
   */
  private async discoverStreamDecks(): Promise<void> {
    try {
      const devices = await this.streamDeck.scanDevices();
      this.logEvent('stream-deck', 'Stream Deck', 'Discovered', { count: devices.length });

      // Auto-connect to all devices
      for (const device of devices) {
        await this.streamDeck.connectDevice(device.id);
        this.logEvent('stream-deck', device.name, 'Connected');
      }
    } catch (error) {
      console.error('Failed to discover Stream Decks:', error);
    }
  }

  /**
   * Discover audio hardware
   */
  private async discoverAudioHardware(): Promise<void> {
    try {
      const devices = await this.audioHardware.scanDevices();
      this.logEvent('audio', 'Audio Hardware', 'Discovered', { count: devices.length });

      // Auto-connect to all devices
      for (const device of devices) {
        await this.audioHardware.connectDevice(device.id);
        this.logEvent('audio', device.name, 'Connected');
      }
    } catch (error) {
      console.error('Failed to discover audio hardware:', error);
    }
  }

  /**
   * Discover lighting
   */
  private async discoverLighting(): Promise<void> {
    try {
      // Discover all types of lights
      const [hue, keyLights, nanoleaf] = await Promise.all([
        this.smartLighting.discoverHueBridges(),
        this.smartLighting.discoverKeyLights(),
        this.smartLighting.discoverNanoleaf()
      ]);

      const total = hue.length + keyLights.length + nanoleaf.length;
      this.logEvent('lighting', 'Smart Lighting', 'Discovered', { count: total });

      // Auto-connect to Hue bridges (requires manual link button press)
      for (const bridge of hue) {
        this.logEvent('lighting', 'Hue Bridge', 'Ready to connect', {
          ip: bridge.ipAddress,
          note: 'Press link button and call connectHueBridge()'
        });
      }
    } catch (error) {
      console.error('Failed to discover lighting:', error);
    }
  }

  /**
   * Discover cameras
   */
  private async discoverCameras(): Promise<void> {
    try {
      const [ptz, dslr] = await Promise.all([
        this.hardwareControl.discoverPTZCameras(),
        this.hardwareControl.discoverDSLRCameras()
      ]);

      const total = ptz.length + dslr.length;
      this.logEvent('camera', 'Cameras', 'Discovered', { count: total });
    } catch (error) {
      console.error('Failed to discover cameras:', error);
    }
  }

  /**
   * Discover MIDI
   */
  private async discoverMIDI(): Promise<void> {
    try {
      await this.hardwareControl.requestMIDIAccess();
      const count = this.hardwareControl.midiControllers().length;
      this.logEvent('midi', 'MIDI Controllers', 'Discovered', { count });
    } catch (error) {
      console.error('Failed to discover MIDI:', error);
    }
  }

  /**
   * Create automation rule
   */
  createAutomation(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const automation: AutomationRule = {
      ...rule,
      id: crypto.randomUUID()
    };

    this.automationRules.update(rules => [...rules, automation]);
    this.logEvent('automation', 'Automation', 'Created', { name: automation.name });

    return automation;
  }

  /**
   * Trigger automation
   */
  async triggerAutomation(trigger: AutomationRule['trigger']): Promise<void> {
    const matchingRules = this.automationRules().filter(
      r => r.enabled && r.trigger.category === trigger.category
    );

    for (const rule of matchingRules) {
      this.logEvent('automation', rule.name, 'Triggered');

      for (const action of rule.actions) {
        await this.executeAction(action);
      }
    }
  }

  /**
   * Execute hardware action
   */
  private async executeAction(action: HardwareAction): Promise<void> {
    console.log('Executing action:', action.type, action.target);

    switch (action.type) {
      case 'lighting-scene':
        await this.smartLighting.activateScene(action.target);
        break;

      case 'lighting-effect':
        this.smartLighting.startEffect(action.target);
        break;

      case 'stream-deck-profile':
        // Find device and set profile
        const device = this.streamDeck.devices()[0]; // Use first device
        if (device) {
          this.streamDeck.setActiveProfile(device.id, action.target);
        }
        break;

      case 'audio-mute':
        if (action.parameters?.deviceId && action.parameters?.channelNumber) {
          this.audioHardware.toggleChannelMute(
            action.parameters.deviceId,
            action.parameters.channelNumber
          );
        }
        break;

      case 'camera-preset':
        if (action.parameters?.cameraId && action.parameters?.presetNumber) {
          await this.hardwareControl.recallPTZPreset(
            action.parameters.cameraId,
            action.parameters.presetNumber
          );
        }
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Quick actions for stream events
   */
  async onStreamStart(): Promise<void> {
    console.log('Stream started - triggering hardware automations');

    // Trigger lighting automation
    await this.smartLighting.triggerAutomation({ type: 'stream-start' });

    // Trigger custom automations
    await this.triggerAutomation({ category: 'stream' });

    this.logEvent('stream', 'Stream', 'Started');
  }

  async onStreamEnd(): Promise<void> {
    console.log('Stream ended - triggering hardware automations');

    await this.smartLighting.triggerAutomation({ type: 'stream-end' });
    this.logEvent('stream', 'Stream', 'Ended');
  }

  async onDonation(amount: number, donor: string): Promise<void> {
    console.log('Donation received:', amount, donor);

    // Trigger effects based on donation amount
    if (amount >= 100) {
      // Big donation - epic effects
      const effects = this.smartLighting.effects().filter(e => e.name.includes('Epic'));
      if (effects.length > 0) {
        this.smartLighting.startEffect(effects[0].id);
      }
    } else if (amount >= 50) {
      // Medium donation
      const effects = this.smartLighting.effects().filter(e => e.type === 'pulse');
      if (effects.length > 0) {
        this.smartLighting.startEffect(effects[0].id);
      }
    }

    await this.triggerAutomation({ category: 'donation', condition: { amount } });
    this.logEvent('donation', 'Donation', 'Received', { amount, donor });
  }

  /**
   * Log event
   */
  private logEvent(category: string, device: string, event: string, data?: any): void {
    const eventObj: HardwareEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      category,
      device,
      event,
      data
    };

    this.events.update(events => [...events.slice(-999), eventObj]);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalDevices: this.totalDevices(),
      connectedDevices: this.connectedDevices(),
      streamDecks: this.streamDeck.connectedDevices().length,
      audioDevices: this.audioHardware.connectedDevices().length,
      lights: this.smartLighting.connectedLights().length,
      ptzCameras: this.hardwareControl.connectedPTZ().length,
      dslrCameras: this.hardwareControl.connectedDSLR().length,
      midiControllers: this.hardwareControl.connectedMIDI().length,
      automations: this.automationRules().filter(a => a.enabled).length,
      recentEvents: this.recentEvents().length
    };
  }

  /**
   * Export all hardware configuration
   */
  exportConfiguration(): string {
    const config = {
      streamDeck: {
        devices: this.streamDeck.devices(),
        profiles: this.streamDeck.profiles()
      },
      audio: {
        devices: this.audioHardware.devices(),
        channels: this.audioHardware.channels()
      },
      lighting: {
        lights: this.smartLighting.lights(),
        scenes: this.smartLighting.scenes(),
        effects: this.smartLighting.effects()
      },
      cameras: {
        ptz: this.hardwareControl.ptzCameras(),
        dslr: this.hardwareControl.dslrCameras()
      },
      midi: {
        controllers: this.hardwareControl.midiControllers()
      },
      automations: this.automationRules()
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration
   */
  importConfiguration(configData: string): void {
    const config = JSON.parse(configData);

    console.log('Importing hardware configuration...');

    // Import automations
    if (config.automations) {
      this.automationRules.set(config.automations);
    }

    // Import lighting scenes and effects
    if (config.lighting) {
      if (config.lighting.scenes) {
        this.smartLighting.scenes.set(config.lighting.scenes);
      }
      if (config.lighting.effects) {
        this.smartLighting.effects.set(config.lighting.effects);
      }
    }

    this.logEvent('system', 'System', 'Configuration imported');
  }

  /**
   * Reset all hardware
   */
  async resetAll(): Promise<void> {
    console.log('Resetting all hardware...');

    // Disconnect all devices
    for (const device of this.streamDeck.devices()) {
      this.streamDeck.disconnectDevice(device.id);
    }

    // Turn off all lights
    await this.smartLighting.allOff();

    // Stop all effects
    for (const effect of this.smartLighting.effects()) {
      this.smartLighting.stopEffect(effect.id);
    }

    this.logEvent('system', 'System', 'Reset complete');
  }
}
