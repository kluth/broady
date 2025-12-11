import { Injectable, signal } from '@angular/core';

/**
 * Game API Service
 * Integration with Steam, Riot Games, Epic, and other gaming platform APIs
 */

export interface SteamProfile {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatar: string;
  realName?: string;
  countryCode?: string;
}

export interface SteamGameStats {
  appId: string;
  gameName: string;
  playtime: number;
  achievements: SteamAchievement[];
  stats: Record<string, number>;
}

export interface SteamAchievement {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockTime?: Date;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
}

export interface LeagueMatch {
  matchId: string;
  gameMode: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  duration: number;
  timestamp: Date;
}

export interface ValorantMatch {
  matchId: string;
  map: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  score: string;
  rank: string;
  timestamp: Date;
}

export interface GameAPIConfig {
  steamApiKey?: string;
  riotApiKey?: string;
  epicApiKey?: string;
  blizzardApiKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameAPIService {
  readonly config = signal<GameAPIConfig>({});
  readonly isConfigured = signal<boolean>(false);

  // Steam
  readonly steamProfile = signal<SteamProfile | null>(null);
  readonly steamGames = signal<SteamGameStats[]>([]);
  readonly recentAchievements = signal<SteamAchievement[]>([]);

  // Riot Games
  readonly riotAccount = signal<RiotAccount | null>(null);
  readonly leagueMatches = signal<LeagueMatch[]>([]);
  readonly valorantMatches = signal<ValorantMatch[]>([]);

  // Connection status
  readonly steamConnected = signal<boolean>(false);
  readonly riotConnected = signal<boolean>(false);
  readonly epicConnected = signal<boolean>(false);

  /**
   * Configure API keys
   */
  configure(config: GameAPIConfig): void {
    this.config.set(config);
    this.isConfigured.set(!!(config.steamApiKey || config.riotApiKey));
  }

  /**
   * Steam API Integration
   */

  async connectSteam(steamId: string): Promise<boolean> {
    try {
      const apiKey = this.config().steamApiKey;
      if (!apiKey) {
        throw new Error('Steam API key not configured');
      }

      // Fetch Steam profile
      const profile = await this.fetchSteamProfile(steamId, apiKey);
      this.steamProfile.set(profile);
      this.steamConnected.set(true);

      // Fetch owned games
      await this.fetchSteamGames(steamId, apiKey);

      return true;
    } catch (error) {
      console.error('Steam connection failed:', error);
      this.steamConnected.set(false);
      return false;
    }
  }

  private async fetchSteamProfile(steamId: string, apiKey: string): Promise<SteamProfile> {
    // In production, this would call the Steam Web API
    // https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/

    // Mock data for demo
    return {
      steamId,
      personaName: 'StreamerPro',
      profileUrl: `https://steamcommunity.com/id/${steamId}`,
      avatar: 'https://avatars.akamai.steamstatic.com/default.jpg',
      realName: 'Demo User',
      countryCode: 'US'
    };
  }

  private async fetchSteamGames(steamId: string, apiKey: string): Promise<void> {
    // In production: https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/

    // Mock data
    const games: SteamGameStats[] = [
      {
        appId: '730',
        gameName: 'Counter-Strike 2',
        playtime: 150000,
        achievements: [],
        stats: {
          kills: 15420,
          deaths: 12350,
          wins: 542,
          losses: 458
        }
      }
    ];

    this.steamGames.set(games);
  }

  async fetchSteamAchievements(appId: string): Promise<SteamAchievement[]> {
    const apiKey = this.config().steamApiKey;
    const steamId = this.steamProfile()?.steamId;

    if (!apiKey || !steamId) {
      return [];
    }

    // In production: https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/

    // Mock data
    const achievements: SteamAchievement[] = [
      {
        name: 'first_kill',
        displayName: 'First Blood',
        description: 'Get your first kill',
        icon: 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/730/achievement.jpg',
        unlocked: true,
        unlockTime: new Date()
      }
    ];

    return achievements;
  }

  /**
   * Riot Games API Integration
   */

  async connectRiot(gameName: string, tagLine: string, region: string = 'americas'): Promise<boolean> {
    try {
      const apiKey = this.config().riotApiKey;
      if (!apiKey) {
        throw new Error('Riot API key not configured');
      }

      const account = await this.fetchRiotAccount(gameName, tagLine, region, apiKey);
      this.riotAccount.set(account);
      this.riotConnected.set(true);

      return true;
    } catch (error) {
      console.error('Riot connection failed:', error);
      this.riotConnected.set(false);
      return false;
    }
  }

  private async fetchRiotAccount(
    gameName: string,
    tagLine: string,
    region: string,
    apiKey: string
  ): Promise<RiotAccount> {
    // In production: https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}

    // Mock data
    return {
      puuid: crypto.randomUUID(),
      gameName,
      tagLine,
      region
    };
  }

  async fetchLeagueMatches(count: number = 10): Promise<LeagueMatch[]> {
    const apiKey = this.config().riotApiKey;
    const account = this.riotAccount();

    if (!apiKey || !account) {
      return [];
    }

    // In production: League of Legends Match API
    // https://developer.riotgames.com/apis#match-v5

    // Mock data
    const matches: LeagueMatch[] = [
      {
        matchId: 'NA1_123456789',
        gameMode: 'Ranked Solo',
        champion: 'Yasuo',
        kills: 12,
        deaths: 5,
        assists: 8,
        win: true,
        duration: 1825,
        timestamp: new Date()
      }
    ];

    this.leagueMatches.set(matches);
    return matches;
  }

  async fetchValorantMatches(count: number = 10): Promise<ValorantMatch[]> {
    const apiKey = this.config().riotApiKey;
    const account = this.riotAccount();

    if (!apiKey || !account) {
      return [];
    }

    // In production: Valorant Match API

    // Mock data
    const matches: ValorantMatch[] = [
      {
        matchId: 'val_123456',
        map: 'Ascent',
        agent: 'Jett',
        kills: 24,
        deaths: 15,
        assists: 6,
        score: '13-11',
        rank: 'Diamond 2',
        timestamp: new Date()
      }
    ];

    this.valorantMatches.set(matches);
    return matches;
  }

  /**
   * Get live League of Legends game stats
   * Requires special integration with League Client API
   */
  async getLeagueLiveStats(): Promise<any> {
    // In production, this would connect to the League Client API (LCU)
    // https://127.0.0.1:2999/liveclientdata/allgamedata

    try {
      // Mock live stats
      return {
        activePlayer: {
          summonerName: 'StreamerPro',
          championName: 'Yasuo',
          level: 14,
          currentGold: 8500,
          kills: 5,
          deaths: 2,
          assists: 7,
          cs: 145,
          items: ['Immortal Shieldbow', 'Berserker\'s Greaves']
        },
        gameData: {
          gameMode: 'CLASSIC',
          gameTime: 845.5,
          mapName: 'Summoner\'s Rift'
        },
        events: []
      };
    } catch {
      return null;
    }
  }

  /**
   * Get live Valorant game stats
   */
  async getValorantLiveStats(): Promise<any> {
    // Valorant doesn't have an official live game API
    // Would need to use third-party solutions or OCR

    return null;
  }

  /**
   * Generic game stats fetcher
   */
  async fetchGameStats(platform: string, game: string, userId: string): Promise<any> {
    switch (platform) {
      case 'steam':
        return this.fetchSteamGames(userId, this.config().steamApiKey!);

      case 'riot':
        if (game === 'league') {
          return this.fetchLeagueMatches();
        } else if (game === 'valorant') {
          return this.fetchValorantMatches();
        }
        break;

      default:
        return null;
    }
  }

  /**
   * Disconnect from platform
   */
  disconnectSteam(): void {
    this.steamProfile.set(null);
    this.steamGames.set([]);
    this.steamConnected.set(false);
  }

  disconnectRiot(): void {
    this.riotAccount.set(null);
    this.leagueMatches.set([]);
    this.valorantMatches.set([]);
    this.riotConnected.set(false);
  }

  /**
   * Get API key configuration instructions
   */
  getAPIKeyInstructions(platform: string): string {
    const instructions: Record<string, string> = {
      steam: `
# Steam API Key

1. Go to https://steamcommunity.com/dev/apikey
2. Sign in with your Steam account
3. Enter your domain name (or localhost for testing)
4. Copy your API key
5. Paste it in the configuration below

Note: Steam API is free but has rate limits.
      `,
      riot: `
# Riot Games API Key

1. Go to https://developer.riotgames.com/
2. Sign in with your Riot account
3. Register your application
4. Copy your API key (Development or Production)
5. Paste it in the configuration below

Note: Development keys expire every 24 hours.
Production keys require approval.
      `,
      epic: `
# Epic Games API Key

1. Go to https://dev.epicgames.com/
2. Create an Epic Games account
3. Register your application
4. Enable required services
5. Copy your Client ID and Secret
6. Paste them in the configuration below

Note: Requires Epic Games Developer account.
      `
    };

    return instructions[platform] || 'No instructions available';
  }

  /**
   * Validate API key
   */
  async validateAPIKey(platform: string, apiKey: string): Promise<boolean> {
    // In production, make a test API call to validate the key

    // Mock validation
    return apiKey.length > 10;
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): Array<{
    id: string;
    name: string;
    icon: string;
    supported: boolean;
    requiresKey: boolean;
  }> {
    return [
      {
        id: 'steam',
        name: 'Steam',
        icon: '🎮',
        supported: true,
        requiresKey: true
      },
      {
        id: 'riot',
        name: 'Riot Games',
        icon: '🎯',
        supported: true,
        requiresKey: true
      },
      {
        id: 'epic',
        name: 'Epic Games',
        icon: '🏆',
        supported: false,
        requiresKey: true
      },
      {
        id: 'blizzard',
        name: 'Blizzard',
        icon: '❄️',
        supported: false,
        requiresKey: true
      },
      {
        id: 'xbox',
        name: 'Xbox Live',
        icon: '🎮',
        supported: false,
        requiresKey: true
      },
      {
        id: 'playstation',
        name: 'PlayStation Network',
        icon: '🎮',
        supported: false,
        requiresKey: true
      }
    ];
  }
}
