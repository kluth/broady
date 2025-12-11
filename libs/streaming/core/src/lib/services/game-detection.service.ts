import { Injectable, signal, computed } from '@angular/core';

/**
 * Game Detection Service
 * Automatically detects running games and provides game information
 */

export interface GameInfo {
  id: string;
  name: string;
  platform: 'steam' | 'epic' | 'riot' | 'blizzard' | 'origin' | 'gog' | 'xbox' | 'other';
  appId?: string;
  processName: string;
  isRunning: boolean;
  startTime?: Date;
  playtime: number; // in seconds
  icon?: string;
  coverArt?: string;
  category?: string;
  developer?: string;
  publisher?: string;
}

export interface GameSession {
  id: string;
  gameId: string;
  gameName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  stats?: Record<string, any>;
}

export interface GameRule {
  id: string;
  gameId: string;
  gameName: string;
  autoSwitchScene?: string;
  autoEnableOverlay?: string;
  autoStartRecording?: boolean;
  customTitle?: string;
  customTags?: string[];
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameDetectionService {
  readonly currentGame = signal<GameInfo | null>(null);
  readonly detectedGames = signal<GameInfo[]>([]);
  readonly gameHistory = signal<GameSession[]>([]);
  readonly gameRules = signal<GameRule[]>([]);
  readonly isDetecting = signal<boolean>(false);

  // Statistics
  readonly totalPlaytime = computed(() => {
    return this.gameHistory().reduce((sum, session) => sum + session.duration, 0);
  });

  readonly favoriteGame = computed(() => {
    const playtimeByGame = new Map<string, number>();

    this.gameHistory().forEach(session => {
      const current = playtimeByGame.get(session.gameName) || 0;
      playtimeByGame.set(session.gameName, current + session.duration);
    });

    let maxPlaytime = 0;
    let favGame = '';

    playtimeByGame.forEach((playtime, game) => {
      if (playtime > maxPlaytime) {
        maxPlaytime = playtime;
        favGame = game;
      }
    });

    return favGame;
  });

  readonly sessionStats = computed(() => ({
    totalSessions: this.gameHistory().length,
    totalPlaytime: this.totalPlaytime(),
    averageSessionLength: this.gameHistory().length > 0
      ? this.totalPlaytime() / this.gameHistory().length
      : 0,
    gamesPlayed: new Set(this.gameHistory().map(s => s.gameName)).size,
    currentStreak: this.getCurrentStreak(),
    favoriteGame: this.favoriteGame()
  }));

  // Known games database (extensible)
  private knownGames = signal<Map<string, Partial<GameInfo>>>(new Map([
    // Popular games with process names
    ['LeagueofLegends.exe', {
      name: 'League of Legends',
      platform: 'riot',
      category: 'MOBA',
      developer: 'Riot Games'
    }],
    ['VALORANT-Win64-Shipping.exe', {
      name: 'VALORANT',
      platform: 'riot',
      category: 'FPS',
      developer: 'Riot Games'
    }],
    ['csgo.exe', {
      name: 'Counter-Strike: Global Offensive',
      platform: 'steam',
      appId: '730',
      category: 'FPS',
      developer: 'Valve'
    }],
    ['cs2.exe', {
      name: 'Counter-Strike 2',
      platform: 'steam',
      appId: '730',
      category: 'FPS',
      developer: 'Valve'
    }],
    ['Overwatch.exe', {
      name: 'Overwatch 2',
      platform: 'blizzard',
      category: 'FPS',
      developer: 'Blizzard'
    }],
    ['FortniteClient-Win64-Shipping.exe', {
      name: 'Fortnite',
      platform: 'epic',
      category: 'Battle Royale',
      developer: 'Epic Games'
    }],
    ['RocketLeague.exe', {
      name: 'Rocket League',
      platform: 'epic',
      category: 'Sports',
      developer: 'Psyonix'
    }],
    ['ApexLegends.exe', {
      name: 'Apex Legends',
      platform: 'origin',
      category: 'Battle Royale',
      developer: 'Respawn'
    }],
    ['r5apex.exe', {
      name: 'Apex Legends',
      platform: 'steam',
      category: 'Battle Royale',
      developer: 'Respawn'
    }],
    ['Minecraft.exe', {
      name: 'Minecraft',
      platform: 'other',
      category: 'Sandbox',
      developer: 'Mojang'
    }],
    ['javaw.exe', {
      name: 'Minecraft Java Edition',
      platform: 'other',
      category: 'Sandbox',
      developer: 'Mojang'
    }],
    ['RainbowSix.exe', {
      name: 'Rainbow Six Siege',
      platform: 'steam',
      category: 'FPS',
      developer: 'Ubisoft'
    }],
    ['GTA5.exe', {
      name: 'Grand Theft Auto V',
      platform: 'steam',
      category: 'Action',
      developer: 'Rockstar'
    }],
    ['RDR2.exe', {
      name: 'Red Dead Redemption 2',
      platform: 'steam',
      category: 'Action',
      developer: 'Rockstar'
    }],
    ['Dota2.exe', {
      name: 'Dota 2',
      platform: 'steam',
      appId: '570',
      category: 'MOBA',
      developer: 'Valve'
    }],
    ['WoW.exe', {
      name: 'World of Warcraft',
      platform: 'blizzard',
      category: 'MMORPG',
      developer: 'Blizzard'
    }],
    ['Hearthstone.exe', {
      name: 'Hearthstone',
      platform: 'blizzard',
      category: 'Card Game',
      developer: 'Blizzard'
    }],
    ['StarCraft II.exe', {
      name: 'StarCraft II',
      platform: 'blizzard',
      category: 'RTS',
      developer: 'Blizzard'
    }],
    ['Diablo IV.exe', {
      name: 'Diablo IV',
      platform: 'blizzard',
      category: 'ARPG',
      developer: 'Blizzard'
    }],
    ['eldenring.exe', {
      name: 'Elden Ring',
      platform: 'steam',
      category: 'RPG',
      developer: 'FromSoftware'
    }],
    ['BaldursGate3.exe', {
      name: "Baldur's Gate 3",
      platform: 'steam',
      category: 'RPG',
      developer: 'Larian'
    }],
    ['Cyberpunk2077.exe', {
      name: 'Cyberpunk 2077',
      platform: 'gog',
      category: 'RPG',
      developer: 'CD Projekt Red'
    }],
    ['deadlock.exe', {
      name: 'Deadlock',
      platform: 'steam',
      category: 'MOBA',
      developer: 'Valve'
    }],
    ['MarvelRivals.exe', {
      name: 'Marvel Rivals',
      platform: 'steam',
      category: 'Hero Shooter',
      developer: 'NetEase'
    }],
    ['PathOfExile.exe', {
      name: 'Path of Exile',
      platform: 'steam',
      category: 'ARPG',
      developer: 'Grinding Gear Games'
    }],
    ['PathOfExile_x64.exe', {
      name: 'Path of Exile',
      platform: 'steam',
      category: 'ARPG',
      developer: 'Grinding Gear Games'
    }],
    ['Last Epoch.exe', {
      name: 'Last Epoch',
      platform: 'steam',
      category: 'ARPG',
      developer: 'Eleventh Hour Games'
    }]
  ]));

  private detectionInterval: any;
  private currentSessionId: string | null = null;
  private sessionStartTime: Date | null = null;

  /**
   * Start automatic game detection
   */
  startDetection(intervalMs: number = 5000): void {
    if (this.isDetecting()) return;

    this.isDetecting.set(true);
    this.detectGames(); // Initial detection

    this.detectionInterval = setInterval(() => {
      this.detectGames();
    }, intervalMs);
  }

  /**
   * Stop automatic game detection
   */
  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    this.isDetecting.set(false);
  }

  /**
   * Detect currently running games
   * In a real implementation, this would use native APIs or process monitoring
   */
  private async detectGames(): Promise<void> {
    // Simulated detection - in production, this would call a native API
    // to get running processes and match against known games

    // For demo purposes, we'll simulate random game detection
    const simulatedGames = this.simulateGameDetection();
    this.detectedGames.set(simulatedGames);

    // Update current game
    const runningGame = simulatedGames.find(g => g.isRunning);

    if (runningGame && (!this.currentGame() || this.currentGame()!.id !== runningGame.id)) {
      // New game started
      this.onGameStarted(runningGame);
    } else if (!runningGame && this.currentGame()) {
      // Game stopped
      this.onGameStopped();
    }

    // Update playtime
    if (this.currentGame() && this.sessionStartTime) {
      const playtime = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
      this.currentGame.update(game =>
        game ? { ...game, playtime } : null
      );
    }
  }

  /**
   * Simulate game detection (for demo)
   * In production, replace with actual process monitoring
   */
  private simulateGameDetection(): GameInfo[] {
    // For demo, just return empty or mock data
    return [];
  }

  /**
   * Manual game selection
   */
  setCurrentGame(processName: string): void {
    const gameData = this.knownGames().get(processName);

    if (gameData) {
      const game: GameInfo = {
        id: crypto.randomUUID(),
        name: gameData.name || processName,
        platform: gameData.platform || 'other',
        appId: gameData.appId,
        processName,
        isRunning: true,
        startTime: new Date(),
        playtime: 0,
        category: gameData.category,
        developer: gameData.developer,
        publisher: gameData.publisher
      };

      this.onGameStarted(game);
    }
  }

  /**
   * Add custom game to database
   */
  addCustomGame(processName: string, gameData: Partial<GameInfo>): void {
    this.knownGames.update(games => {
      const newMap = new Map(games);
      newMap.set(processName, gameData);
      return newMap;
    });
  }

  /**
   * Get all known games
   */
  getKnownGames(): Array<{ processName: string; data: Partial<GameInfo> }> {
    return Array.from(this.knownGames().entries()).map(([processName, data]) => ({
      processName,
      data
    }));
  }

  /**
   * Handle game started
   */
  private onGameStarted(game: GameInfo): void {
    console.log(`Game started: ${game.name}`);

    this.currentGame.set(game);
    this.sessionStartTime = new Date();
    this.currentSessionId = crypto.randomUUID();

    // Apply game rules
    const rule = this.gameRules().find(r => r.gameId === game.id || r.gameName === game.name);
    if (rule && rule.enabled) {
      this.applyGameRule(rule);
    }

    // Emit event for automation triggers
    this.emitGameEvent('game-started', game);
  }

  /**
   * Handle game stopped
   */
  private onGameStopped(): void {
    const game = this.currentGame();
    if (!game || !this.sessionStartTime || !this.currentSessionId) return;

    console.log(`Game stopped: ${game.name}`);

    const session: GameSession = {
      id: this.currentSessionId,
      gameId: game.id,
      gameName: game.name,
      startTime: this.sessionStartTime,
      endTime: new Date(),
      duration: Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000)
    };

    this.gameHistory.update(history => [...history, session]);

    // Emit event for automation triggers
    this.emitGameEvent('game-stopped', game);

    this.currentGame.set(null);
    this.sessionStartTime = null;
    this.currentSessionId = null;
  }

  /**
   * Apply game-specific rules
   */
  private applyGameRule(rule: GameRule): void {
    console.log(`Applying rule for: ${rule.gameName}`, rule);

    // Integration points for automation
    // These would trigger actual actions in the streaming app
    if (rule.autoSwitchScene) {
      console.log(`Auto-switching to scene: ${rule.autoSwitchScene}`);
    }

    if (rule.autoStartRecording) {
      console.log('Auto-starting recording');
    }
  }

  /**
   * Create game rule
   */
  createGameRule(gameId: string, gameName: string, config: Partial<GameRule>): GameRule {
    const rule: GameRule = {
      id: crypto.randomUUID(),
      gameId,
      gameName,
      enabled: true,
      ...config
    };

    this.gameRules.update(rules => [...rules, rule]);
    return rule;
  }

  /**
   * Update game rule
   */
  updateGameRule(ruleId: string, updates: Partial<GameRule>): void {
    this.gameRules.update(rules =>
      rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    );
  }

  /**
   * Delete game rule
   */
  deleteGameRule(ruleId: string): void {
    this.gameRules.update(rules => rules.filter(r => r.id !== ruleId));
  }

  /**
   * Toggle game rule
   */
  toggleGameRule(ruleId: string): void {
    this.gameRules.update(rules =>
      rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
    );
  }

  /**
   * Get playtime for specific game
   */
  getGamePlaytime(gameName: string): number {
    return this.gameHistory()
      .filter(s => s.gameName === gameName)
      .reduce((sum, s) => sum + s.duration, 0);
  }

  /**
   * Get sessions for specific game
   */
  getGameSessions(gameName: string): GameSession[] {
    return this.gameHistory().filter(s => s.gameName === gameName);
  }

  /**
   * Get current streak (days played in a row)
   */
  private getCurrentStreak(): number {
    const sessions = this.gameHistory().sort((a, b) =>
      b.startTime.getTime() - a.startTime.getTime()
    );

    if (sessions.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(sessions[0].startTime);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].startTime);
      sessionDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
        currentDate = sessionDate;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return streak;
  }

  /**
   * Emit game event for automation system
   */
  private emitGameEvent(eventType: string, game: GameInfo): void {
    // This would integrate with the automation service
    const event = new CustomEvent('game-event', {
      detail: {
        type: eventType,
        game: game,
        timestamp: new Date()
      }
    });

    window.dispatchEvent(event);
  }

  /**
   * Format playtime
   */
  formatPlaytime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Export game history
   */
  exportHistory(): string {
    return JSON.stringify({
      sessions: this.gameHistory(),
      stats: this.sessionStats(),
      exportDate: new Date()
    }, null, 2);
  }

  /**
   * Import game history
   */
  importHistory(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.sessions && Array.isArray(data.sessions)) {
        this.gameHistory.set(data.sessions);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
