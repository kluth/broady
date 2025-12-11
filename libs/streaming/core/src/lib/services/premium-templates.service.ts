import { Injectable, signal, computed } from '@angular/core';

/**
 * Premium Templates Service
 * Themed stream templates based on popular brands and pop culture
 * Professional pre-configured setups ready to use!
 */

export interface PremiumTemplate {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: TemplateCategory;
  theme: TemplateTheme;
  premium: boolean;
  featured: boolean;
  previewImage: string;
  colors: ColorScheme;
  fonts: FontScheme;
  overlays: OverlayConfig[];
  alerts: AlertStyle[];
  scenes: SceneConfig[];
  sounds: SoundPack;
  transitions: TransitionStyle[];
  lowerThirds: LowerThirdStyle;
  chatStyle: ChatStyle;
  tags: string[];
  createdAt: Date;
  downloads: number;
  rating: number;
}

export type TemplateCategory =
  | 'game'
  | 'tv-show'
  | 'movie'
  | 'anime'
  | 'music'
  | 'aesthetic'
  | 'sport'
  | 'brand';

export interface TemplateTheme {
  mood: 'energetic' | 'dark' | 'bright' | 'minimal' | 'retro' | 'futuristic';
  style: 'modern' | 'vintage' | 'neon' | 'clean' | 'grungy' | 'glitch';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gradient?: string[];
  special?: Record<string, string>;
}

export interface FontScheme {
  primary: string;
  secondary: string;
  accent?: string;
  sizes: {
    title: number;
    subtitle: number;
    body: number;
  };
}

export interface OverlayConfig {
  name: string;
  type: 'webcam' | 'chat' | 'alerts' | 'stats' | 'recent-events' | 'timer' | 'goal';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, any>;
}

export interface AlertStyle {
  type: 'follower' | 'subscriber' | 'donation' | 'raid' | 'host';
  animation: string;
  duration: number;
  sound: string;
  template: string;
}

export interface SceneConfig {
  name: string;
  type: 'gameplay' | 'starting-soon' | 'be-right-back' | 'ending' | 'intermission';
  background: string;
  overlays: string[];
}

export interface SoundPack {
  alerts: Record<string, string>;
  transitions: Record<string, string>;
  ambience?: string;
}

export interface TransitionStyle {
  name: string;
  type: 'fade' | 'slide' | 'wipe' | 'zoom' | 'glitch';
  duration: number;
}

export interface LowerThirdStyle {
  template: string;
  animation: string;
  position: 'bottom' | 'top';
  style: Record<string, any>;
}

export interface ChatStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  animation: string;
  highlightColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class PremiumTemplatesService {
  readonly templates = signal<PremiumTemplate[]>([]);
  readonly activeTemplate = signal<PremiumTemplate | null>(null);

  readonly featuredTemplates = computed(() =>
    this.templates().filter(t => t.featured)
  );

  readonly premiumTemplates = computed(() =>
    this.templates().filter(t => t.premium)
  );

  readonly templatesByCategory = computed(() => {
    const byCategory: Record<string, PremiumTemplate[]> = {};
    this.templates().forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = [];
      }
      byCategory[t.category].push(t);
    });
    return byCategory;
  });

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize all premium templates
   */
  private initializeTemplates(): void {
    const templates: PremiumTemplate[] = [
      // GAME TEMPLATES
      {
        id: 'fortnite-victory',
        name: 'Fortnite Victory Royale',
        brand: 'Fortnite',
        description: 'Epic battle royale theme with vibrant colors and dynamic overlays',
        category: 'game',
        theme: { mood: 'energetic', style: 'modern' },
        premium: true,
        featured: true,
        previewImage: 'fortnite-preview.jpg',
        colors: {
          primary: '#7B68EE',
          secondary: '#00D9FF',
          accent: '#FFD700',
          background: '#1a1a2e',
          text: '#FFFFFF',
          gradient: ['#7B68EE', '#00D9FF', '#FFD700'],
          special: {
            victory: '#FFD700',
            elimination: '#FF4757'
          }
        },
        fonts: {
          primary: 'Burbank Big Condensed Bold',
          secondary: 'Roboto',
          sizes: { title: 48, subtitle: 32, body: 18 }
        },
        overlays: [
          {
            name: 'Victory Counter',
            type: 'stats',
            position: { x: 50, y: 50 },
            size: { width: 300, height: 150 },
            style: { borderRadius: '15px', background: 'rgba(123, 104, 238, 0.8)' }
          }
        ],
        alerts: [
          {
            type: 'follower',
            animation: 'supply-drop',
            duration: 5,
            sound: 'victory-fanfare.mp3',
            template: 'fortnite-alert'
          }
        ],
        scenes: [
          {
            name: 'Victory Royale',
            type: 'gameplay',
            background: 'fortnite-bg.jpg',
            overlays: ['victory-counter', 'eliminations']
          }
        ],
        sounds: {
          alerts: {
            follower: 'supply-drop.mp3',
            subscriber: 'victory-royale.mp3',
            donation: 'chest-open.mp3'
          },
          transitions: {
            scene: 'battle-bus.mp3'
          }
        },
        transitions: [
          {
            name: 'Storm Circle',
            type: 'wipe',
            duration: 800
          }
        ],
        lowerThirds: {
          template: 'fortnite-lower-third',
          animation: 'slide-up',
          position: 'bottom',
          style: { gradient: ['#7B68EE', '#00D9FF'] }
        },
        chatStyle: {
          backgroundColor: 'rgba(26, 26, 46, 0.9)',
          textColor: '#FFFFFF',
          fontSize: 16,
          animation: 'slide-in',
          highlightColor: '#FFD700'
        },
        tags: ['battle-royale', 'colorful', 'energetic', 'gaming'],
        createdAt: new Date(),
        downloads: 15420,
        rating: 4.8
      },

      {
        id: 'cs2-tactical',
        name: 'CS2 Tactical Ops',
        brand: 'Counter-Strike 2',
        description: 'Professional tactical shooter aesthetic with clean UI',
        category: 'game',
        theme: { mood: 'dark', style: 'modern' },
        premium: true,
        featured: true,
        previewImage: 'cs2-preview.jpg',
        colors: {
          primary: '#FF6B00',
          secondary: '#0A84FF',
          accent: '#FFD700',
          background: '#0f0f0f',
          text: '#FFFFFF',
          gradient: ['#FF6B00', '#0A84FF'],
          special: {
            ct: '#0A84FF',
            t: '#FF6B00',
            headshot: '#FF0000'
          }
        },
        fonts: {
          primary: 'Stratum2',
          secondary: 'Roboto Mono',
          sizes: { title: 42, subtitle: 28, body: 16 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'tactical-breach',
            duration: 4,
            sound: 'round-start.mp3',
            template: 'cs2-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'round-start.mp3',
            subscriber: 'bomb-planted.mp3',
            donation: 'mvp.mp3'
          },
          transitions: {
            scene: 'tactical-radio.mp3'
          }
        },
        transitions: [
          {
            name: 'Flashbang',
            type: 'fade',
            duration: 500
          }
        ],
        lowerThirds: {
          template: 'cs2-tactical',
          animation: 'slide-left',
          position: 'bottom',
          style: { background: '#0f0f0f', border: '2px solid #FF6B00' }
        },
        chatStyle: {
          backgroundColor: 'rgba(15, 15, 15, 0.95)',
          textColor: '#FFFFFF',
          fontSize: 15,
          animation: 'fade-in',
          highlightColor: '#FF6B00'
        },
        tags: ['fps', 'tactical', 'competitive', 'esports'],
        createdAt: new Date(),
        downloads: 12800,
        rating: 4.9
      },

      {
        id: 'minecraft-blocky',
        name: 'Minecraft Blocky Adventures',
        brand: 'Minecraft',
        description: 'Pixelated charm with crafting-inspired overlays',
        category: 'game',
        theme: { mood: 'bright', style: 'vintage' },
        premium: false,
        featured: true,
        previewImage: 'minecraft-preview.jpg',
        colors: {
          primary: '#8BC34A',
          secondary: '#8D6E63',
          accent: '#FFA726',
          background: '#4A90E2',
          text: '#FFFFFF',
          gradient: ['#8BC34A', '#8D6E63'],
          special: {
            diamond: '#00FFFF',
            gold: '#FFD700',
            redstone: '#FF0000'
          }
        },
        fonts: {
          primary: 'Minecraft',
          secondary: 'Minecraft',
          sizes: { title: 40, subtitle: 28, body: 16 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'block-build',
            duration: 5,
            sound: 'level-up.mp3',
            template: 'minecraft-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'level-up.mp3',
            subscriber: 'enchant.mp3',
            donation: 'anvil.mp3'
          },
          transitions: {
            scene: 'door-open.mp3'
          },
          ambience: 'c418-sweden.mp3'
        },
        transitions: [
          {
            name: 'Block Break',
            type: 'wipe',
            duration: 600
          }
        ],
        lowerThirds: {
          template: 'minecraft-crafting',
          animation: 'fade-in',
          position: 'bottom',
          style: { pixelated: true, border: '4px solid #8BC34A' }
        },
        chatStyle: {
          backgroundColor: 'rgba(74, 144, 226, 0.8)',
          textColor: '#FFFFFF',
          fontSize: 16,
          animation: 'pop-in',
          highlightColor: '#FFD700'
        },
        tags: ['sandbox', 'creative', 'pixel', 'cozy'],
        createdAt: new Date(),
        downloads: 28500,
        rating: 4.7
      },

      {
        id: 'valorant-radiant',
        name: 'Valorant Radiant',
        brand: 'Valorant',
        description: 'Sleek tactical shooter with ability-themed effects',
        category: 'game',
        theme: { mood: 'dark', style: 'modern' },
        premium: true,
        featured: true,
        previewImage: 'valorant-preview.jpg',
        colors: {
          primary: '#FF4655',
          secondary: '#FFFFFF',
          accent: '#00F5FF',
          background: '#0F1923',
          text: '#FFFFFF',
          gradient: ['#FF4655', '#00F5FF'],
          special: {
            ace: '#FFD700',
            spike: '#FF4655'
          }
        },
        fonts: {
          primary: 'DIN Next',
          secondary: 'Roboto',
          sizes: { title: 44, subtitle: 30, body: 17 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'spike-plant',
            duration: 5,
            sound: 'agent-select.mp3',
            template: 'valorant-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'agent-select.mp3',
            subscriber: 'ace.mp3',
            donation: 'victory.mp3'
          },
          transitions: {
            scene: 'ultimate-ready.mp3'
          }
        },
        transitions: [
          {
            name: 'Omen Teleport',
            type: 'fade',
            duration: 700
          }
        ],
        lowerThirds: {
          template: 'valorant-agent',
          animation: 'glitch-in',
          position: 'bottom',
          style: { background: '#0F1923', accent: '#FF4655' }
        },
        chatStyle: {
          backgroundColor: 'rgba(15, 25, 35, 0.9)',
          textColor: '#FFFFFF',
          fontSize: 15,
          animation: 'slide-in',
          highlightColor: '#FF4655'
        },
        tags: ['fps', 'tactical', 'competitive', 'abilities'],
        createdAt: new Date(),
        downloads: 18200,
        rating: 4.8
      },

      {
        id: 'league-summoners-rift',
        name: 'League of Legends Rift',
        brand: 'League of Legends',
        description: 'MOBA mastery with champion-themed overlays',
        category: 'game',
        theme: { mood: 'energetic', style: 'modern' },
        premium: true,
        featured: false,
        previewImage: 'lol-preview.jpg',
        colors: {
          primary: '#0AC8B9',
          secondary: '#C89B3C',
          accent: '#F0E6D2',
          background: '#010A13',
          text: '#F0E6D2',
          gradient: ['#0AC8B9', '#C89B3C'],
          special: {
            pentakill: '#FF0000',
            gold: '#C89B3C',
            blue: '#0AC8B9'
          }
        },
        fonts: {
          primary: 'Beaufort',
          secondary: 'Spiegel',
          sizes: { title: 46, subtitle: 32, body: 18 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'level-up',
            duration: 5,
            sound: 'summoner-spell.mp3',
            template: 'lol-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'summoner-spell.mp3',
            subscriber: 'pentakill.mp3',
            donation: 'legendary.mp3'
          },
          transitions: {
            scene: 'champion-select.mp3'
          }
        },
        transitions: [
          {
            name: 'Recall',
            type: 'fade',
            duration: 800
          }
        ],
        lowerThirds: {
          template: 'lol-champion',
          animation: 'gold-shimmer',
          position: 'bottom',
          style: { gradient: ['#0AC8B9', '#C89B3C'] }
        },
        chatStyle: {
          backgroundColor: 'rgba(1, 10, 19, 0.9)',
          textColor: '#F0E6D2',
          fontSize: 16,
          animation: 'fade-in',
          highlightColor: '#C89B3C'
        },
        tags: ['moba', 'competitive', 'fantasy', 'esports'],
        createdAt: new Date(),
        downloads: 14300,
        rating: 4.6
      },

      // TV SHOW / MOVIE TEMPLATES
      {
        id: 'stranger-things-upside-down',
        name: 'Stranger Things: Upside Down',
        brand: 'Stranger Things',
        description: '80s nostalgia meets supernatural horror',
        category: 'tv-show',
        theme: { mood: 'dark', style: 'retro' },
        premium: true,
        featured: true,
        previewImage: 'stranger-things-preview.jpg',
        colors: {
          primary: '#ED1B24',
          secondary: '#000000',
          accent: '#FFD700',
          background: '#0a0a0a',
          text: '#FFFFFF',
          gradient: ['#ED1B24', '#000000'],
          special: {
            lights: '#FFD700',
            demogorgon: '#ED1B24'
          }
        },
        fonts: {
          primary: 'Benguiat',
          secondary: 'ITC Benguiat',
          sizes: { title: 50, subtitle: 34, body: 18 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'lights-flicker',
            duration: 6,
            sound: 'upside-down-ambient.mp3',
            template: 'stranger-things-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'lights-flicker.mp3',
            subscriber: 'theme-song.mp3',
            donation: 'demogorgon-roar.mp3'
          },
          transitions: {
            scene: 'portal-open.mp3'
          },
          ambience: 'upside-down-ambient.mp3'
        },
        transitions: [
          {
            name: 'Portal',
            type: 'glitch',
            duration: 1000
          }
        ],
        lowerThirds: {
          template: 'stranger-things-alphabet',
          animation: 'flicker',
          position: 'bottom',
          style: { glow: true, color: '#ED1B24' }
        },
        chatStyle: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          textColor: '#FFFFFF',
          fontSize: 16,
          animation: 'glitch-in',
          highlightColor: '#ED1B24'
        },
        tags: ['80s', 'horror', 'retro', 'nostalgia'],
        createdAt: new Date(),
        downloads: 22100,
        rating: 4.9
      },

      {
        id: 'wednesday-addams',
        name: 'Wednesday Addams',
        brand: 'Wednesday',
        description: 'Gothic elegance meets dark humor',
        category: 'tv-show',
        theme: { mood: 'dark', style: 'vintage' },
        premium: true,
        featured: true,
        previewImage: 'wednesday-preview.jpg',
        colors: {
          primary: '#000000',
          secondary: '#8B4789',
          accent: '#FFFFFF',
          background: '#1a1a1a',
          text: '#FFFFFF',
          gradient: ['#000000', '#8B4789'],
          special: {
            gothic: '#8B4789',
            raven: '#000000'
          }
        },
        fonts: {
          primary: 'Wednesday',
          secondary: 'Crimson Text',
          sizes: { title: 48, subtitle: 32, body: 17 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'typewriter',
            duration: 5,
            sound: 'cello-theme.mp3',
            template: 'wednesday-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'snap-snap.mp3',
            subscriber: 'cello-theme.mp3',
            donation: 'typewriter.mp3'
          },
          transitions: {
            scene: 'raven-caw.mp3'
          }
        },
        transitions: [
          {
            name: 'Fade to Black',
            type: 'fade',
            duration: 800
          }
        ],
        lowerThirds: {
          template: 'wednesday-gothic',
          animation: 'typewriter',
          position: 'bottom',
          style: { border: '2px solid #8B4789', gothic: true }
        },
        chatStyle: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          textColor: '#FFFFFF',
          fontSize: 15,
          animation: 'typewriter',
          highlightColor: '#8B4789'
        },
        tags: ['gothic', 'dark', 'elegant', 'vintage'],
        createdAt: new Date(),
        downloads: 19800,
        rating: 4.7
      },

      {
        id: 'cyberpunk-night-city',
        name: 'Cyberpunk Night City',
        brand: 'Cyberpunk',
        description: 'Neon-soaked dystopian future aesthetic',
        category: 'aesthetic',
        theme: { mood: 'futuristic', style: 'neon' },
        premium: true,
        featured: true,
        previewImage: 'cyberpunk-preview.jpg',
        colors: {
          primary: '#00F0FF',
          secondary: '#FF006E',
          accent: '#FFBE0B',
          background: '#0a0014',
          text: '#FFFFFF',
          gradient: ['#00F0FF', '#FF006E', '#FFBE0B'],
          special: {
            neon: '#00F0FF',
            danger: '#FF006E',
            warning: '#FFBE0B'
          }
        },
        fonts: {
          primary: 'Rajdhani',
          secondary: 'Orbitron',
          sizes: { title: 52, subtitle: 36, body: 19 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'glitch-neon',
            duration: 5,
            sound: 'cyber-alert.mp3',
            template: 'cyberpunk-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'cyber-alert.mp3',
            subscriber: 'netrunner.mp3',
            donation: 'credits-received.mp3'
          },
          transitions: {
            scene: 'glitch-transition.mp3'
          },
          ambience: 'night-city-ambient.mp3'
        },
        transitions: [
          {
            name: 'Glitch Matrix',
            type: 'glitch',
            duration: 600
          }
        ],
        lowerThirds: {
          template: 'cyberpunk-hud',
          animation: 'scan-line',
          position: 'bottom',
          style: { neon: true, glitch: true }
        },
        chatStyle: {
          backgroundColor: 'rgba(10, 0, 20, 0.9)',
          textColor: '#00F0FF',
          fontSize: 16,
          animation: 'glitch-in',
          highlightColor: '#FF006E'
        },
        tags: ['cyberpunk', 'neon', 'futuristic', 'sci-fi'],
        createdAt: new Date(),
        downloads: 25600,
        rating: 4.8
      },

      {
        id: 'lofi-chill',
        name: 'Lofi Chill Vibes',
        brand: 'Lofi',
        description: 'Relaxed aesthetic for chill streams',
        category: 'aesthetic',
        theme: { mood: 'minimal', style: 'clean' },
        premium: false,
        featured: false,
        previewImage: 'lofi-preview.jpg',
        colors: {
          primary: '#E8B4B8',
          secondary: '#9BABB8',
          accent: '#FFD972',
          background: '#2D3142',
          text: '#FFFFFF',
          gradient: ['#E8B4B8', '#9BABB8'],
          special: {
            pastel: '#E8B4B8',
            cozy: '#FFD972'
          }
        },
        fonts: {
          primary: 'Poppins',
          secondary: 'Montserrat',
          sizes: { title: 40, subtitle: 28, body: 16 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'gentle-fade',
            duration: 4,
            sound: 'soft-bell.mp3',
            template: 'lofi-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'soft-bell.mp3',
            subscriber: 'wind-chimes.mp3',
            donation: 'piano-note.mp3'
          },
          transitions: {
            scene: 'vinyl-scratch.mp3'
          },
          ambience: 'lofi-beats.mp3'
        },
        transitions: [
          {
            name: 'Soft Fade',
            type: 'fade',
            duration: 1000
          }
        ],
        lowerThirds: {
          template: 'lofi-minimal',
          animation: 'gentle-slide',
          position: 'bottom',
          style: { rounded: true, minimal: true }
        },
        chatStyle: {
          backgroundColor: 'rgba(45, 49, 66, 0.85)',
          textColor: '#FFFFFF',
          fontSize: 15,
          animation: 'fade-in',
          highlightColor: '#E8B4B8'
        },
        tags: ['lofi', 'chill', 'cozy', 'relaxed'],
        createdAt: new Date(),
        downloads: 31200,
        rating: 4.6
      },

      {
        id: 'marvel-hero',
        name: 'Marvel Superhero',
        brand: 'Marvel',
        description: 'Cinematic superhero theme with comic-style effects',
        category: 'movie',
        theme: { mood: 'energetic', style: 'modern' },
        premium: true,
        featured: true,
        previewImage: 'marvel-preview.jpg',
        colors: {
          primary: '#ED1D24',
          secondary: '#0476F2',
          accent: '#FFD700',
          background: '#000000',
          text: '#FFFFFF',
          gradient: ['#ED1D24', '#0476F2'],
          special: {
            heroic: '#FFD700',
            power: '#ED1D24'
          }
        },
        fonts: {
          primary: 'Marvel',
          secondary: 'Avenger',
          sizes: { title: 54, subtitle: 38, body: 20 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'hero-landing',
            duration: 6,
            sound: 'avengers-theme.mp3',
            template: 'marvel-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'hero-arrival.mp3',
            subscriber: 'avengers-theme.mp3',
            donation: 'power-up.mp3'
          },
          transitions: {
            scene: 'whoosh.mp3'
          }
        },
        transitions: [
          {
            name: 'Comic Panel',
            type: 'wipe',
            duration: 700
          }
        ],
        lowerThirds: {
          template: 'marvel-comic',
          animation: 'pow-effect',
          position: 'bottom',
          style: { comic: true, bold: true }
        },
        chatStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          textColor: '#FFFFFF',
          fontSize: 17,
          animation: 'pow-in',
          highlightColor: '#ED1D24'
        },
        tags: ['superhero', 'marvel', 'comic', 'cinematic'],
        createdAt: new Date(),
        downloads: 17900,
        rating: 4.7
      },

      {
        id: 'retro-arcade',
        name: 'Retro Arcade',
        brand: 'Retro Gaming',
        description: '8-bit nostalgia with pixel perfect design',
        category: 'aesthetic',
        theme: { mood: 'retro', style: 'vintage' },
        premium: false,
        featured: true,
        previewImage: 'retro-preview.jpg',
        colors: {
          primary: '#FF6B9D',
          secondary: '#00E8FC',
          accent: '#FFFF00',
          background: '#1A1A1A',
          text: '#FFFFFF',
          gradient: ['#FF6B9D', '#00E8FC'],
          special: {
            coin: '#FFFF00',
            power: '#FF6B9D'
          }
        },
        fonts: {
          primary: 'Press Start 2P',
          secondary: 'VT323',
          sizes: { title: 32, subtitle: 24, body: 16 }
        },
        overlays: [],
        alerts: [
          {
            type: 'follower',
            animation: 'pixel-explosion',
            duration: 5,
            sound: 'coin-collect.mp3',
            template: 'retro-alert'
          }
        ],
        scenes: [],
        sounds: {
          alerts: {
            follower: 'coin-collect.mp3',
            subscriber: '1up.mp3',
            donation: 'power-up.mp3'
          },
          transitions: {
            scene: 'warp-pipe.mp3'
          },
          ambience: 'arcade-ambient.mp3'
        },
        transitions: [
          {
            name: 'Pixel Dissolve',
            type: 'wipe',
            duration: 500
          }
        ],
        lowerThirds: {
          template: 'retro-pixel',
          animation: 'blink',
          position: 'bottom',
          style: { pixelated: true, scanlines: true }
        },
        chatStyle: {
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          textColor: '#FFFFFF',
          fontSize: 14,
          animation: 'pixel-in',
          highlightColor: '#FFFF00'
        },
        tags: ['retro', '8-bit', 'arcade', 'pixel'],
        createdAt: new Date(),
        downloads: 34700,
        rating: 4.8
      }
    ];

    this.templates.set(templates);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PremiumTemplate | undefined {
    return this.templates().find(t => t.id === templateId);
  }

  /**
   * Apply template
   */
  applyTemplate(templateId: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    this.activeTemplate.set(template);

    // In production, would apply all settings to stream
    console.log(`Applying template: ${template.name}`);
    console.log('Colors:', template.colors);
    console.log('Fonts:', template.fonts);
    console.log('Overlays:', template.overlays);

    // Increment download count
    this.templates.update(templates =>
      templates.map(t =>
        t.id === templateId
          ? { ...t, downloads: t.downloads + 1 }
          : t
      )
    );

    return true;
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): PremiumTemplate[] {
    const q = query.toLowerCase();
    return this.templates().filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q))
    );
  }

  /**
   * Filter by category
   */
  filterByCategory(category: TemplateCategory): PremiumTemplate[] {
    return this.templates().filter(t => t.category === category);
  }

  /**
   * Filter by tags
   */
  filterByTags(tags: string[]): PremiumTemplate[] {
    return this.templates().filter(t =>
      tags.some(tag => t.tags.includes(tag))
    );
  }

  /**
   * Get top rated
   */
  getTopRated(limit: number = 10): PremiumTemplate[] {
    return [...this.templates()]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get most downloaded
   */
  getMostDownloaded(limit: number = 10): PremiumTemplate[] {
    return [...this.templates()]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Rate template
   */
  rateTemplate(templateId: string, rating: number): void {
    if (rating < 0 || rating > 5) return;

    this.templates.update(templates =>
      templates.map(t =>
        t.id === templateId
          ? { ...t, rating: (t.rating + rating) / 2 }
          : t
      )
    );
  }

  /**
   * Get all categories
   */
  getCategories(): TemplateCategory[] {
    return ['game', 'tv-show', 'movie', 'anime', 'music', 'aesthetic', 'sport', 'brand'];
  }

  /**
   * Get all tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.templates().forEach(t => t.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }

  /**
   * Preview template
   */
  previewTemplate(templateId: string): {
    colors: ColorScheme;
    fonts: FontScheme;
    preview: string;
  } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      colors: template.colors,
      fonts: template.fonts,
      preview: template.previewImage
    };
  }

  /**
   * Export template configuration
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    return template ? JSON.stringify(template, null, 2) : '';
  }

  /**
   * Create custom template
   */
  createCustomTemplate(config: Partial<PremiumTemplate>): PremiumTemplate {
    const template: PremiumTemplate = {
      id: crypto.randomUUID(),
      name: config.name || 'Custom Template',
      brand: config.brand || 'Custom',
      description: config.description || '',
      category: config.category || 'aesthetic',
      theme: config.theme || { mood: 'minimal', style: 'clean' },
      premium: false,
      featured: false,
      previewImage: config.previewImage || 'custom-preview.jpg',
      colors: config.colors || {
        primary: '#4a90e2',
        secondary: '#ffffff',
        accent: '#ffd700',
        background: '#1a1a1a',
        text: '#ffffff'
      },
      fonts: config.fonts || {
        primary: 'Roboto',
        secondary: 'Roboto',
        sizes: { title: 40, subtitle: 28, body: 16 }
      },
      overlays: config.overlays || [],
      alerts: config.alerts || [],
      scenes: config.scenes || [],
      sounds: config.sounds || { alerts: {}, transitions: {} },
      transitions: config.transitions || [],
      lowerThirds: config.lowerThirds || {
        template: 'default',
        animation: 'slide',
        position: 'bottom',
        style: {}
      },
      chatStyle: config.chatStyle || {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        textColor: '#ffffff',
        fontSize: 16,
        animation: 'fade',
        highlightColor: '#4a90e2'
      },
      tags: config.tags || ['custom'],
      createdAt: new Date(),
      downloads: 0,
      rating: 0
    };

    this.templates.update(t => [...t, template]);
    return template;
  }
}
