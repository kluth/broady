import { Injectable, signal, computed } from '@angular/core';

/**
 * RGB Peripherals Integration Service
 * Control RGB keyboards, mice, PC components, and gaming peripherals
 */

export type RGBBrand =
  | 'corsair'
  | 'razer'
  | 'logitech'
  | 'steelseries'
  | 'asus'
  | 'msi'
  | 'nzxt'
  | 'coolermaster'
  | 'thermaltake'
  | 'hyperx'
  | 'roccat'
  | 'gigabyte';

export type DeviceType =
  | 'keyboard'
  | 'mouse'
  | 'mousepad'
  | 'headset'
  | 'headset-stand'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'fan'
  | 'cooler'
  | 'case'
  | 'strip'
  | 'controller';

export interface RGBDevice {
  id: string;
  brand: RGBBrand;
  type: DeviceType;
  model: string;
  name: string;
  connected: boolean;
  leds: number; // Total LED count
  zones: RGBZone[];
  currentEffect: string | null;
  brightness: number; // 0-100
}

export interface RGBZone {
  id: string;
  name: string;
  leds: number[];
  color: { r: number; g: number; b: number };
}

export interface RGBEffect {
  id: string;
  name: string;
  type: 'static' | 'breathing' | 'wave' | 'rainbow' | 'reactive' | 'ripple' | 'custom';
  speed: number; // 1-10
  direction?: 'left' | 'right' | 'up' | 'down' | 'out' | 'in';
  colors: { r: number; g: number; b: number }[];
  devices: string[]; // Device IDs
}

export interface RGBProfile {
  id: string;
  name: string;
  description?: string;
  devices: {
    deviceId: string;
    effect: string;
    brightness: number;
    zones?: {
      zoneId: string;
      color: { r: number; g: number; b: number };
    }[];
  }[];
}

// Corsair iCUE
export interface CorsairDevice extends RGBDevice {
  icue: {
    profile: string;
    hardwarePlayback: boolean; // On-device memory
  };
}

// Razer Synapse
export interface RazerDevice extends RGBDevice {
  synapse: {
    profile: string;
    chromaConnect: boolean;
    hyperShift: boolean; // Secondary function layer
  };
}

// Logitech G Hub
export interface LogitechDevice extends RGBDevice {
  gHub: {
    profile: string;
    onboardMemory: boolean;
  };
}

// ASUS Aura Sync
export interface AsusDevice extends RGBDevice {
  auraSync: {
    syncGroup: string;
    strobeMode: boolean;
  };
}

// MSI Mystic Light
export interface MSIDevice extends RGBDevice {
  mysticLight: {
    syncMode: 'independent' | 'rainbow' | 'sync';
  };
}

// NZXT CAM
export interface NZXTDevice extends RGBDevice {
  cam: {
    channelMode: 'rgb' | 'digital' | 'both';
    fanCurve?: { temp: number; rpm: number }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class RGBPeripheralsService {
  // All RGB devices
  readonly devices = signal<RGBDevice[]>([]);

  // RGB effects
  readonly effects = signal<RGBEffect[]>([]);

  // RGB profiles
  readonly profiles = signal<RGBProfile[]>([]);

  // Active profile
  readonly activeProfile = signal<string | null>(null);

  // Sync enabled
  readonly syncEnabled = signal(false);

  // Computed
  readonly connectedDevices = computed(() =>
    this.devices().filter(d => d.connected)
  );

  readonly totalLEDs = computed(() =>
    this.devices().reduce((sum, d) => sum + d.leds, 0)
  );

  readonly devicesByBrand = computed(() => {
    const byBrand = new Map<RGBBrand, RGBDevice[]>();
    this.devices().forEach(device => {
      const devices = byBrand.get(device.brand) || [];
      devices.push(device);
      byBrand.set(device.brand, devices);
    });
    return byBrand;
  });

  /**
   * Scan for RGB devices
   */
  async scanDevices(): Promise<RGBDevice[]> {
    console.log('Scanning for RGB devices...');

    // In real implementation, connect to:
    // - Corsair iCUE SDK
    // - Razer Chroma SDK
    // - Logitech G SDK
    // - ASUS Aura SDK
    // - MSI Mystic Light SDK
    // - NZXT CAM API
    // - OpenRGB

    const mockDevices: RGBDevice[] = [
      // Corsair
      {
        id: 'corsair-k95-rgb',
        brand: 'corsair',
        type: 'keyboard',
        model: 'K95 RGB Platinum',
        name: 'Corsair K95 RGB',
        connected: true,
        leds: 113,
        zones: [
          { id: 'zone-main', name: 'Main Keys', leds: Array.from({ length: 104 }, (_, i) => i), color: { r: 255, g: 0, b: 255 } },
          { id: 'zone-macro', name: 'Macro Keys', leds: [104, 105, 106, 107, 108, 109], color: { r: 0, g: 255, b: 0 } },
          { id: 'zone-logo', name: 'Logo', leds: [110], color: { r: 255, g: 255, b: 255 } }
        ],
        currentEffect: null,
        brightness: 80
      },
      {
        id: 'corsair-dark-core',
        brand: 'corsair',
        type: 'mouse',
        model: 'Dark Core RGB Pro',
        name: 'Corsair Dark Core',
        connected: true,
        leds: 4,
        zones: [
          { id: 'zone-all', name: 'All Zones', leds: [0, 1, 2, 3], color: { r: 255, g: 0, b: 255 } }
        ],
        currentEffect: null,
        brightness: 100
      },
      {
        id: 'corsair-vengeance-rgb',
        brand: 'corsair',
        type: 'ram',
        model: 'Vengeance RGB Pro',
        name: 'Corsair Vengeance RAM',
        connected: true,
        leds: 40, // 4 sticks x 10 LEDs
        zones: [
          { id: 'zone-stick1', name: 'Stick 1', leds: Array.from({ length: 10 }, (_, i) => i), color: { r: 255, g: 0, b: 0 } },
          { id: 'zone-stick2', name: 'Stick 2', leds: Array.from({ length: 10 }, (_, i) => i + 10), color: { r: 255, g: 0, b: 0 } },
          { id: 'zone-stick3', name: 'Stick 3', leds: Array.from({ length: 10 }, (_, i) => i + 20), color: { r: 255, g: 0, b: 0 } },
          { id: 'zone-stick4', name: 'Stick 4', leds: Array.from({ length: 10 }, (_, i) => i + 30), color: { r: 255, g: 0, b: 0 } }
        ],
        currentEffect: null,
        brightness: 75
      },
      {
        id: 'corsair-ll120-fans',
        brand: 'corsair',
        type: 'fan',
        model: 'LL120 RGB',
        name: 'Corsair LL120 Fans',
        connected: true,
        leds: 48, // 3 fans x 16 LEDs
        zones: [
          { id: 'zone-fan1', name: 'Fan 1', leds: Array.from({ length: 16 }, (_, i) => i), color: { r: 0, g: 255, b: 255 } },
          { id: 'zone-fan2', name: 'Fan 2', leds: Array.from({ length: 16 }, (_, i) => i + 16), color: { r: 0, g: 255, b: 255 } },
          { id: 'zone-fan3', name: 'Fan 3', leds: Array.from({ length: 16 }, (_, i) => i + 32), color: { r: 0, g: 255, b: 255 } }
        ],
        currentEffect: null,
        brightness: 90
      },

      // Razer
      {
        id: 'razer-blackwidow',
        brand: 'razer',
        type: 'keyboard',
        model: 'BlackWidow V3 Pro',
        name: 'Razer BlackWidow',
        connected: true,
        leds: 104,
        zones: [
          { id: 'zone-all', name: 'All Keys', leds: Array.from({ length: 104 }, (_, i) => i), color: { r: 0, g: 255, b: 0 } }
        ],
        currentEffect: 'rainbow',
        brightness: 85
      },
      {
        id: 'razer-viper',
        brand: 'razer',
        type: 'mouse',
        model: 'Viper Ultimate',
        name: 'Razer Viper',
        connected: true,
        leds: 2,
        zones: [
          { id: 'zone-logo', name: 'Logo', leds: [0], color: { r: 0, g: 255, b: 0 } },
          { id: 'zone-scroll', name: 'Scroll Wheel', leds: [1], color: { r: 0, g: 255, b: 0 } }
        ],
        currentEffect: 'breathing',
        brightness: 100
      },

      // Logitech
      {
        id: 'logitech-g915',
        brand: 'logitech',
        type: 'keyboard',
        model: 'G915 TKL',
        name: 'Logitech G915',
        connected: true,
        leds: 87,
        zones: [
          { id: 'zone-all', name: 'All Keys', leds: Array.from({ length: 87 }, (_, i) => i), color: { r: 0, g: 100, b: 255 } }
        ],
        currentEffect: null,
        brightness: 70
      },

      // ASUS
      {
        id: 'asus-rog-strix-gpu',
        brand: 'asus',
        type: 'gpu',
        model: 'ROG Strix RTX 3080',
        name: 'ASUS GPU',
        connected: true,
        leds: 24,
        zones: [
          { id: 'zone-logo', name: 'ROG Logo', leds: Array.from({ length: 12 }, (_, i) => i), color: { r: 255, g: 0, b: 0 } },
          { id: 'zone-strip', name: 'LED Strip', leds: Array.from({ length: 12 }, (_, i) => i + 12), color: { r: 255, g: 0, b: 0 } }
        ],
        currentEffect: null,
        brightness: 100
      },

      // NZXT
      {
        id: 'nzxt-kraken-z73',
        brand: 'nzxt',
        type: 'cooler',
        model: 'Kraken Z73',
        name: 'NZXT Kraken AIO',
        connected: true,
        leds: 48, // 2 fans x 8 LEDs + ring
        zones: [
          { id: 'zone-ring', name: 'Pump Ring', leds: Array.from({ length: 32 }, (_, i) => i), color: { r: 128, g: 0, b: 255 } },
          { id: 'zone-fans', name: 'Fans', leds: Array.from({ length: 16 }, (_, i) => i + 32), color: { r: 128, g: 0, b: 255 } }
        ],
        currentEffect: null,
        brightness: 95
      }
    ];

    this.devices.set(mockDevices);
    this.initializeDefaultEffects();

    return mockDevices;
  }

  /**
   * Initialize default effects
   */
  private initializeDefaultEffects(): void {
    const defaultEffects: RGBEffect[] = [
      {
        id: 'rainbow-wave',
        name: 'Rainbow Wave',
        type: 'rainbow',
        speed: 5,
        direction: 'right',
        colors: [],
        devices: []
      },
      {
        id: 'breathing',
        name: 'Breathing',
        type: 'breathing',
        speed: 3,
        colors: [{ r: 0, g: 255, b: 255 }],
        devices: []
      },
      {
        id: 'reactive',
        name: 'Reactive Typing',
        type: 'reactive',
        speed: 7,
        colors: [{ r: 255, g: 255, b: 255 }],
        devices: []
      },
      {
        id: 'ripple',
        name: 'Ripple Effect',
        type: 'ripple',
        speed: 6,
        colors: [{ r: 0, g: 255, b: 255 }],
        devices: []
      },
      {
        id: 'static-purple',
        name: 'Static Purple',
        type: 'static',
        speed: 1,
        colors: [{ r: 128, g: 0, b: 255 }],
        devices: []
      }
    ];

    this.effects.set(defaultEffects);
  }

  /**
   * Set device color
   */
  setDeviceColor(deviceId: string, color: { r: number; g: number; b: number }): void {
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? {
              ...d,
              zones: d.zones.map(z => ({ ...z, color }))
            }
          : d
      )
    );

    // In real implementation, send to SDK
    console.log('Setting device color:', deviceId, color);
  }

  /**
   * Set zone color
   */
  setZoneColor(deviceId: string, zoneId: string, color: { r: number; g: number; b: number }): void {
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? {
              ...d,
              zones: d.zones.map(z =>
                z.id === zoneId ? { ...z, color } : z
              )
            }
          : d
      )
    );

    console.log('Setting zone color:', deviceId, zoneId, color);
  }

  /**
   * Set brightness
   */
  setBrightness(deviceId: string, brightness: number): void {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be 0-100');
    }

    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, brightness } : d
      )
    );

    console.log('Setting brightness:', deviceId, brightness);
  }

  /**
   * Apply effect to device
   */
  applyEffect(effectId: string, deviceIds: string[]): void {
    const effect = this.effects().find(e => e.id === effectId);
    if (!effect) return;

    // Update devices
    this.devices.update(devices =>
      devices.map(d =>
        deviceIds.includes(d.id)
          ? { ...d, currentEffect: effectId }
          : d
      )
    );

    // Update effect devices list
    this.effects.update(effects =>
      effects.map(e =>
        e.id === effectId
          ? { ...e, devices: deviceIds }
          : e
      )
    );

    console.log('Applied effect:', effect.name, 'to', deviceIds);
  }

  /**
   * Stop effect
   */
  stopEffect(deviceId: string): void {
    this.devices.update(devices =>
      devices.map(d =>
        d.id === deviceId ? { ...d, currentEffect: null } : d
      )
    );
  }

  /**
   * Create custom effect
   */
  createEffect(effect: Omit<RGBEffect, 'id'>): RGBEffect {
    const newEffect: RGBEffect = {
      ...effect,
      id: crypto.randomUUID()
    };

    this.effects.update(e => [...e, newEffect]);
    return newEffect;
  }

  /**
   * Create profile
   */
  createProfile(name: string, description?: string): RGBProfile {
    // Capture current state
    const profile: RGBProfile = {
      id: crypto.randomUUID(),
      name,
      description,
      devices: this.devices().map(d => ({
        deviceId: d.id,
        effect: d.currentEffect || '',
        brightness: d.brightness,
        zones: d.zones.map(z => ({
          zoneId: z.id,
          color: z.color
        }))
      }))
    };

    this.profiles.update(p => [...p, profile]);
    return profile;
  }

  /**
   * Apply profile
   */
  applyProfile(profileId: string): void {
    const profile = this.profiles().find(p => p.id === profileId);
    if (!profile) return;

    profile.devices.forEach(deviceConfig => {
      // Set brightness
      this.setBrightness(deviceConfig.deviceId, deviceConfig.brightness);

      // Set zone colors
      deviceConfig.zones?.forEach(zoneConfig => {
        this.setZoneColor(deviceConfig.deviceId, zoneConfig.zoneId, zoneConfig.color);
      });

      // Apply effect
      if (deviceConfig.effect) {
        this.applyEffect(deviceConfig.effect, [deviceConfig.deviceId]);
      }
    });

    this.activeProfile.set(profileId);
    console.log('Applied profile:', profile.name);
  }

  /**
   * Enable sync mode (all devices same color/effect)
   */
  enableSync(enabled: boolean): void {
    this.syncEnabled.set(enabled);

    if (enabled) {
      // Sync all devices to first device's settings
      const firstDevice = this.devices()[0];
      if (!firstDevice) return;

      const color = firstDevice.zones[0]?.color || { r: 255, g: 0, b: 255 };

      this.devices().forEach(device => {
        this.setDeviceColor(device.id, color);
      });
    }
  }

  /**
   * Turn all RGB off
   */
  turnAllOff(): void {
    this.devices().forEach(device => {
      this.setDeviceColor(device.id, { r: 0, g: 0, b: 0 });
      this.stopEffect(device.id);
    });
  }

  /**
   * Set all to one color
   */
  setAllColor(color: { r: number; g: number; b: number }): void {
    this.devices().forEach(device => {
      this.setDeviceColor(device.id, color);
    });
  }

  /**
   * Audio reactive mode (simulated)
   */
  enableAudioReactive(enabled: boolean): void {
    if (enabled) {
      console.log('Audio reactive mode enabled');
      // In real implementation, sample audio and adjust RGB in real-time
    } else {
      console.log('Audio reactive mode disabled');
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const byType = new Map<DeviceType, number>();
    this.devices().forEach(device => {
      byType.set(device.type, (byType.get(device.type) || 0) + 1);
    });

    return {
      totalDevices: this.devices().length,
      connectedDevices: this.connectedDevices().length,
      totalLEDs: this.totalLEDs(),
      devicesByType: Object.fromEntries(byType),
      brands: Array.from(this.devicesByBrand().keys()),
      activeEffects: this.devices().filter(d => d.currentEffect).length,
      profiles: this.profiles().length,
      syncEnabled: this.syncEnabled()
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): string {
    return JSON.stringify({
      devices: this.devices(),
      effects: this.effects(),
      profiles: this.profiles()
    }, null, 2);
  }
}
