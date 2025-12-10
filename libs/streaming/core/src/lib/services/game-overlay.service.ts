import { Injectable, signal, computed } from '@angular/core';

/**
 * Game Overlay Service
 * Display game-specific stats and information on stream
 */

export interface GameOverlay {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  type: 'stats' | 'scoreboard' | 'recent-kills' | 'minimap' | 'custom';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  opacity: number;
  stats: OverlayStat[];
  style: OverlayStyle;
  updateInterval: number; // in milliseconds
}

export interface OverlayStat {
  id: string;
  label: string;
  value: string | number;
  format?: 'number' | 'percentage' | 'time' | 'currency' | 'text';
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface OverlayStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  padding: number;
  shadow: boolean;
  blur: number;
}

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  gameType: string; // 'fps', 'moba', 'rpg', 'racing', etc.
  preview: string;
  defaultStats: string[];
  defaultStyle: Partial<OverlayStyle>;
}

@Injectable({
  providedIn: 'root'
})
export class GameOverlayService {
  readonly overlays = signal<GameOverlay[]>([]);
  readonly activeOverlays = computed(() =>
    this.overlays().filter(o => o.visible)
  );

  readonly templates = signal<OverlayTemplate[]>([
    // FPS Templates
    {
      id: 'fps-classic',
      name: 'FPS Classic',
      description: 'K/D/A with accuracy',
      gameType: 'fps',
      preview: 'fps-classic.png',
      defaultStats: ['kills', 'deaths', 'assists', 'accuracy', 'headshots'],
      defaultStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: '#4a90e2',
        borderWidth: 2,
        fontSize: 18,
        fontColor: '#ffffff'
      }
    },
    {
      id: 'fps-compact',
      name: 'FPS Compact',
      description: 'Minimalist K/D display',
      gameType: 'fps',
      preview: 'fps-compact.png',
      defaultStats: ['kills', 'deaths', 'kd-ratio'],
      defaultStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 0,
        fontSize: 16,
        fontColor: '#ffffff'
      }
    },

    // MOBA Templates
    {
      id: 'moba-full',
      name: 'MOBA Complete',
      description: 'K/D/A, CS, Gold, Level',
      gameType: 'moba',
      preview: 'moba-full.png',
      defaultStats: ['kills', 'deaths', 'assists', 'cs', 'gold', 'level'],
      defaultStyle: {
        backgroundColor: 'rgba(20, 20, 40, 0.8)',
        borderColor: '#ffd700',
        borderWidth: 2,
        fontSize: 20,
        fontColor: '#ffd700'
      }
    },
    {
      id: 'moba-kda',
      name: 'MOBA K/D/A',
      description: 'Just kills, deaths, assists',
      gameType: 'moba',
      preview: 'moba-kda.png',
      defaultStats: ['kills', 'deaths', 'assists', 'kda-ratio'],
      defaultStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderColor: '#00ff88',
        borderWidth: 1,
        fontSize: 18,
        fontColor: '#ffffff'
      }
    },

    // Battle Royale Templates
    {
      id: 'br-stats',
      name: 'Battle Royale Stats',
      description: 'Kills, Placement, Damage',
      gameType: 'battle-royale',
      preview: 'br-stats.png',
      defaultStats: ['kills', 'damage', 'placement', 'survival-time'],
      defaultStyle: {
        backgroundColor: 'rgba(40, 20, 0, 0.8)',
        borderColor: '#ff6600',
        borderWidth: 2,
        fontSize: 18,
        fontColor: '#ffffff'
      }
    },

    // Racing Templates
    {
      id: 'racing-stats',
      name: 'Racing Stats',
      description: 'Position, Lap Time, Speed',
      gameType: 'racing',
      preview: 'racing-stats.png',
      defaultStats: ['position', 'lap-time', 'best-lap', 'speed'],
      defaultStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderColor: '#ff0000',
        borderWidth: 2,
        fontSize: 20,
        fontColor: '#00ff00'
      }
    },

    // RPG Templates
    {
      id: 'rpg-stats',
      name: 'RPG Stats',
      description: 'Level, HP, Mana, XP',
      gameType: 'rpg',
      preview: 'rpg-stats.png',
      defaultStats: ['level', 'hp', 'mana', 'xp', 'location'],
      defaultStyle: {
        backgroundColor: 'rgba(40, 20, 40, 0.8)',
        borderColor: '#9966ff',
        borderWidth: 2,
        fontSize: 18,
        fontColor: '#ffffff'
      }
    }
  ]);

  // Default style
  private defaultStyle: OverlayStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: '#4a90e2',
    borderWidth: 2,
    borderRadius: 8,
    fontSize: 18,
    fontColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    padding: 12,
    shadow: true,
    blur: 0
  };

  /**
   * Create new overlay
   */
  createOverlay(
    gameName: string,
    type: GameOverlay['type'] = 'stats',
    templateId?: string
  ): GameOverlay {
    const template = templateId
      ? this.templates().find(t => t.id === templateId)
      : null;

    const overlay: GameOverlay = {
      id: crypto.randomUUID(),
      name: `${gameName} Overlay`,
      gameId: crypto.randomUUID(),
      gameName,
      type,
      position: { x: 50, y: 50 },
      size: { width: 300, height: 200 },
      visible: true,
      opacity: 1.0,
      stats: template
        ? template.defaultStats.map(stat => this.createDefaultStat(stat))
        : [],
      style: template
        ? { ...this.defaultStyle, ...template.defaultStyle }
        : this.defaultStyle,
      updateInterval: 1000
    };

    this.overlays.update(overlays => [...overlays, overlay]);
    return overlay;
  }

  /**
   * Create overlay from template
   */
  createFromTemplate(templateId: string, gameName: string): GameOverlay | null {
    const template = this.templates().find(t => t.id === templateId);
    if (!template) return null;

    return this.createOverlay(gameName, 'stats', templateId);
  }

  /**
   * Update overlay
   */
  updateOverlay(overlayId: string, updates: Partial<GameOverlay>): void {
    this.overlays.update(overlays =>
      overlays.map(o => o.id === overlayId ? { ...o, ...updates } : o)
    );
  }

  /**
   * Delete overlay
   */
  deleteOverlay(overlayId: string): void {
    this.overlays.update(overlays => overlays.filter(o => o.id !== overlayId));
  }

  /**
   * Toggle overlay visibility
   */
  toggleOverlay(overlayId: string): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId ? { ...o, visible: !o.visible } : o
      )
    );
  }

  /**
   * Update overlay position
   */
  updatePosition(overlayId: string, x: number, y: number): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId ? { ...o, position: { x, y } } : o
      )
    );
  }

  /**
   * Update overlay size
   */
  updateSize(overlayId: string, width: number, height: number): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId ? { ...o, size: { width, height } } : o
      )
    );
  }

  /**
   * Add stat to overlay
   */
  addStat(overlayId: string, stat: OverlayStat): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId
          ? { ...o, stats: [...o.stats, stat] }
          : o
      )
    );
  }

  /**
   * Remove stat from overlay
   */
  removeStat(overlayId: string, statId: string): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId
          ? { ...o, stats: o.stats.filter(s => s.id !== statId) }
          : o
      )
    );
  }

  /**
   * Update stat value
   */
  updateStat(overlayId: string, statId: string, value: string | number): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId
          ? {
              ...o,
              stats: o.stats.map(s =>
                s.id === statId ? { ...s, value } : s
              )
            }
          : o
      )
    );
  }

  /**
   * Update multiple stats at once
   */
  updateStats(overlayId: string, stats: Record<string, string | number>): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId
          ? {
              ...o,
              stats: o.stats.map(s =>
                stats[s.id] !== undefined
                  ? { ...s, value: stats[s.id] }
                  : s
              )
            }
          : o
      )
    );
  }

  /**
   * Update overlay style
   */
  updateStyle(overlayId: string, style: Partial<OverlayStyle>): void {
    this.overlays.update(overlays =>
      overlays.map(o =>
        o.id === overlayId
          ? { ...o, style: { ...o.style, ...style } }
          : o
      )
    );
  }

  /**
   * Create default stat
   */
  private createDefaultStat(statName: string): OverlayStat {
    const statDefinitions: Record<string, Partial<OverlayStat>> = {
      kills: { label: 'Kills', icon: '💀', color: '#ff6b6b' },
      deaths: { label: 'Deaths', icon: '☠️', color: '#888' },
      assists: { label: 'Assists', icon: '🤝', color: '#4ade80' },
      'kd-ratio': { label: 'K/D', icon: '📊', format: 'number' },
      'kda-ratio': { label: 'KDA', icon: '📊', format: 'number' },
      accuracy: { label: 'Accuracy', icon: '🎯', format: 'percentage' },
      headshots: { label: 'Headshots', icon: '🎯', format: 'percentage' },
      cs: { label: 'CS', icon: '⚔️', color: '#ffd700' },
      gold: { label: 'Gold', icon: '💰', format: 'currency', color: '#ffd700' },
      level: { label: 'Level', icon: '⭐', format: 'number', color: '#4a90e2' },
      damage: { label: 'Damage', icon: '💥', format: 'number', color: '#ff6600' },
      placement: { label: 'Place', icon: '🏆', format: 'number' },
      'survival-time': { label: 'Time', icon: '⏱️', format: 'time' },
      position: { label: 'Position', icon: '🏁', format: 'number' },
      'lap-time': { label: 'Lap', icon: '⏱️', format: 'time' },
      'best-lap': { label: 'Best', icon: '🏆', format: 'time', color: '#ffd700' },
      speed: { label: 'Speed', icon: '⚡', format: 'number' },
      hp: { label: 'HP', icon: '❤️', format: 'number', color: '#ff0000' },
      mana: { label: 'Mana', icon: '💙', format: 'number', color: '#4a90e2' },
      xp: { label: 'XP', icon: '⭐', format: 'number', color: '#ffd700' },
      location: { label: 'Location', icon: '📍', format: 'text' }
    };

    const def = statDefinitions[statName] || {};

    return {
      id: statName,
      label: def.label || statName,
      value: 0,
      format: def.format || 'number',
      icon: def.icon,
      color: def.color,
      trend: 'neutral'
    };
  }

  /**
   * Format stat value
   */
  formatStatValue(stat: OverlayStat): string {
    const value = stat.value;

    switch (stat.format) {
      case 'percentage':
        return `${value}%`;

      case 'time':
        if (typeof value === 'number') {
          const minutes = Math.floor(value / 60);
          const seconds = value % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return String(value);

      case 'currency':
        if (typeof value === 'number') {
          return value >= 1000
            ? `${(value / 1000).toFixed(1)}k`
            : String(value);
        }
        return String(value);

      case 'number':
        if (typeof value === 'number') {
          return value >= 1000000
            ? `${(value / 1000000).toFixed(1)}M`
            : value >= 1000
            ? `${(value / 1000).toFixed(1)}k`
            : String(value);
        }
        return String(value);

      case 'text':
      default:
        return String(value);
    }
  }

  /**
   * Get overlays for specific game
   */
  getGameOverlays(gameName: string): GameOverlay[] {
    return this.overlays().filter(o => o.gameName === gameName);
  }

  /**
   * Duplicate overlay
   */
  duplicateOverlay(overlayId: string): GameOverlay | null {
    const overlay = this.overlays().find(o => o.id === overlayId);
    if (!overlay) return null;

    const duplicate: GameOverlay = {
      ...overlay,
      id: crypto.randomUUID(),
      name: `${overlay.name} (Copy)`,
      position: {
        x: overlay.position.x + 20,
        y: overlay.position.y + 20
      }
    };

    this.overlays.update(overlays => [...overlays, duplicate]);
    return duplicate;
  }

  /**
   * Export overlay configuration
   */
  exportOverlay(overlayId: string): string {
    const overlay = this.overlays().find(o => o.id === overlayId);
    return overlay ? JSON.stringify(overlay, null, 2) : '';
  }

  /**
   * Import overlay configuration
   */
  importOverlay(json: string): boolean {
    try {
      const overlay = JSON.parse(json) as GameOverlay;
      overlay.id = crypto.randomUUID();
      this.overlays.update(overlays => [...overlays, overlay]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available stat types
   */
  getAvailableStats(gameType: string): string[] {
    const statsByType: Record<string, string[]> = {
      fps: ['kills', 'deaths', 'assists', 'kd-ratio', 'accuracy', 'headshots', 'damage'],
      moba: ['kills', 'deaths', 'assists', 'kda-ratio', 'cs', 'gold', 'level'],
      'battle-royale': ['kills', 'damage', 'placement', 'survival-time'],
      racing: ['position', 'lap-time', 'best-lap', 'speed'],
      rpg: ['level', 'hp', 'mana', 'xp', 'location']
    };

    return statsByType[gameType] || [];
  }
}
