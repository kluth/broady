import { Injectable, signal, computed, inject } from '@angular/core';
import { SocketService } from './socket.service';

export interface GameInfo {
  id: string;
  name: string;
  processName: string;
  platform: 'Steam' | 'Epic' | 'Battle.net' | 'Riot' | 'Origin' | 'Standalone' | 'Launcher';
  category?: string;
  coverImage?: string;
  isRunning: boolean;
  startTime?: Date;
  playtime: number; // seconds
}

export interface GameRule {
  id: string;
  gameName: string;
  enabled: boolean;
  autoSwitchScene?: string;
  autoStartRecording: boolean;
  customTitle?: string;
}

export interface GameSession {
  id: string;
  gameName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameDetectionService {
  private socket = inject(SocketService);

  readonly detectedGames = signal<GameInfo[]>([]);
  readonly currentGame = signal<GameInfo | null>(null);
  readonly isDetecting = signal(false);
  
  readonly gameRules = signal<GameRule[]>([]);
  readonly gameHistory = signal<GameSession[]>([]);

  readonly sessionStats = computed(() => {
    const history = this.gameHistory();
    const games = new Set(history.map(s => s.gameName));
    
    return {
      totalPlaytime: history.reduce((sum, s) => sum + s.duration, 0),
      gamesPlayed: games.size,
      totalSessions: history.length,
      currentStreak: this.calculateStreak(history),
      favoriteGame: this.getFavoriteGame(history),
      averageSessionLength: history.length > 0 
        ? history.reduce((sum, s) => sum + s.duration, 0) / history.length 
        : 0
    };
  });

  private monitoringInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.loadRules();
    
    // Listen for backend game detection events
    this.socket.on<any[]>('games:detected', (games) => {
      this.handleDetectedGames(games);
    });
  }

  startDetection(): void {
    if (this.isDetecting()) return;
    this.isDetecting.set(true);
    
    // The backend pushes updates automatically, no interval needed here for polling
    // But we keep the timer for updating playtime counters
    this.monitoringInterval = setInterval(() => {
      this.updatePlaytime();
    }, 1000);
  }

  stopDetection(): void {
    this.isDetecting.set(false);
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // End current session if any
    if (this.currentGame()) {
      this.endGameSession(this.currentGame()!);
    }
  }

  private handleDetectedGames(backendGames: any[]): void {
    if (!this.isDetecting()) return;

    // Convert backend data to GameInfo
    const detected: GameInfo[] = backendGames.map(bg => ({
      id: bg.processName, // Use process name as ID
      name: bg.name,
      processName: bg.processName,
      platform: 'Standalone', // Default
      category: 'Game', // Default category
      isRunning: true,
      playtime: 0 // Will be updated
    }));

    // Check if current game is still running
    const current = this.currentGame();
    if (current) {
      const stillRunning = detected.find(g => g.processName === current.processName);
      if (!stillRunning) {
        this.endGameSession(current);
      }
    }

    // Check for new game
    const newGame = detected.find(g => !current || g.processName !== current.processName);
    if (newGame) {
      // If we switched games directly
      if (current) {
        this.endGameSession(current);
      }
      this.startGameSession(newGame);
    }
    
    // Update detected list (merging with known info if we had it)
    this.detectedGames.set(detected);
  }

  private startGameSession(game: GameInfo): void {
    const sessionGame = { ...game, startTime: new Date(), isRunning: true };
    this.currentGame.set(sessionGame);
    
    // Apply rules
    this.applyGameRules(sessionGame);
  }

  private endGameSession(game: GameInfo): void {
    const session: GameSession = {
      id: crypto.randomUUID(),
      gameName: game.name,
      startTime: game.startTime || new Date(),
      endTime: new Date(),
      duration: game.playtime
    };

    this.gameHistory.update(h => [session, ...h]);
    this.currentGame.set(null);
  }

  private updatePlaytime(): void {
    const current = this.currentGame();
    if (current && current.startTime) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - current.startTime.getTime()) / 1000);
      
      this.currentGame.update(g => g ? { ...g, playtime: diff } : null);
    }
  }

  private applyGameRules(game: GameInfo): void {
    const rule = this.gameRules().find(r => r.enabled && r.gameName === game.name);
    
    if (rule) {
      console.log(`Applying rules for ${game.name}:`, rule);
      
      // In production, these would trigger actual services
      if (rule.autoSwitchScene) {
        console.log(`Auto-switching to scene: ${rule.autoSwitchScene}`);
      }
      
      if (rule.autoStartRecording) {
        console.log('Auto-starting recording');
      }
      
      if (rule.customTitle) {
        console.log(`Updating stream title: ${rule.customTitle}`);
      }
    }
  }

  setCurrentGame(processName: string): void {
    const knownGames = this.getKnownGames();
    const game = knownGames.find(g => g.processName === processName);
    
    if (game) {
      const gameInfo: GameInfo = {
        id: crypto.randomUUID(),
        name: game.data.name,
        processName: game.processName,
        platform: game.data.platform,
        isRunning: true,
        playtime: 0
      };
      
      if (this.currentGame()) {
        this.endGameSession(this.currentGame()!);
      }
      this.startGameSession(gameInfo);
    }
  }

  createGameRule(id: string, gameName: string, config: any): void {
    const rule: GameRule = {
      id,
      gameName,
      enabled: true,
      ...config
    };
    this.gameRules.update(r => [...r, rule]);
    this.saveRules();
  }

  toggleGameRule(id: string): void {
    this.gameRules.update(rules => 
      rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
    this.saveRules();
  }

  deleteGameRule(id: string): void {
    this.gameRules.update(rules => rules.filter(r => r.id !== id));
    this.saveRules();
  }

  private saveRules(): void {
    localStorage.setItem('game_rules', JSON.stringify(this.gameRules()));
  }

  private loadRules(): void {
    const saved = localStorage.getItem('game_rules');
    if (saved) {
      this.gameRules.set(JSON.parse(saved));
    }
  }

  formatPlaytime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  private calculateStreak(history: GameSession[]): number {
    // Simplified streak calculation
    if (history.length === 0) return 0;
    return 1;
  }

  private getFavoriteGame(history: GameSession[]): string {
    if (history.length === 0) return '';
    const counts = new Map<string, number>();
    history.forEach(s => counts.set(s.gameName, (counts.get(s.gameName) || 0) + 1));
    
    let favorite = '';
    let max = 0;
    
    counts.forEach((count, name) => {
      if (count > max) {
        max = count;
        favorite = name;
      }
    });
    
    return favorite;
  }

  getKnownGames() {
    return [
      { processName: 'cs2.exe', data: { name: 'Counter-Strike 2', platform: 'Steam' } },
      { processName: 'valorant.exe', data: { name: 'Valorant', platform: 'Riot' } },
      { processName: 'LeagueClient.exe', data: { name: 'League of Legends', platform: 'Riot' } },
      { processName: 'FortniteClient-Win64-Shipping.exe', data: { name: 'Fortnite', platform: 'Epic' } },
      { processName: 'Minecraft.exe', data: { name: 'Minecraft', platform: 'Launcher' } },
      { processName: 'Lorcana.exe', data: { name: 'Disney Lorcana TCG', platform: 'Standalone' } },
      { processName: 'TCGL.exe', data: { name: 'Pokémon TCG Live', platform: 'Standalone' } },
      { processName: 'PokemonTCG.exe', data: { name: 'Pokémon Trading Card Game', platform: 'Standalone' } }
    ] as const;
  }
}