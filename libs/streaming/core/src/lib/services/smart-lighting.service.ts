import { Injectable, signal, computed } from '@angular/core';

/**
 * Smart Lighting Integration Service
 * Control Philips Hue, Elgato Key Light, Nanoleaf, and other smart lights
 */

export type LightingBrand =
  | 'philips-hue'
  | 'elgato-keylight'
  | 'elgato-keylight-air'
  | 'nanoleaf'
  | 'lifx'
  | 'govee'
  | 'yeelight'
  | 'tp-link-kasa'
  | 'wyze'
  | 'dmx-lighting';

export interface SmartLight {
  id: string;
  brand: LightingBrand;
  name: string;
  type: 'bulb' | 'strip' | 'panel' | 'key-light' | 'ring-light' | 'bar';
  ipAddress?: string;
  macAddress?: string;
  on: boolean;
  brightness: number; // 0-100
  color?: RGBColor;
  colorTemperature?: number; // Kelvin (2700-6500)
  supportsColor: boolean;
  supportsTemperature: boolean;
  connected: boolean;
  room?: string;
  zone?: string;
}

export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSBColor {
  h: number; // 0-360 (hue)
  s: number; // 0-100 (saturation)
  b: number; // 0-100 (brightness)
}

export interface LightingScene {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  lights: {
    lightId: string;
    on: boolean;
    brightness: number;
    color?: RGBColor;
    colorTemperature?: number;
  }[];
  transition: number; // ms
}

export interface LightingEffect {
  id: string;
  name: string;
  type: 'pulse' | 'strobe' | 'fade' | 'rainbow' | 'wave' | 'custom';
  lights: string[]; // Light IDs
  speed: number; // 1-10
  intensity: number; // 0-100
  colors?: RGBColor[];
  running: boolean;
}

export interface LightingAutomation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'stream-start' | 'stream-end' | 'donation' | 'follower' | 'subscriber' | 'raid' | 'time';
    condition?: any;
  };
  action: {
    type: 'scene' | 'effect' | 'toggle' | 'brightness' | 'color';
    sceneId?: string;
    effectId?: string;
    brightness?: number;
    color?: RGBColor;
    lights: string[];
  };
}

// Philips Hue Bridge
export interface HueBridge {
  id: string;
  ipAddress: string;
  username?: string; // API key
  connected: boolean;
  lights: string[]; // Light IDs
  groups: HueGroup[];
}

export interface HueGroup {
  id: string;
  name: string;
  lights: string[];
  type: 'room' | 'zone' | 'entertainment';
}

// Elgato Key Light specific
export interface KeyLightSettings {
  brightness: number; // 0-100
  temperature: number; // 2900-7000K
  on: boolean;
}

// Nanoleaf specific
export interface NanoleafPanel {
  id: string;
  lightId: string;
  panelId: number;
  x: number;
  y: number;
  orientation: number;
  color?: RGBColor;
}

@Injectable({
  providedIn: 'root'
})
export class SmartLightingService {
  // All lights
  readonly lights = signal<SmartLight[]>([]);

  // Hue bridges
  readonly hueBridges = signal<HueBridge[]>([]);

  // Lighting scenes
  readonly scenes = signal<LightingScene[]>([]);

  // Active effects
  readonly effects = signal<LightingEffect[]>([]);

  // Automations
  readonly automations = signal<LightingAutomation[]>([]);

  // Nanoleaf panels
  readonly nanoleafPanels = signal<NanoleafPanel[]>([]);

  // Computed
  readonly connectedLights = computed(() =>
    this.lights().filter(l => l.connected)
  );

  readonly lightsOn = computed(() =>
    this.lights().filter(l => l.on).length
  );

  readonly runningEffects = computed(() =>
    this.effects().filter(e => e.running)
  );

  readonly enabledAutomations = computed(() =>
    this.automations().filter(a => a.enabled)
  );

  /**
   * Discover Philips Hue bridges
   */
  async discoverHueBridges(): Promise<HueBridge[]> {
    console.log('Discovering Philips Hue bridges...');

    try {
      // Use official Hue Discovery API
      const response = await fetch('https://discovery.meethue.com/');
      const data = await response.json();

      const bridges: HueBridge[] = data.map((bridge: any) => ({
        id: bridge.id,
        ipAddress: bridge.internalipaddress,
        connected: false,
        lights: [],
        groups: []
      }));

      this.hueBridges.set(bridges);
      return bridges;
    } catch (error) {
      console.error('Failed to discover Hue bridges:', error);

      // Fallback to mock data if discovery fails
      const bridges: HueBridge[] = [
        {
          id: 'hue-bridge-001',
          ipAddress: '192.168.1.100',
          connected: false,
          lights: [],
          groups: []
        }
      ];
      this.hueBridges.set(bridges);
      return bridges;
    }
  }

  /**
   * Connect to Hue bridge
   */
  async connectHueBridge(bridgeId: string): Promise<boolean> {
    console.log('Connecting to Hue bridge:', bridgeId);

    const bridge = this.hueBridges().find(b => b.id === bridgeId);
    if (!bridge) return false;

    try {
      // Create user/API key
      // User must press the link button on the bridge before calling this
      const response = await fetch(`http://${bridge.ipAddress}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devicetype: 'broady#streaming' })
      });

      const data = await response.json();

      if (data[0]?.error) {
        console.error('Hue bridge connection error:', data[0].error.description);

        // If link button not pressed, use stored username or mock
        const storedUsername = localStorage.getItem(`hue_bridge_${bridgeId}_username`);
        if (storedUsername) {
          this.hueBridges.update(bridges =>
            bridges.map(b =>
              b.id === bridgeId
                ? { ...b, username: storedUsername, connected: true }
                : b
            )
          );
          await this.discoverHueLights(bridgeId);
          return true;
        }

        throw new Error(data[0].error.description);
      }

      const username = data[0]?.success?.username;
      if (!username) {
        throw new Error('Failed to get username from bridge');
      }

      // Store username for future use
      localStorage.setItem(`hue_bridge_${bridgeId}_username`, username);

      this.hueBridges.update(bridges =>
        bridges.map(b =>
          b.id === bridgeId
            ? { ...b, username, connected: true }
            : b
        )
      );

      // Discover lights
      await this.discoverHueLights(bridgeId);

      return true;
    } catch (error) {
      console.error('Failed to connect to Hue bridge:', error);
      return false;
    }
  }

  /**
   * Discover lights on Hue bridge
   */
  private async discoverHueLights(bridgeId: string): Promise<void> {
    const bridge = this.hueBridges().find(b => b.id === bridgeId);
    if (!bridge || !bridge.username) return;

    try {
      const response = await fetch(`http://${bridge.ipAddress}/api/${bridge.username}/lights`);
      const lightsData = await response.json();

      const discoveredLights: SmartLight[] = [];

      for (const [lightId, lightData] of Object.entries(lightsData as any)) {
        const data = lightData as any;
        const state = data.state;
        const capabilities = data.capabilities?.control;

        // Convert XY color to RGB
        let color: RGBColor | undefined;
        if (state.xy) {
          color = this.xyToRgb(state.xy[0], state.xy[1], state.bri);
        }

        // Convert mireds to Kelvin
        const colorTemperature = state.ct ? Math.round(1000000 / state.ct) : undefined;

        discoveredLights.push({
          id: `hue-${bridgeId}-${lightId}`,
          brand: 'philips-hue',
          name: data.name,
          type: data.type.toLowerCase().includes('strip') ? 'strip' : 'bulb',
          ipAddress: bridge.ipAddress,
          on: state.on,
          brightness: Math.round((state.bri / 254) * 100),
          color,
          colorTemperature,
          supportsColor: capabilities?.colorgamuttype !== undefined,
          supportsTemperature: capabilities?.ct !== undefined,
          connected: state.reachable,
          room: data.room
        });
      }

      this.lights.update(lights => [
        ...lights.filter(l => l.brand !== 'philips-hue' || l.ipAddress !== bridge.ipAddress),
        ...discoveredLights
      ]);

      // Update bridge with light IDs
      this.hueBridges.update(bridges =>
        bridges.map(b =>
          b.id === bridgeId
            ? { ...b, lights: discoveredLights.map(l => l.id) }
            : b
        )
      );
    } catch (error) {
      console.error('Failed to discover Hue lights:', error);
    }
  }

  /**
   * Discover Elgato Key Lights
   */
  async discoverKeyLights(): Promise<SmartLight[]> {
    console.log('Discovering Elgato Key Lights...');

    // In real implementation, use Bonjour/mDNS discovery
    // Service name: _elg._tcp

    const mockKeyLights: SmartLight[] = [
      {
        id: 'keylight-1',
        brand: 'elgato-keylight',
        name: 'Key Light Left',
        type: 'key-light',
        ipAddress: '192.168.1.101',
        on: true,
        brightness: 50,
        colorTemperature: 4500,
        supportsColor: false,
        supportsTemperature: true,
        connected: true
      },
      {
        id: 'keylight-2',
        brand: 'elgato-keylight',
        name: 'Key Light Right',
        type: 'key-light',
        ipAddress: '192.168.1.102',
        on: true,
        brightness: 45,
        colorTemperature: 4500,
        supportsColor: false,
        supportsTemperature: true,
        connected: true
      }
    ];

    this.lights.update(lights => [...lights, ...mockKeyLights]);
    return mockKeyLights;
  }

  /**
   * Discover Nanoleaf panels
   */
  async discoverNanoleaf(): Promise<SmartLight[]> {
    console.log('Discovering Nanoleaf panels...');

    // In real implementation, use mDNS discovery
    // Service name: _nanoleafapi._tcp

    const mockNanoleaf: SmartLight = {
      id: 'nanoleaf-1',
      brand: 'nanoleaf',
      name: 'Nanoleaf Shapes',
      type: 'panel',
      ipAddress: '192.168.1.103',
      on: true,
      brightness: 70,
      color: { r: 255, g: 0, b: 128 },
      supportsColor: true,
      supportsTemperature: false,
      connected: true
    };

    this.lights.update(lights => [...lights, mockNanoleaf]);

    // Get panel layout
    await this.getNanoleafLayout('nanoleaf-1');

    return [mockNanoleaf];
  }

  /**
   * Get Nanoleaf panel layout
   */
  private async getNanoleafLayout(lightId: string): Promise<void> {
    // In real implementation, fetch from Nanoleaf API
    // GET http://{ip}:16021/api/v1/{auth_token}/panelLayout/layout

    const mockPanels: NanoleafPanel[] = [
      { id: 'panel-1', lightId, panelId: 1, x: 0, y: 0, orientation: 0 },
      { id: 'panel-2', lightId, panelId: 2, x: 100, y: 0, orientation: 60 },
      { id: 'panel-3', lightId, panelId: 3, x: 50, y: 86, orientation: 120 }
    ];

    this.nanoleafPanels.set(mockPanels);
  }

  /**
   * Turn light on/off
   */
  async setLightPower(lightId: string, on: boolean): Promise<void> {
    const light = this.lights().find(l => l.id === lightId);
    if (!light) return;

    this.lights.update(lights =>
      lights.map(l => l.id === lightId ? { ...l, on } : l)
    );

    await this.sendToLight(light, { on });
  }

  /**
   * Set light brightness
   */
  async setLightBrightness(lightId: string, brightness: number): Promise<void> {
    if (brightness < 0 || brightness > 100) {
      throw new Error('Brightness must be 0-100');
    }

    const light = this.lights().find(l => l.id === lightId);
    if (!light) return;

    this.lights.update(lights =>
      lights.map(l => l.id === lightId ? { ...l, brightness } : l)
    );

    await this.sendToLight(light, { brightness });
  }

  /**
   * Set light color (RGB)
   */
  async setLightColor(lightId: string, color: RGBColor): Promise<void> {
    const light = this.lights().find(l => l.id === lightId);
    if (!light || !light.supportsColor) return;

    this.lights.update(lights =>
      lights.map(l => l.id === lightId ? { ...l, color } : l)
    );

    await this.sendToLight(light, { color });
  }

  /**
   * Set color temperature
   */
  async setLightTemperature(lightId: string, temperature: number): Promise<void> {
    const light = this.lights().find(l => l.id === lightId);
    if (!light || !light.supportsTemperature) return;

    this.lights.update(lights =>
      lights.map(l => l.id === lightId ? { ...l, colorTemperature: temperature } : l)
    );

    await this.sendToLight(light, { colorTemperature: temperature });
  }

  /**
   * Send command to light
   */
  private async sendToLight(light: SmartLight, command: any): Promise<void> {
    console.log('Sending to light:', light.name, command);

    try {
      switch (light.brand) {
        case 'philips-hue': {
          // Extract light ID from our internal ID
          const lightId = light.id.split('-').pop();
          const bridgeId = light.id.split('-')[1];
          const bridge = this.hueBridges().find(b => b.id === bridgeId);

          if (!bridge?.username) {
            console.error('No bridge username available');
            return;
          }

          const state: any = {};

          if (command.on !== undefined) state.on = command.on;
          if (command.brightness !== undefined) state.bri = Math.round((command.brightness / 100) * 254);
          if (command.color) {
            const xy = this.rgbToXy(command.color.r, command.color.g, command.color.b);
            state.xy = xy;
          }
          if (command.colorTemperature) {
            state.ct = Math.round(1000000 / command.colorTemperature);
          }
          if (command.transition !== undefined) {
            state.transitiontime = Math.round(command.transition / 100);
          }

          await fetch(`http://${bridge.ipAddress}/api/${bridge.username}/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          });
          break;
        }

        case 'elgato-keylight':
        case 'elgato-keylight-air': {
          if (!light.ipAddress) return;

          // Elgato uses a special temperature scale (143-344)
          const temperature = command.colorTemperature
            ? Math.round(((command.colorTemperature - 2900) / (7000 - 2900)) * (344 - 143) + 143)
            : undefined;

          const body = {
            numberOfLights: 1,
            lights: [{
              on: command.on ? 1 : 0,
              brightness: command.brightness,
              temperature
            }]
          };

          await fetch(`http://${light.ipAddress}:9123/elgato/lights`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          break;
        }

        case 'nanoleaf': {
          if (!light.ipAddress) return;

          // Get auth token from local storage
          const authToken = localStorage.getItem(`nanoleaf_${light.id}_token`);
          if (!authToken) {
            console.error('No Nanoleaf auth token available');
            return;
          }

          const state: any = {};
          if (command.on !== undefined) state.on = { value: command.on };
          if (command.brightness !== undefined) state.brightness = { value: command.brightness };
          if (command.color) {
            const hsv = this.rgbToHsv(command.color.r, command.color.g, command.color.b);
            state.hue = { value: Math.round(hsv.h) };
            state.sat = { value: Math.round(hsv.s) };
          }

          await fetch(`http://${light.ipAddress}:16021/api/v1/${authToken}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          });
          break;
        }

        case 'lifx': {
          // LIFX uses cloud API
          const lifxToken = localStorage.getItem('lifx_token');
          if (!lifxToken) {
            console.error('No LIFX token available');
            return;
          }

          const selector = `id:${light.id}`;
          const state: any = {};

          if (command.on !== undefined) state.power = command.on ? 'on' : 'off';
          if (command.brightness !== undefined) state.brightness = command.brightness / 100;
          if (command.color) {
            const hsv = this.rgbToHsv(command.color.r, command.color.g, command.color.b);
            state.color = `hue:${hsv.h} saturation:${hsv.s / 100} brightness:${hsv.v / 100}`;
          }
          if (command.colorTemperature) state.color = `kelvin:${command.colorTemperature}`;
          if (command.transition) state.duration = command.transition / 1000;

          await fetch(`https://api.lifx.com/v1/lights/${selector}/state`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${lifxToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
          });
          break;
        }

        default:
          console.log('Light brand not implemented:', light.brand);
      }
    } catch (error) {
      console.error('Failed to send command to light:', error);
    }
  }

  /**
   * Create lighting scene
   */
  createScene(name: string, description?: string): LightingScene {
    // Capture current state of all lights
    const scene: LightingScene = {
      id: crypto.randomUUID(),
      name,
      description,
      lights: this.lights().map(l => ({
        lightId: l.id,
        on: l.on,
        brightness: l.brightness,
        color: l.color,
        colorTemperature: l.colorTemperature
      })),
      transition: 400 // ms
    };

    this.scenes.update(s => [...s, scene]);
    return scene;
  }

  /**
   * Activate scene
   */
  async activateScene(sceneId: string): Promise<void> {
    const scene = this.scenes().find(s => s.id === sceneId);
    if (!scene) return;

    console.log('Activating scene:', scene.name);

    // Apply scene to all lights
    for (const lightState of scene.lights) {
      const light = this.lights().find(l => l.id === lightState.lightId);
      if (!light) continue;

      this.lights.update(lights =>
        lights.map(l =>
          l.id === lightState.lightId
            ? {
                ...l,
                on: lightState.on,
                brightness: lightState.brightness,
                color: lightState.color,
                colorTemperature: lightState.colorTemperature
              }
            : l
        )
      );

      await this.sendToLight(light, {
        on: lightState.on,
        brightness: lightState.brightness,
        color: lightState.color,
        colorTemperature: lightState.colorTemperature,
        transition: scene.transition
      });
    }
  }

  /**
   * Create effect
   */
  createEffect(
    name: string,
    type: LightingEffect['type'],
    lights: string[]
  ): LightingEffect {
    const effect: LightingEffect = {
      id: crypto.randomUUID(),
      name,
      type,
      lights,
      speed: 5,
      intensity: 80,
      running: false
    };

    this.effects.update(e => [...e, effect]);
    return effect;
  }

  /**
   * Start effect
   */
  startEffect(effectId: string): void {
    const effect = this.effects().find(e => e.id === effectId);
    if (!effect) return;

    this.effects.update(effects =>
      effects.map(e => e.id === effectId ? { ...e, running: true } : e)
    );

    this.runEffect(effect);
  }

  /**
   * Stop effect
   */
  stopEffect(effectId: string): void {
    this.effects.update(effects =>
      effects.map(e => e.id === effectId ? { ...e, running: false } : e)
    );
  }

  /**
   * Run effect loop
   */
  private async runEffect(effect: LightingEffect): Promise<void> {
    const interval = 1000 / effect.speed;

    const loop = async () => {
      const currentEffect = this.effects().find(e => e.id === effect.id);
      if (!currentEffect?.running) return;

      switch (effect.type) {
        case 'pulse':
          await this.pulseLights(effect.lights, effect.intensity);
          break;

        case 'strobe':
          await this.strobeLights(effect.lights);
          break;

        case 'rainbow':
          await this.rainbowLights(effect.lights);
          break;

        default:
          console.log('Effect type not implemented:', effect.type);
      }

      setTimeout(loop, interval);
    };

    loop();
  }

  /**
   * Pulse effect
   */
  private async pulseLights(lightIds: string[], intensity: number): Promise<void> {
    const brightness = Math.floor(50 + (Math.sin(Date.now() / 500) * 50 * intensity / 100));

    for (const lightId of lightIds) {
      await this.setLightBrightness(lightId, brightness);
    }
  }

  /**
   * Strobe effect
   */
  private async strobeLights(lightIds: string[]): Promise<void> {
    const on = Date.now() % 200 < 100;

    for (const lightId of lightIds) {
      await this.setLightPower(lightId, on);
    }
  }

  /**
   * Rainbow effect
   */
  private async rainbowLights(lightIds: string[]): Promise<void> {
    const hue = (Date.now() / 20) % 360;

    for (const lightId of lightIds) {
      const color = this.hsvToRgb(hue, 100, 100);
      await this.setLightColor(lightId, color);
    }
  }

  /**
   * Create automation
   */
  createAutomation(automation: Omit<LightingAutomation, 'id'>): LightingAutomation {
    const newAutomation: LightingAutomation = {
      ...automation,
      id: crypto.randomUUID()
    };

    this.automations.update(a => [...a, newAutomation]);
    return newAutomation;
  }

  /**
   * Trigger automation
   */
  async triggerAutomation(trigger: LightingAutomation['trigger']): Promise<void> {
    const matchingAutomations = this.automations().filter(
      a => a.enabled && a.trigger.type === trigger.type
    );

    for (const automation of matchingAutomations) {
      await this.executeAutomationAction(automation.action);
    }
  }

  /**
   * Execute automation action
   */
  private async executeAutomationAction(action: LightingAutomation['action']): Promise<void> {
    switch (action.type) {
      case 'scene':
        if (action.sceneId) {
          await this.activateScene(action.sceneId);
        }
        break;

      case 'effect':
        if (action.effectId) {
          this.startEffect(action.effectId);
        }
        break;

      case 'brightness':
        if (action.brightness !== undefined) {
          for (const lightId of action.lights) {
            await this.setLightBrightness(lightId, action.brightness);
          }
        }
        break;

      case 'color':
        if (action.color) {
          for (const lightId of action.lights) {
            await this.setLightColor(lightId, action.color);
          }
        }
        break;

      case 'toggle':
        for (const lightId of action.lights) {
          const light = this.lights().find(l => l.id === lightId);
          if (light) {
            await this.setLightPower(lightId, !light.on);
          }
        }
        break;
    }
  }

  /**
   * Convert HSV to RGB
   */
  private hsvToRgb(h: number, s: number, v: number): RGBColor {
    s /= 100;
    v /= 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Convert RGB to HSV
   */
  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * (((b - r) / delta) + 2);
      } else {
        h = 60 * (((r - g) / delta) + 4);
      }
    }

    if (h < 0) h += 360;

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    return { h, s, v };
  }

  /**
   * Convert RGB to XY (for Philips Hue)
   */
  private rgbToXy(r: number, g: number, b: number): [number, number] {
    // Normalize RGB values
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Apply gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert to XYZ
    const X = r * 0.649926 + g * 0.103455 + b * 0.197109;
    const Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
    const Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;

    // Calculate xy
    const sum = X + Y + Z;
    if (sum === 0) return [0, 0];

    const x = X / sum;
    const y = Y / sum;

    return [x, y];
  }

  /**
   * Convert XY to RGB (for Philips Hue)
   */
  private xyToRgb(x: number, y: number, brightness: number): RGBColor {
    const z = 1.0 - x - y;
    const Y = brightness / 254;
    const X = (Y / y) * x;
    const Z = (Y / y) * z;

    // Convert to RGB using Wide RGB D65 conversion
    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;

    // Apply reverse gamma correction
    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, 1.0 / 2.4) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, 1.0 / 2.4) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, 1.0 / 2.4) - 0.055;

    // Clamp values
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * All lights off
   */
  async allOff(): Promise<void> {
    for (const light of this.lights()) {
      await this.setLightPower(light.id, false);
    }
  }

  /**
   * All lights on
   */
  async allOn(): Promise<void> {
    for (const light of this.lights()) {
      await this.setLightPower(light.id, true);
    }
  }
}
