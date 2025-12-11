import { Injectable, signal, computed } from '@angular/core';

/**
 * Capture Cards & Webcams Integration Service
 * Control capture cards, webcams, and video input devices
 */

export type CaptureCardBrand =
  | 'elgato'
  | 'avermedia'
  | 'blackmagic'
  | 'razer'
  | 'magewell'
  | 'epiphan'
  | 'datapath'
  | 'hauppauge';

export type WebcamBrand =
  | 'logitech'
  | 'razer'
  | 'elgato'
  | 'sony'
  | 'microsoft'
  | 'creative'
  | 'ausdom'
  | 'nuroum';

export interface CaptureCard {
  id: string;
  brand: CaptureCardBrand;
  model: string;
  name: string;
  connected: boolean;
  inputs: CaptureInput[];
  capabilities: {
    maxResolution: string; // '4K60', '1080p120', etc.
    hdr: boolean;
    passthrough: boolean;
    audioChannels: number;
  };
  firmwareVersion?: string;
}

export interface CaptureInput {
  id: string;
  cardId: string;
  inputNumber: number;
  name: string;
  type: 'hdmi' | 'sdi' | 'displayport' | 'component' | 'composite';
  active: boolean;
  signal: SignalInfo;
  settings: CaptureSettings;
}

export interface SignalInfo {
  detected: boolean;
  resolution: string; // '1920x1080'
  refreshRate: number; // Hz
  format: 'rgb' | 'yuv422' | 'yuv444';
  hdr: boolean;
  audioPresent: boolean;
}

export interface CaptureSettings {
  resolution: string;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  latency: 'normal' | 'low' | 'ultra-low';
  audioGain: number; // dB
  deinterlace: boolean;
  colorSpace: 'rec709' | 'rec2020' | 'srgb';
}

export interface Webcam {
  id: string;
  brand: WebcamBrand;
  model: string;
  name: string;
  connected: boolean;
  resolutions: string[]; // ['1080p', '720p', '480p']
  frameRates: number[]; // [60, 30, 15]
  settings: WebcamSettings;
  capabilities: {
    autofocus: boolean;
    autoExposure: boolean;
    autoWhiteBalance: boolean;
    hdr: boolean;
    lowLight: boolean;
    faceTracking: boolean;
    backgroundReplacement: boolean;
  };
}

export interface WebcamSettings {
  resolution: string;
  fps: number;
  brightness: number; // 0-100
  contrast: number; // 0-100
  saturation: number; // 0-100
  sharpness: number; // 0-100
  exposure: number; // -100 to 100
  whiteBalance: number | 'auto'; // Kelvin or auto
  focus: number | 'auto'; // 0-100 or auto
  zoom: number; // 1.0-5.0x
  pan: number; // -180 to 180
  tilt: number; // -90 to 90
  fieldOfView: number; // degrees
  lowLightCompensation: boolean;
  hdr: boolean;
  faceTracking: boolean;
  backgroundBlur: number; // 0-100
}

export interface VideoProfile {
  id: string;
  name: string;
  description?: string;
  deviceId: string; // Webcam or capture card ID
  settings: WebcamSettings | CaptureSettings;
}

// Elgato-specific (4K60 Pro, HD60 S+, etc.)
export interface ElgatoCaptureCard extends CaptureCard {
  flashback: {
    enabled: boolean;
    duration: number; // seconds
    quality: 'high' | 'medium';
  };
  instantGameview: boolean; // Low latency preview
}

// AVerMedia-specific (Live Gamer series)
export interface AVerMediaCaptureCard extends CaptureCard {
  recCentral: {
    enabled: boolean;
    recordingPath: string;
    format: 'mp4' | 'ts' | 'flv';
  };
  partyChat: boolean; // Mix chat audio
}

// Blackmagic-specific (DeckLink, UltraStudio)
export interface BlackmagicDevice extends CaptureCard {
  deckLinkMode: string; // Video mode
  timecode: {
    enabled: boolean;
    source: 'internal' | 'external' | 'embedded';
  };
  colorCorrection: {
    enabled: boolean;
    lift: { r: number; g: number; b: number };
    gamma: { r: number; g: number; b: number };
    gain: { r: number; g: number; b: number };
  };
}

// Logitech webcam-specific
export interface LogitechWebcam extends Webcam {
  rightLight: boolean; // Auto lighting adjustment
  rightSound: boolean; // Noise reduction
  rightSight: boolean; // Auto framing
  showMode: boolean; // Vertical content mode
}

@Injectable({
  providedIn: 'root'
})
export class CaptureDeviceService {
  // Capture cards
  readonly captureCards = signal<CaptureCard[]>([]);

  // Webcams
  readonly webcams = signal<Webcam[]>([]);

  // Video profiles
  readonly profiles = signal<VideoProfile[]>([]);

  // Active devices
  readonly activeInputs = signal<string[]>([]);

  // Computed
  readonly connectedCaptureCards = computed(() =>
    this.captureCards().filter(c => c.connected)
  );

  readonly connectedWebcams = computed(() =>
    this.webcams().filter(w => w.connected)
  );

  readonly activeSignals = computed(() => {
    const cards = this.captureCards();
    const activeCount = cards.reduce((count, card) => {
      return count + card.inputs.filter(i => i.signal.detected).length;
    }, 0);
    return activeCount;
  });

  /**
   * Scan for capture cards
   */
  async scanCaptureCards(): Promise<CaptureCard[]> {
    console.log('Scanning for capture cards...');

    // In real implementation, detect via DirectShow, CoreMediaIO, V4L2, etc.

    const mockCards: CaptureCard[] = [
      {
        id: 'elgato-4k60pro',
        brand: 'elgato',
        model: '4K60 Pro MK.2',
        name: 'Elgato 4K60 Pro',
        connected: true,
        inputs: [
          {
            id: 'elgato-hdmi-1',
            cardId: 'elgato-4k60pro',
            inputNumber: 1,
            name: 'HDMI Input',
            type: 'hdmi',
            active: true,
            signal: {
              detected: true,
              resolution: '1920x1080',
              refreshRate: 60,
              format: 'yuv422',
              hdr: false,
              audioPresent: true
            },
            settings: {
              resolution: '1920x1080',
              fps: 60,
              quality: 'ultra',
              latency: 'low',
              audioGain: 0,
              deinterlace: false,
              colorSpace: 'rec709'
            }
          }
        ],
        capabilities: {
          maxResolution: '4K60',
          hdr: true,
          passthrough: true,
          audioChannels: 2
        },
        firmwareVersion: '1.2.3.456'
      },
      {
        id: 'avermedia-gc573',
        brand: 'avermedia',
        model: 'Live Gamer 4K GC573',
        name: 'AVerMedia GC573',
        connected: true,
        inputs: [
          {
            id: 'aver-hdmi-1',
            cardId: 'avermedia-gc573',
            inputNumber: 1,
            name: 'HDMI 2.0 Input',
            type: 'hdmi',
            active: false,
            signal: {
              detected: false,
              resolution: '',
              refreshRate: 0,
              format: 'yuv422',
              hdr: false,
              audioPresent: false
            },
            settings: {
              resolution: '1920x1080',
              fps: 60,
              quality: 'high',
              latency: 'normal',
              audioGain: 0,
              deinterlace: false,
              colorSpace: 'rec709'
            }
          }
        ],
        capabilities: {
          maxResolution: '4K60',
          hdr: true,
          passthrough: true,
          audioChannels: 2
        }
      },
      {
        id: 'blackmagic-decklink',
        brand: 'blackmagic',
        model: 'DeckLink Mini Recorder 4K',
        name: 'Blackmagic DeckLink',
        connected: true,
        inputs: [
          {
            id: 'bmd-sdi-1',
            cardId: 'blackmagic-decklink',
            inputNumber: 1,
            name: 'SDI Input',
            type: 'sdi',
            active: true,
            signal: {
              detected: true,
              resolution: '1920x1080',
              refreshRate: 59.94,
              format: 'yuv422',
              hdr: false,
              audioPresent: true
            },
            settings: {
              resolution: '1920x1080',
              fps: 59.94,
              quality: 'ultra',
              latency: 'ultra-low',
              audioGain: 0,
              deinterlace: false,
              colorSpace: 'rec709'
            }
          }
        ],
        capabilities: {
          maxResolution: '4K60',
          hdr: false,
          passthrough: false,
          audioChannels: 8
        }
      }
    ];

    this.captureCards.set(mockCards);
    return mockCards;
  }

  /**
   * Scan for webcams
   */
  async scanWebcams(): Promise<Webcam[]> {
    console.log('Scanning for webcams...');

    // In real implementation, use navigator.mediaDevices.enumerateDevices()

    const mockWebcams: Webcam[] = [
      {
        id: 'logitech-brio',
        brand: 'logitech',
        model: 'BRIO 4K',
        name: 'Logitech BRIO',
        connected: true,
        resolutions: ['4K', '1080p', '720p'],
        frameRates: [60, 30, 15],
        settings: {
          resolution: '1080p',
          fps: 60,
          brightness: 50,
          contrast: 50,
          saturation: 50,
          sharpness: 50,
          exposure: 0,
          whiteBalance: 'auto',
          focus: 'auto',
          zoom: 1.0,
          pan: 0,
          tilt: 0,
          fieldOfView: 90,
          lowLightCompensation: true,
          hdr: true,
          faceTracking: false,
          backgroundBlur: 0
        },
        capabilities: {
          autofocus: true,
          autoExposure: true,
          autoWhiteBalance: true,
          hdr: true,
          lowLight: true,
          faceTracking: true,
          backgroundReplacement: false
        }
      },
      {
        id: 'elgato-facecam',
        brand: 'elgato',
        model: 'Facecam',
        name: 'Elgato Facecam',
        connected: true,
        resolutions: ['1080p', '720p'],
        frameRates: [60, 30],
        settings: {
          resolution: '1080p',
          fps: 60,
          brightness: 55,
          contrast: 45,
          saturation: 50,
          sharpness: 60,
          exposure: 0,
          whiteBalance: 'auto',
          focus: 'auto',
          zoom: 1.0,
          pan: 0,
          tilt: 0,
          fieldOfView: 82,
          lowLightCompensation: false,
          hdr: false,
          faceTracking: false,
          backgroundBlur: 0
        },
        capabilities: {
          autofocus: true,
          autoExposure: true,
          autoWhiteBalance: true,
          hdr: false,
          lowLight: false,
          faceTracking: false,
          backgroundReplacement: false
        }
      },
      {
        id: 'razer-kiyo-pro',
        brand: 'razer',
        model: 'Kiyo Pro',
        name: 'Razer Kiyo Pro',
        connected: true,
        resolutions: ['1080p', '720p'],
        frameRates: [60, 30],
        settings: {
          resolution: '1080p',
          fps: 60,
          brightness: 50,
          contrast: 50,
          saturation: 50,
          sharpness: 50,
          exposure: 0,
          whiteBalance: 'auto',
          focus: 'auto',
          zoom: 1.0,
          pan: 0,
          tilt: 0,
          fieldOfView: 103,
          lowLightCompensation: true,
          hdr: true,
          faceTracking: false,
          backgroundBlur: 0
        },
        capabilities: {
          autofocus: true,
          autoExposure: true,
          autoWhiteBalance: true,
          hdr: true,
          lowLight: true,
          faceTracking: false,
          backgroundReplacement: false
        }
      }
    ];

    this.webcams.set(mockWebcams);
    return mockWebcams;
  }

  /**
   * Set webcam setting
   */
  setWebcamSetting<K extends keyof WebcamSettings>(
    webcamId: string,
    setting: K,
    value: WebcamSettings[K]
  ): void {
    this.webcams.update(webcams =>
      webcams.map(w =>
        w.id === webcamId
          ? {
              ...w,
              settings: { ...w.settings, [setting]: value }
            }
          : w
      )
    );

    // In real implementation, apply to device
    console.log('Setting webcam', setting, 'to', value);
  }

  /**
   * Set capture input setting
   */
  setCaptureInputSetting<K extends keyof CaptureSettings>(
    inputId: string,
    setting: K,
    value: CaptureSettings[K]
  ): void {
    this.captureCards.update(cards =>
      cards.map(card => ({
        ...card,
        inputs: card.inputs.map(input =>
          input.id === inputId
            ? {
                ...input,
                settings: { ...input.settings, [setting]: value }
              }
            : input
        )
      }))
    );

    console.log('Setting capture input', setting, 'to', value);
  }

  /**
   * Create video profile
   */
  createProfile(
    name: string,
    deviceId: string,
    settings: WebcamSettings | CaptureSettings
  ): VideoProfile {
    const profile: VideoProfile = {
      id: crypto.randomUUID(),
      name,
      deviceId,
      settings
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

    // Check if it's a webcam or capture card
    const webcam = this.webcams().find(w => w.id === profile.deviceId);
    if (webcam) {
      this.webcams.update(webcams =>
        webcams.map(w =>
          w.id === profile.deviceId
            ? { ...w, settings: profile.settings as WebcamSettings }
            : w
        )
      );
    }

    console.log('Applied profile:', profile.name);
  }

  /**
   * Start/stop video input
   */
  toggleInput(inputId: string): void {
    this.captureCards.update(cards =>
      cards.map(card => ({
        ...card,
        inputs: card.inputs.map(input =>
          input.id === inputId
            ? { ...input, active: !input.active }
            : input
        )
      }))
    );

    const isActive = this.captureCards()
      .flatMap(c => c.inputs)
      .find(i => i.id === inputId)?.active;

    if (isActive) {
      this.activeInputs.update(inputs => [...inputs, inputId]);
    } else {
      this.activeInputs.update(inputs => inputs.filter(i => i !== inputId));
    }
  }

  /**
   * Webcam presets (quick settings)
   */
  applyWebcamPreset(webcamId: string, preset: 'bright' | 'dark' | 'natural' | 'vivid'): void {
    const presets: Record<string, Partial<WebcamSettings>> = {
      bright: {
        brightness: 70,
        contrast: 45,
        saturation: 50,
        exposure: 20
      },
      dark: {
        brightness: 40,
        contrast: 60,
        saturation: 45,
        exposure: -10,
        lowLightCompensation: true
      },
      natural: {
        brightness: 50,
        contrast: 50,
        saturation: 50,
        exposure: 0
      },
      vivid: {
        brightness: 55,
        contrast: 55,
        saturation: 70,
        sharpness: 65
      }
    };

    const settings = presets[preset];
    Object.entries(settings).forEach(([key, value]) => {
      this.setWebcamSetting(webcamId, key as keyof WebcamSettings, value as any);
    });
  }

  /**
   * Reset webcam to defaults
   */
  resetWebcam(webcamId: string): void {
    this.webcams.update(webcams =>
      webcams.map(w =>
        w.id === webcamId
          ? {
              ...w,
              settings: {
                resolution: '1080p',
                fps: 30,
                brightness: 50,
                contrast: 50,
                saturation: 50,
                sharpness: 50,
                exposure: 0,
                whiteBalance: 'auto',
                focus: 'auto',
                zoom: 1.0,
                pan: 0,
                tilt: 0,
                fieldOfView: 90,
                lowLightCompensation: false,
                hdr: false,
                faceTracking: false,
                backgroundBlur: 0
              }
            }
          : w
      )
    );
  }

  /**
   * Get signal quality
   */
  getSignalQuality(inputId: string): 'excellent' | 'good' | 'fair' | 'poor' | 'no-signal' {
    const input = this.captureCards()
      .flatMap(c => c.inputs)
      .find(i => i.id === inputId);

    if (!input || !input.signal.detected) return 'no-signal';

    // Calculate based on resolution and refresh rate
    const resMatch = input.signal.resolution.match(/(\d+)x(\d+)/);
    if (!resMatch) return 'poor';

    const height = parseInt(resMatch[2]);
    const fps = input.signal.refreshRate;

    if (height >= 2160 && fps >= 60) return 'excellent'; // 4K60+
    if (height >= 1080 && fps >= 60) return 'good'; // 1080p60
    if (height >= 1080 && fps >= 30) return 'fair'; // 1080p30
    return 'poor';
  }

  /**
   * Get device statistics
   */
  getDeviceStats() {
    return {
      captureCards: this.captureCards().length,
      connectedCaptureCards: this.connectedCaptureCards().length,
      webcams: this.webcams().length,
      connectedWebcams: this.connectedWebcams().length,
      activeSignals: this.activeSignals(),
      profiles: this.profiles().length
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): string {
    return JSON.stringify({
      captureCards: this.captureCards(),
      webcams: this.webcams(),
      profiles: this.profiles()
    }, null, 2);
  }
}
