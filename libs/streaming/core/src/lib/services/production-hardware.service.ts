import { Injectable, signal, computed } from '@angular/core';

/**
 * Production Hardware Service
 * Video switchers, motorized equipment, teleprompters, IoT devices
 */

// ========== VIDEO SWITCHERS ==========

export type SwitcherBrand = 'blackmagic' | 'roland' | 'newtek' | 'vmix' | 'livestream' | 'teradek';

export interface VideoSwitcher {
  id: string;
  brand: SwitcherBrand;
  model: string;
  name: string;
  connected: boolean;
  inputs: number;
  outputs: number;
  currentProgram: number; // Input number
  currentPreview: number; // Input number
  transition: {
    type: 'cut' | 'mix' | 'dip' | 'wipe' | 'sting';
    duration: number; // frames
  };
  macros: SwitcherMacro[];
}

export interface SwitcherMacro {
  id: string;
  name: string;
  actions: SwitcherAction[];
}

export interface SwitcherAction {
  type: 'switch-input' | 'transition' | 'fade-audio' | 'set-key' | 'delay';
  params: any;
}

// ========== MOTORIZED EQUIPMENT ==========

export interface MotorizedSlider {
  id: string;
  brand: 'edelkrone' | 'rhino' | 'konova' | 'kessler' | 'syrp';
  model: string;
  name: string;
  connected: boolean;
  length: number; // cm
  position: number; // 0-100%
  speed: number; // 0-100%
  direction: 'forward' | 'backward';
  looping: boolean;
  keyframes: SliderKeyframe[];
}

export interface SliderKeyframe {
  id: string;
  position: number; // 0-100%
  timestamp: number; // seconds
}

export interface Gimbal {
  id: string;
  brand: 'dji' | 'zhiyun' | 'freefly' | 'moza' | 'ikan';
  model: string;
  name: string;
  connected: boolean;
  axes: 3 | 4; // 3-axis or 4-axis
  pan: number; // -180 to 180
  tilt: number; // -90 to 90
  roll: number; // -45 to 45
  mode: 'lock' | 'follow' | 'fpv' | 'pan-follow';
  stabilization: boolean;
}

export interface RoboticArm {
  id: string;
  brand: 'freefly' | 'dji' | 'bolt' | 'camcat';
  model: string;
  name: string;
  connected: boolean;
  axes: number; // 6 or 7 axis
  position: {
    x: number;
    y: number;
    z: number;
    pan: number;
    tilt: number;
    roll: number;
  };
  presets: ArmPreset[];
  motionPath: MotionPathPoint[];
}

export interface ArmPreset {
  id: string;
  name: string;
  position: RoboticArm['position'];
  speed: number;
}

export interface MotionPathPoint {
  timestamp: number; // seconds
  position: RoboticArm['position'];
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// ========== TELEPROMPTERS ==========

export interface Teleprompter {
  id: string;
  brand: 'glide-gear' | 'parrot' | 'caddie-buddy' | 'ikan' | 'autoscript';
  model: string;
  name: string;
  connected: boolean;
  script: string;
  scrollSpeed: number; // words per minute
  fontSize: number; // px
  mirrored: boolean;
  scrolling: boolean;
  position: number; // Current scroll position (0-100%)
}

// ========== SMART HOME & IOT ==========

export interface SmartPlug {
  id: string;
  brand: 'tp-link' | 'wyze' | 'shelly' | 'wemo' | 'kasa';
  name: string;
  ipAddress?: string;
  on: boolean;
  power: number; // Watts
  schedule?: PlugSchedule[];
}

export interface PlugSchedule {
  id: string;
  name: string;
  time: string; // HH:MM
  days: number[]; // 0-6 (Sun-Sat)
  action: 'on' | 'off';
  enabled: boolean;
}

export interface SmartThermostat {
  id: string;
  brand: 'nest' | 'ecobee' | 'honeywell' | 'wyze';
  name: string;
  currentTemp: number; // °F
  targetTemp: number; // °F
  mode: 'heat' | 'cool' | 'auto' | 'off';
  fan: 'auto' | 'on';
  humidity: number; // %
}

export interface EffectsMachine {
  id: string;
  type: 'smoke' | 'fog' | 'haze' | 'bubble' | 'confetti' | 'laser';
  brand: 'chauvet' | 'adj' | 'antari' | 'kvant';
  model: string;
  name: string;
  connected: boolean;
  on: boolean;
  intensity: number; // 0-100%
  dmxChannel?: number;
}

export interface DeskController {
  id: string;
  brand: 'uplift' | 'fully' | 'jarvis' | 'flexispot';
  name: string;
  connected: boolean;
  height: number; // inches
  presets: DeskPreset[];
  moving: boolean;
}

export interface DeskPreset {
  id: string;
  name: string;
  height: number; // inches
}

// ========== ARDUINO / GPIO ==========

export interface ArduinoDevice {
  id: string;
  port: string;
  boardType: 'uno' | 'mega' | 'nano' | 'esp32' | 'raspberry-pi';
  connected: boolean;
  pins: ArduinoPin[];
}

export interface ArduinoPin {
  number: number;
  mode: 'input' | 'output' | 'pwm' | 'analog';
  value: number;
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductionHardwareService {
  // Video switchers
  readonly videoSwitchers = signal<VideoSwitcher[]>([]);

  // Motorized equipment
  readonly motorizedSliders = signal<MotorizedSlider[]>([]);
  readonly gimbals = signal<Gimbal[]>([]);
  readonly roboticArms = signal<RoboticArm[]>([]);

  // Teleprompters
  readonly teleprompters = signal<Teleprompter[]>([]);

  // Smart home / IoT
  readonly smartPlugs = signal<SmartPlug[]>([]);
  readonly thermostats = signal<SmartThermostat[]>([]);
  readonly effectsMachines = signal<EffectsMachine[]>([]);
  readonly deskControllers = signal<DeskController[]>([]);

  // Arduino / GPIO
  readonly arduinoDevices = signal<ArduinoDevice[]>([]);

  // Computed
  readonly totalDevices = computed(() =>
    this.videoSwitchers().length +
    this.motorizedSliders().length +
    this.gimbals().length +
    this.roboticArms().length +
    this.teleprompters().length +
    this.smartPlugs().length +
    this.thermostats().length +
    this.effectsMachines().length +
    this.deskControllers().length +
    this.arduinoDevices().length
  );

  // ========== VIDEO SWITCHER METHODS ==========

  /**
   * Discover video switchers
   */
  async discoverVideoSwitchers(): Promise<VideoSwitcher[]> {
    console.log('Discovering video switchers...');

    const mockSwitchers: VideoSwitcher[] = [
      {
        id: 'atem-mini',
        brand: 'blackmagic',
        model: 'ATEM Mini Pro',
        name: 'ATEM Mini Pro',
        connected: true,
        inputs: 4,
        outputs: 1,
        currentProgram: 1,
        currentPreview: 2,
        transition: {
          type: 'mix',
          duration: 30
        },
        macros: []
      },
      {
        id: 'roland-v1hd',
        brand: 'roland',
        model: 'V-1HD',
        name: 'Roland V-1HD',
        connected: true,
        inputs: 4,
        outputs: 2,
        currentProgram: 1,
        currentPreview: 1,
        transition: {
          type: 'cut',
          duration: 0
        },
        macros: []
      }
    ];

    this.videoSwitchers.set(mockSwitchers);
    return mockSwitchers;
  }

  /**
   * Switch program input
   */
  switchProgram(switcherId: string, inputNumber: number): void {
    this.videoSwitchers.update(switchers =>
      switchers.map(s =>
        s.id === switcherId
          ? { ...s, currentProgram: inputNumber }
          : s
      )
    );

    console.log('Switched program to input:', inputNumber);
  }

  /**
   * Auto transition
   */
  autoTransition(switcherId: string): void {
    const switcher = this.videoSwitchers().find(s => s.id === switcherId);
    if (!switcher) return;

    console.log('Auto transition:', switcher.currentPreview, '→', switcher.currentProgram);

    // Swap program and preview
    this.videoSwitchers.update(switchers =>
      switchers.map(s =>
        s.id === switcherId
          ? {
              ...s,
              currentProgram: s.currentPreview,
              currentPreview: s.currentProgram
            }
          : s
      )
    );
  }

  // ========== MOTORIZED SLIDER METHODS ==========

  /**
   * Discover sliders
   */
  async discoverSliders(): Promise<MotorizedSlider[]> {
    const mockSliders: MotorizedSlider[] = [
      {
        id: 'edelkrone-slide',
        brand: 'edelkrone',
        model: 'SliderPLUS Pro',
        name: 'Edelkrone Slider',
        connected: true,
        length: 120, // cm
        position: 0,
        speed: 50,
        direction: 'forward',
        looping: false,
        keyframes: []
      }
    ];

    this.motorizedSliders.set(mockSliders);
    return mockSliders;
  }

  /**
   * Move slider
   */
  moveSlider(sliderId: string, position: number, speed: number): void {
    this.motorizedSliders.update(sliders =>
      sliders.map(s =>
        s.id === sliderId
          ? { ...s, position, speed }
          : s
      )
    );

    console.log('Moving slider to:', position, 'at speed:', speed);
  }

  /**
   * Add keyframe
   */
  addSliderKeyframe(sliderId: string, position: number, timestamp: number): void {
    this.motorizedSliders.update(sliders =>
      sliders.map(s =>
        s.id === sliderId
          ? {
              ...s,
              keyframes: [
                ...s.keyframes,
                {
                  id: crypto.randomUUID(),
                  position,
                  timestamp
                }
              ]
            }
          : s
      )
    );
  }

  // ========== GIMBAL METHODS ==========

  /**
   * Discover gimbals
   */
  async discoverGimbals(): Promise<Gimbal[]> {
    const mockGimbals: Gimbal[] = [
      {
        id: 'dji-rs3',
        brand: 'dji',
        model: 'RS 3 Pro',
        name: 'DJI RS 3',
        connected: true,
        axes: 3,
        pan: 0,
        tilt: 0,
        roll: 0,
        mode: 'follow',
        stabilization: true
      }
    ];

    this.gimbals.set(mockGimbals);
    return mockGimbals;
  }

  /**
   * Set gimbal mode
   */
  setGimbalMode(gimbalId: string, mode: Gimbal['mode']): void {
    this.gimbals.update(gimbals =>
      gimbals.map(g =>
        g.id === gimbalId ? { ...g, mode } : g
      )
    );

    console.log('Set gimbal mode:', mode);
  }

  // ========== TELEPROMPTER METHODS ==========

  /**
   * Discover teleprompters
   */
  async discoverTeleprompters(): Promise<Teleprompter[]> {
    const mockTeleprompters: Teleprompter[] = [
      {
        id: 'parrot-tp',
        brand: 'parrot',
        model: 'Parrot Pro',
        name: 'Teleprompter',
        connected: true,
        script: 'Welcome to the stream! Today we will be discussing...',
        scrollSpeed: 180, // WPM
        fontSize: 48,
        mirrored: true,
        scrolling: false,
        position: 0
      }
    ];

    this.teleprompters.set(mockTeleprompters);
    return mockTeleprompters;
  }

  /**
   * Start/stop scrolling
   */
  toggleTeleprompterScroll(teleprompter: string): void {
    this.teleprompters.update(tps =>
      tps.map(tp =>
        tp.id === teleprompter
          ? { ...tp, scrolling: !tp.scrolling }
          : tp
      )
    );
  }

  /**
   * Set scroll speed
   */
  setScrollSpeed(teleprompter: string, speed: number): void {
    this.teleprompters.update(tps =>
      tps.map(tp =>
        tp.id === teleprompter ? { ...tp, scrollSpeed: speed } : tp
      )
    );
  }

  // ========== SMART PLUG METHODS ==========

  /**
   * Discover smart plugs
   */
  async discoverSmartPlugs(): Promise<SmartPlug[]> {
    const mockPlugs: SmartPlug[] = [
      {
        id: 'plug-lights',
        brand: 'tp-link',
        name: 'Studio Lights',
        ipAddress: '192.168.1.50',
        on: false,
        power: 0,
        schedule: []
      },
      {
        id: 'plug-fan',
        brand: 'wyze',
        name: 'Cooling Fan',
        on: false,
        power: 0,
        schedule: []
      }
    ];

    this.smartPlugs.set(mockPlugs);
    return mockPlugs;
  }

  /**
   * Toggle smart plug
   */
  toggleSmartPlug(plugId: string): void {
    this.smartPlugs.update(plugs =>
      plugs.map(p =>
        p.id === plugId
          ? { ...p, on: !p.on, power: !p.on ? 100 : 0 }
          : p
      )
    );
  }

  // ========== THERMOSTAT METHODS ==========

  /**
   * Discover thermostats
   */
  async discoverThermostats(): Promise<SmartThermostat[]> {
    const mockThermostats: SmartThermostat[] = [
      {
        id: 'nest-studio',
        brand: 'nest',
        name: 'Studio Climate',
        currentTemp: 72,
        targetTemp: 70,
        mode: 'cool',
        fan: 'auto',
        humidity: 45
      }
    ];

    this.thermostats.set(mockThermostats);
    return mockThermostats;
  }

  /**
   * Set temperature
   */
  setTemperature(thermostatId: string, temp: number): void {
    this.thermostats.update(thermostats =>
      thermostats.map(t =>
        t.id === thermostatId ? { ...t, targetTemp: temp } : t
      )
    );

    console.log('Set temperature to:', temp);
  }

  // ========== EFFECTS MACHINE METHODS ==========

  /**
   * Discover effects machines
   */
  async discoverEffectsMachines(): Promise<EffectsMachine[]> {
    const mockMachines: EffectsMachine[] = [
      {
        id: 'fog-machine',
        type: 'fog',
        brand: 'chauvet',
        model: 'Hurricane 1800 Flex',
        name: 'Fog Machine',
        connected: true,
        on: false,
        intensity: 0,
        dmxChannel: 1
      },
      {
        id: 'laser',
        type: 'laser',
        brand: 'kvant',
        model: 'Clubmax 3000',
        name: 'Laser Projector',
        connected: true,
        on: false,
        intensity: 0,
        dmxChannel: 5
      }
    ];

    this.effectsMachines.set(mockMachines);
    return mockMachines;
  }

  /**
   * Trigger effect
   */
  triggerEffect(machineId: string, duration: number = 5000): void {
    this.effectsMachines.update(machines =>
      machines.map(m =>
        m.id === machineId ? { ...m, on: true, intensity: 100 } : m
      )
    );

    // Auto turn off after duration
    setTimeout(() => {
      this.effectsMachines.update(machines =>
        machines.map(m =>
          m.id === machineId ? { ...m, on: false, intensity: 0 } : m
        )
      );
    }, duration);
  }

  // ========== DESK CONTROLLER METHODS ==========

  /**
   * Discover desk controllers
   */
  async discoverDeskControllers(): Promise<DeskController[]> {
    const mockDesks: DeskController[] = [
      {
        id: 'uplift-desk',
        brand: 'uplift',
        name: 'Studio Desk',
        connected: true,
        height: 30,
        presets: [
          { id: 'sit', name: 'Sitting', height: 30 },
          { id: 'stand', name: 'Standing', height: 42 }
        ],
        moving: false
      }
    ];

    this.deskControllers.set(mockDesks);
    return mockDesks;
  }

  /**
   * Move desk
   */
  moveDeskTo(deskId: string, height: number): void {
    this.deskControllers.update(desks =>
      desks.map(d =>
        d.id === deskId ? { ...d, height, moving: true } : d
      )
    );

    // Simulate movement complete
    setTimeout(() => {
      this.deskControllers.update(desks =>
        desks.map(d =>
          d.id === deskId ? { ...d, moving: false } : d
        )
      );
    }, 3000);

    console.log('Moving desk to:', height);
  }

  // ========== ARDUINO / GPIO METHODS ==========

  /**
   * Connect to Arduino
   */
  async connectArduino(port: string, boardType: ArduinoDevice['boardType']): Promise<ArduinoDevice> {
    const device: ArduinoDevice = {
      id: 'arduino-' + Date.now(),
      port,
      boardType,
      connected: true,
      pins: Array.from({ length: 14 }, (_, i) => ({
        number: i,
        mode: 'input',
        value: 0
      }))
    };

    this.arduinoDevices.update(devices => [...devices, device]);
    return device;
  }

  /**
   * Set pin mode
   */
  setPinMode(deviceId: string, pinNumber: number, mode: ArduinoPin['mode']): void {
    this.arduinoDevices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? {
              ...d,
              pins: d.pins.map(p =>
                p.number === pinNumber ? { ...p, mode } : p
              )
            }
          : d
      )
    );
  }

  /**
   * Write digital pin
   */
  digitalWrite(deviceId: string, pinNumber: number, value: 0 | 1): void {
    this.arduinoDevices.update(devices =>
      devices.map(d =>
        d.id === deviceId
          ? {
              ...d,
              pins: d.pins.map(p =>
                p.number === pinNumber ? { ...p, value } : p
              )
            }
          : d
      )
    );

    console.log('digitalWrite:', pinNumber, value);
  }

  /**
   * Initialize all production hardware
   */
  async initializeAll(): Promise<void> {
    console.log('Initializing all production hardware...');

    await Promise.all([
      this.discoverVideoSwitchers(),
      this.discoverSliders(),
      this.discoverGimbals(),
      this.discoverTeleprompters(),
      this.discoverSmartPlugs(),
      this.discoverThermostats(),
      this.discoverEffectsMachines(),
      this.deskControllers()
    ]);

    console.log('Production hardware initialized');
  }

  /**
   * Get all statistics
   */
  getStatistics() {
    return {
      totalDevices: this.totalDevices(),
      videoSwitchers: this.videoSwitchers().length,
      motorizedSliders: this.motorizedSliders().length,
      gimbals: this.gimbals().length,
      roboticArms: this.roboticArms().length,
      teleprompters: this.teleprompters().length,
      smartPlugs: this.smartPlugs().length,
      thermostats: this.thermostats().length,
      effectsMachines: this.effectsMachines().length,
      deskControllers: this.deskControllers().length,
      arduinoDevices: this.arduinoDevices().length
    };
  }
}
