import { Injectable, signal, computed } from '@angular/core';

/**
 * Hardware Control Service
 * PTZ Cameras, DSLRs, MIDI Controllers, and other hardware control
 */

// ========== PTZ CAMERAS ==========

export interface PTZCamera {
  id: string;
  name: string;
  brand: 'sony' | 'panasonic' | 'canon' | 'ptzoptics' | 'logitech' | 'aver' | 'generic';
  ipAddress?: string;
  protocol: 'visca' | 'pelco-d' | 'pelco-p' | 'onvif' | 'http';
  connected: boolean;
  position: {
    pan: number; // -180 to 180 degrees
    tilt: number; // -90 to 90 degrees
    zoom: number; // 0-100
  };
  presets: CameraPreset[];
  capabilities: {
    maxPan: number;
    maxTilt: number;
    maxZoom: number;
    hasAutofocus: boolean;
    hasIris: boolean;
    hasWhiteBalance: boolean;
  };
}

export interface CameraPreset {
  id: string;
  number: number; // 1-255
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  focus?: number;
}

// ========== DSLR CAMERAS ==========

export interface DSLRCamera {
  id: string;
  name: string;
  brand: 'sony' | 'canon' | 'nikon' | 'fujifilm' | 'panasonic';
  model: string;
  connected: boolean;
  connectionType: 'usb' | 'wifi' | 'ethernet';
  liveView: boolean;
  recording: boolean;
  settings: DSLRSettings;
  battery: number; // 0-100%
  storageRemaining: number; // GB
}

export interface DSLRSettings {
  mode: 'auto' | 'program' | 'aperture' | 'shutter' | 'manual' | 'video';
  shutter: string; // '1/60', '1/125', etc.
  aperture: string; // 'f/2.8', 'f/5.6', etc.
  iso: number;
  whiteBalance: 'auto' | 'daylight' | 'cloudy' | 'tungsten' | 'fluorescent' | number; // K
  focusMode: 'auto' | 'manual';
  imageQuality: 'raw' | 'jpeg-fine' | 'jpeg-normal' | 'raw+jpeg';
}

// ========== MIDI CONTROLLERS ==========

export interface MIDIController {
  id: string;
  name: string;
  manufacturer: string;
  type: 'keyboard' | 'pad' | 'fader' | 'knob' | 'generic';
  inputs: number;
  outputs: number;
  connected: boolean;
  mappings: MIDIMapping[];
}

export interface MIDIMapping {
  id: string;
  name: string;
  midiType: 'note' | 'cc' | 'program-change';
  channel: number; // 1-16
  noteOrCC: number; // 0-127
  action: {
    type: 'scene' | 'source' | 'filter' | 'audio' | 'transition' | 'script' | 'hotkey';
    target: string;
    parameter?: string;
    min?: number;
    max?: number;
  };
}

export interface MIDIEvent {
  type: 'noteon' | 'noteoff' | 'cc' | 'program-change';
  channel: number;
  note?: number;
  cc?: number;
  value: number; // 0-127
  timestamp: number;
}

// ========== GAME CONTROLLERS ==========

export interface GameController {
  id: string;
  index: number;
  name: string;
  brand: 'xbox' | 'playstation' | 'nintendo' | 'generic';
  connected: boolean;
  buttons: number;
  axes: number;
  mappings: ControllerMapping[];
}

export interface ControllerMapping {
  id: string;
  button?: number;
  axis?: number;
  action: string;
}

@Injectable({
  providedIn: 'root'
})
export class HardwareControlService {
  // PTZ Cameras
  readonly ptzCameras = signal<PTZCamera[]>([]);

  // DSLR Cameras
  readonly dslrCameras = signal<DSLRCamera[]>([]);

  // MIDI Controllers
  readonly midiControllers = signal<MIDIController[]>([]);

  // Game Controllers
  readonly gameControllers = signal<GameController[]>([]);

  // MIDI events history
  readonly midiEvents = signal<MIDIEvent[]>([]);

  // Computed
  readonly connectedPTZ = computed(() =>
    this.ptzCameras().filter(c => c.connected)
  );

  readonly connectedDSLR = computed(() =>
    this.dslrCameras().filter(c => c.connected)
  );

  readonly connectedMIDI = computed(() =>
    this.midiControllers().filter(c => c.connected)
  );

  readonly totalMIDIMappings = computed(() =>
    this.midiControllers().reduce((sum, c) => sum + c.mappings.length, 0)
  );

  // ========== PTZ CAMERA METHODS ==========

  /**
   * Discover PTZ cameras on network
   */
  async discoverPTZCameras(): Promise<PTZCamera[]> {
    console.log('Discovering PTZ cameras...');

    // In real implementation, use ONVIF discovery or IP scanning

    const mockCameras: PTZCamera[] = [
      {
        id: 'ptz-001',
        name: 'PTZOptics 20X-SDI',
        brand: 'ptzoptics',
        ipAddress: '192.168.1.200',
        protocol: 'visca',
        connected: false,
        position: { pan: 0, tilt: 0, zoom: 0 },
        presets: [],
        capabilities: {
          maxPan: 170,
          maxTilt: 90,
          maxZoom: 20,
          hasAutofocus: true,
          hasIris: true,
          hasWhiteBalance: true
        }
      }
    ];

    this.ptzCameras.set(mockCameras);
    return mockCameras;
  }

  /**
   * Connect to PTZ camera
   */
  async connectPTZCamera(cameraId: string): Promise<boolean> {
    console.log('Connecting to PTZ camera:', cameraId);

    // In real implementation, establish connection via protocol

    this.ptzCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId ? { ...c, connected: true } : c
      )
    );

    return true;
  }

  /**
   * Move PTZ camera
   */
  async movePTZ(
    cameraId: string,
    pan?: number,
    tilt?: number,
    zoom?: number
  ): Promise<void> {
    const camera = this.ptzCameras().find(c => c.id === cameraId);
    if (!camera || !camera.connected) return;

    const newPosition = {
      pan: pan ?? camera.position.pan,
      tilt: tilt ?? camera.position.tilt,
      zoom: zoom ?? camera.position.zoom
    };

    this.ptzCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId
          ? { ...c, position: newPosition }
          : c
      )
    );

    // Send command to camera
    console.log('Moving PTZ:', newPosition);
  }

  /**
   * Save PTZ preset
   */
  savePTZPreset(cameraId: string, number: number, name: string): void {
    const camera = this.ptzCameras().find(c => c.id === cameraId);
    if (!camera) return;

    const preset: CameraPreset = {
      id: crypto.randomUUID(),
      number,
      name,
      pan: camera.position.pan,
      tilt: camera.position.tilt,
      zoom: camera.position.zoom
    };

    this.ptzCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId
          ? {
              ...c,
              presets: [...c.presets.filter(p => p.number !== number), preset]
            }
          : c
      )
    );
  }

  /**
   * Recall PTZ preset
   */
  async recallPTZPreset(cameraId: string, presetNumber: number): Promise<void> {
    const camera = this.ptzCameras().find(c => c.id === cameraId);
    if (!camera) return;

    const preset = camera.presets.find(p => p.number === presetNumber);
    if (!preset) return;

    await this.movePTZ(cameraId, preset.pan, preset.tilt, preset.zoom);
  }

  // ========== DSLR CAMERA METHODS ==========

  /**
   * Discover DSLR cameras
   */
  async discoverDSLRCameras(): Promise<DSLRCamera[]> {
    console.log('Discovering DSLR cameras...');

    // In real implementation, use gphoto2 or camera manufacturer SDK

    const mockDSLRs: DSLRCamera[] = [
      {
        id: 'dslr-001',
        name: 'Sony A7 III',
        brand: 'sony',
        model: 'ILCE-7M3',
        connected: false,
        connectionType: 'usb',
        liveView: false,
        recording: false,
        settings: {
          mode: 'manual',
          shutter: '1/60',
          aperture: 'f/2.8',
          iso: 800,
          whiteBalance: 'auto',
          focusMode: 'auto',
          imageQuality: 'raw+jpeg'
        },
        battery: 85,
        storageRemaining: 45.2
      }
    ];

    this.dslrCameras.set(mockDSLRs);
    return mockDSLRs;
  }

  /**
   * Connect to DSLR
   */
  async connectDSLR(cameraId: string): Promise<boolean> {
    console.log('Connecting to DSLR:', cameraId);

    this.dslrCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId ? { ...c, connected: true } : c
      )
    );

    return true;
  }

  /**
   * Start DSLR live view
   */
  async startDSLRLiveView(cameraId: string): Promise<void> {
    this.dslrCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId ? { ...c, liveView: true } : c
      )
    );

    console.log('Started live view:', cameraId);
  }

  /**
   * Take photo with DSLR
   */
  async takeDSLRPhoto(cameraId: string): Promise<string> {
    console.log('Taking photo with:', cameraId);

    // In real implementation, trigger shutter and download image
    return '/photos/image_' + Date.now() + '.jpg';
  }

  /**
   * Update DSLR settings
   */
  updateDSLRSettings(cameraId: string, settings: Partial<DSLRSettings>): void {
    this.dslrCameras.update(cameras =>
      cameras.map(c =>
        c.id === cameraId
          ? { ...c, settings: { ...c.settings, ...settings } }
          : c
      )
    );
  }

  // ========== MIDI CONTROLLER METHODS ==========

  /**
   * Request MIDI access
   */
  async requestMIDIAccess(): Promise<void> {
    console.log('Requesting MIDI access...');

    // In real implementation, use Web MIDI API
    // if (navigator.requestMIDIAccess) {
    //   const access = await navigator.requestMIDIAccess();
    //   access.inputs.forEach(input => {
    //     this.connectMIDIController(input);
    //   });
    // }

    const mockControllers: MIDIController[] = [
      {
        id: 'midi-001',
        name: 'Akai APC Key 25',
        manufacturer: 'Akai',
        type: 'keyboard',
        inputs: 1,
        outputs: 1,
        connected: true,
        mappings: []
      },
      {
        id: 'midi-002',
        name: 'Behringer X-Touch Mini',
        manufacturer: 'Behringer',
        type: 'fader',
        inputs: 1,
        outputs: 1,
        connected: true,
        mappings: []
      }
    ];

    this.midiControllers.set(mockControllers);
    this.startMIDIListening();
  }

  /**
   * Start MIDI listening
   */
  private startMIDIListening(): void {
    console.log('Started MIDI listening');

    // In real implementation, listen to MIDI events
    // input.onmidimessage = (event) => this.handleMIDIMessage(event);
  }

  /**
   * Handle MIDI message
   */
  private handleMIDIMessage(data: Uint8Array): void {
    const [status, noteOrCC, value] = data;
    const type = (status & 0xf0) >> 4;
    const channel = (status & 0x0f) + 1;

    let event: MIDIEvent;

    switch (type) {
      case 9: // Note On
        event = {
          type: 'noteon',
          channel,
          note: noteOrCC,
          value,
          timestamp: Date.now()
        };
        break;

      case 8: // Note Off
        event = {
          type: 'noteoff',
          channel,
          note: noteOrCC,
          value: 0,
          timestamp: Date.now()
        };
        break;

      case 11: // Control Change
        event = {
          type: 'cc',
          channel,
          cc: noteOrCC,
          value,
          timestamp: Date.now()
        };
        break;

      default:
        return;
    }

    // Store event
    this.midiEvents.update(events => [...events.slice(-99), event]);

    // Find and execute mapping
    this.executeMIDIMapping(event);
  }

  /**
   * Create MIDI mapping
   */
  createMIDIMapping(
    controllerId: string,
    mapping: Omit<MIDIMapping, 'id'>
  ): MIDIMapping {
    const newMapping: MIDIMapping = {
      ...mapping,
      id: crypto.randomUUID()
    };

    this.midiControllers.update(controllers =>
      controllers.map(c =>
        c.id === controllerId
          ? { ...c, mappings: [...c.mappings, newMapping] }
          : c
      )
    );

    return newMapping;
  }

  /**
   * Execute MIDI mapping
   */
  private executeMIDIMapping(event: MIDIEvent): void {
    // Find matching mappings
    for (const controller of this.midiControllers()) {
      for (const mapping of controller.mappings) {
        if (
          mapping.channel === event.channel &&
          ((mapping.midiType === 'note' && event.note === mapping.noteOrCC) ||
            (mapping.midiType === 'cc' && event.cc === mapping.noteOrCC))
        ) {
          console.log('Executing MIDI mapping:', mapping.name);

          // Execute action
          this.executeMIDIAction(mapping.action, event.value);
        }
      }
    }
  }

  /**
   * Execute MIDI action
   */
  private executeMIDIAction(action: MIDIMapping['action'], value: number): void {
    console.log('MIDI action:', action.type, action.target, value);

    // In real implementation, call appropriate service
    switch (action.type) {
      case 'scene':
        console.log('Switch to scene:', action.target);
        break;

      case 'source':
        console.log('Toggle source:', action.target);
        break;

      case 'audio':
        const volume = this.mapRange(value, 0, 127, action.min || 0, action.max || 100);
        console.log('Set audio volume:', action.target, volume);
        break;

      default:
        console.log('Unknown MIDI action:', action.type);
    }
  }

  // ========== GAME CONTROLLER METHODS ==========

  /**
   * Scan for game controllers
   */
  scanGameControllers(): void {
    console.log('Scanning for game controllers...');

    // In real implementation, use Gamepad API
    // const gamepads = navigator.getGamepads();

    const mockControllers: GameController[] = [
      {
        id: 'gamepad-0',
        index: 0,
        name: 'Xbox Controller',
        brand: 'xbox',
        connected: true,
        buttons: 16,
        axes: 4,
        mappings: []
      }
    ];

    this.gameControllers.set(mockControllers);
  }

  /**
   * Map controller button to action
   */
  mapControllerButton(
    controllerId: string,
    button: number,
    action: string
  ): void {
    this.gameControllers.update(controllers =>
      controllers.map(c =>
        c.id === controllerId
          ? {
              ...c,
              mappings: [
                ...c.mappings.filter(m => m.button !== button),
                {
                  id: crypto.randomUUID(),
                  button,
                  action
                }
              ]
            }
          : c
      )
    );
  }

  // ========== UTILITY METHODS ==========

  /**
   * Map value from one range to another
   */
  private mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Get all connected hardware
   */
  getAllConnectedHardware() {
    return {
      ptzCameras: this.connectedPTZ().length,
      dslrCameras: this.connectedDSLR().length,
      midiControllers: this.connectedMIDI().length,
      gameControllers: this.gameControllers().filter(c => c.connected).length
    };
  }
}
