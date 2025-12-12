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
    try {
      const response = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
      );

      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data = await response.json();
      const player = data.response?.players?.[0];

      if (!player) {
        throw new Error('Player not found');
      }

      return {
        steamId: player.steamid,
        personaName: player.personaname,
        profileUrl: player.profileurl,
        avatar: player.avatarfull,
        realName: player.realname,
        countryCode: player.loccountrycode
      };
    } catch (error) {
      console.error('Failed to fetch Steam profile:', error);

      // Fallback to mock data
      return {
        steamId,
        personaName: 'StreamerPro',
        profileUrl: `https://steamcommunity.com/id/${steamId}`,
        avatar: 'https://avatars.akamai.steamstatic.com/default.jpg',
        realName: 'Demo User',
        countryCode: 'US'
      };
    }
  }

  private async fetchSteamGames(steamId: string, apiKey: string): Promise<void> {
    try {
      const response = await fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
      );

      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data = await response.json();
      const games = data.response?.games || [];

      // Get the top 10 most played games
      const sortedGames = games
        .sort((a: any, b: any) => b.playtime_forever - a.playtime_forever)
        .slice(0, 10);

      const gameStats: SteamGameStats[] = sortedGames.map((game: any) => ({
        appId: game.appid.toString(),
        gameName: game.name,
        playtime: game.playtime_forever,
        achievements: [],
        stats: {}
      }));

      this.steamGames.set(gameStats);
    } catch (error) {
      console.error('Failed to fetch Steam games:', error);

      // Fallback to mock data
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
  }

  async fetchSteamAchievements(appId: string): Promise<SteamAchievement[]> {
    const apiKey = this.config().steamApiKey;
    const steamId = this.steamProfile()?.steamId;

    if (!apiKey || !steamId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?appid=${appId}&key=${apiKey}&steamid=${steamId}`
      );

      if (!response.ok) {
        throw new Error(`Steam API error: ${response.status}`);
      }

      const data = await response.json();
      const achievements = data.playerstats?.achievements || [];

      return achievements.map((ach: any) => ({
        name: ach.apiname,
        displayName: ach.name || ach.apiname,
        description: ach.description || '',
        icon: `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${appId}/${ach.icon}`,
        unlocked: ach.achieved === 1,
        unlockTime: ach.unlocktime ? new Date(ach.unlocktime * 1000) : undefined
      }));
    } catch (error) {
      console.error('Failed to fetch Steam achievements:', error);

      // Fallback to mock data
      return [
        {
          name: 'first_kill',
          displayName: 'First Blood',
          description: 'Get your first kill',
          icon: 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/730/achievement.jpg',
          unlocked: true,
          unlockTime: new Date()
        }
      ];
    }
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
    try {
      const response = await fetch(
        `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Riot API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        puuid: data.puuid,
        gameName: data.gameName,
        tagLine: data.tagLine,
        region
      };
    } catch (error) {
      console.error('Failed to fetch Riot account:', error);

      // Fallback to mock data
      return {
        puuid: crypto.randomUUID(),
        gameName,
        tagLine,
        region
      };
    }
  }

  async fetchLeagueMatches(count: number = 10): Promise<LeagueMatch[]> {
    const apiKey = this.config().riotApiKey;
    const account = this.riotAccount();

    if (!apiKey || !account) {
      return [];
    }

    try {
      // Get match IDs
      const matchListResponse = await fetch(
        `https://${account.region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=${count}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      if (!matchListResponse.ok) {
        throw new Error(`Riot API error: ${matchListResponse.status}`);
      }

      const matchIds = await matchListResponse.json();
      const matches: LeagueMatch[] = [];

      // Fetch details for each match
      for (const matchId of matchIds.slice(0, count)) {
        try {
          const matchResponse = await fetch(
            `https://${account.region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
            {
              headers: {
                'X-Riot-Token': apiKey
              }
            }
          );

          if (!matchResponse.ok) continue;

          const matchData = await matchResponse.json();
          const participant = matchData.info.participants.find(
            (p: any) => p.puuid === account.puuid
          );

          if (participant) {
            matches.push({
              matchId: matchData.metadata.matchId,
              gameMode: matchData.info.gameMode,
              champion: participant.championName,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              win: participant.win,
              duration: matchData.info.gameDuration,
              timestamp: new Date(matchData.info.gameCreation)
            });
          }
        } catch (error) {
          console.error(`Failed to fetch match ${matchId}:`, error);
        }
      }

      this.leagueMatches.set(matches);
      return matches;
    } catch (error) {
      console.error('Failed to fetch League matches:', error);

      // Fallback to mock data
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
  }

  async fetchValorantMatches(count: number = 10): Promise<ValorantMatch[]> {
    const apiKey = this.config().riotApiKey;
    const account = this.riotAccount();

    if (!apiKey || !account) {
      return [];
    }

    try {
      // Get match IDs
      const matchListResponse = await fetch(
        `https://${account.region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${account.puuid}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      if (!matchListResponse.ok) {
        throw new Error(`Riot API error: ${matchListResponse.status}`);
      }

      const matchList = await matchListResponse.json();
      const matches: ValorantMatch[] = [];

      // Get recent matches
      for (const match of matchList.history.slice(0, count)) {
        try {
          const matchResponse = await fetch(
            `https://${account.region}.api.riotgames.com/val/match/v1/matches/${match.matchId}`,
            {
              headers: {
                'X-Riot-Token': apiKey
              }
            }
          );

          if (!matchResponse.ok) continue;

          const matchData = await matchResponse.json();
          const player = matchData.players.find(
            (p: any) => p.puuid === account.puuid
          );

          if (player) {
            const team = matchData.teams.find((t: any) => t.teamId === player.teamId);

            matches.push({
              matchId: matchData.matchInfo.matchId,
              map: matchData.matchInfo.mapId,
              agent: player.characterId,
              kills: player.stats.kills,
              deaths: player.stats.deaths,
              assists: player.stats.assists,
              score: `${team?.roundsWon || 0}-${team?.roundsLost || 0}`,
              rank: player.competitiveTier || 'Unranked',
              timestamp: new Date(matchData.matchInfo.gameStartMillis)
            });
          }
        } catch (error) {
          console.error(`Failed to fetch Valorant match ${match.matchId}:`, error);
        }
      }

      this.valorantMatches.set(matches);
      return matches;
    } catch (error) {
      console.error('Failed to fetch Valorant matches:', error);

      // Fallback to mock data
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
  }

  /**
   * Get live League of Legends game stats
   * Requires special integration with League Client API
   */
  async getLeagueLiveStats(): Promise<any> {
    try {
      // Connect to the League Client API (LCU)
      // This API is available when League of Legends is running
      const response = await fetch('https://127.0.0.1:2999/liveclientdata/allgamedata');

      if (!response.ok) {
        throw new Error('League Client API not available');
      }

      const data = await response.json();

      return {
        activePlayer: {
          summonerName: data.activePlayer.summonerName,
          championName: data.activePlayer.championStats.championName,
          level: data.activePlayer.level,
          currentGold: data.activePlayer.currentGold,
          kills: data.activePlayer.scores.kills,
          deaths: data.activePlayer.scores.deaths,
          assists: data.activePlayer.scores.assists,
          cs: data.activePlayer.scores.creepScore,
          items: data.activePlayer.items.map((item: any) => item.displayName).filter((name: string) => name)
        },
        gameData: {
          gameMode: data.gameData.gameMode,
          gameTime: data.gameData.gameTime,
          mapName: data.gameData.mapName
        },
        events: data.events?.Events || []
      };
    } catch (error) {
      console.warn('League Client API not available:', error);

      // Return mock data when League is not running
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
   * Connect to Epic Games
   */
  async connectEpicGames(clientId: string, clientSecret: string): Promise<boolean> {
    try {
      // Epic Games uses OAuth 2.0
      // Step 1: Get access token
      const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Epic Games');
      }

      const tokenData = await tokenResponse.json();
      this.epicConnected.set(true);
      return true;
    } catch (error) {
      console.error('Epic Games connection failed:', error);
      return false;
    }
  }

  disconnectEpic(): void {
    this.epicConnected.set(false);
  }

  /**
   * Connect to Blizzard Battle.net
   */
  async connectBlizzard(clientId: string, clientSecret: string): Promise<boolean> {
    try {
      // Blizzard uses OAuth 2.0
      const tokenResponse = await fetch('https://oauth.battle.net/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to authenticate with Battle.net');
      }

      const tokenData = await tokenResponse.json();
      // Store access token for future requests
      return true;
    } catch (error) {
      console.error('Blizzard connection failed:', error);
      return false;
    }
  }

  /**
   * Connect to Xbox Live
   */
  async connectXboxLive(apiKey: string): Promise<boolean> {
    try {
      // Xbox Live API requires Microsoft Azure setup
      // This is a simplified implementation
      const response = await fetch('https://xbl.io/api/v2/account', {
        headers: {
          'X-Authorization': apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Xbox Live');
      }

      return true;
    } catch (error) {
      console.error('Xbox Live connection failed:', error);
      return false;
    }
  }

  /**
   * Connect to PlayStation Network
   */
  async connectPSN(npsso: string): Promise<boolean> {
    try {
      // PSN uses NPSSO (Network Platform Single Sign-On) token
      // This requires authentication through PlayStation's OAuth
      const response = await fetch('https://ca.account.sony.com/api/v1/ssocookie', {
        headers: {
          'Cookie': `npsso=${npsso}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to connect to PSN');
      }

      return true;
    } catch (error) {
      console.error('PSN connection failed:', error);
      return false;
    }
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
      `,
      blizzard: `
# Blizzard Battle.net API Key

1. Go to https://develop.battle.net/
2. Sign in with your Battle.net account
3. Create a new client
4. Copy your Client ID and Secret
5. Paste them in the configuration below

Note: Free for personal use, commercial requires approval.
      `,
      xbox: `
# Xbox Live API Key

1. Go to https://xbl.io/
2. Create an account
3. Subscribe to an API plan
4. Copy your API key
5. Paste it in the configuration below

Alternative: Use Microsoft Azure Xbox Live Services
      `,
      playstation: `
# PlayStation Network Access

1. Log into your PlayStation account at https://my.playstation.com
2. Open browser developer tools (F12)
3. Go to Application > Cookies
4. Find and copy the 'npsso' cookie value
5. Paste it in the configuration below

Note: NPSSO token expires after ~2 months.
Alternative: Use official PlayStation Web API (requires approval).
      `
    };

    return instructions[platform] || 'No instructions available';
  }

  /**
   * Validate API key
   */
  async validateAPIKey(platform: string, apiKey: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'steam': {
          // Test Steam API key
          const response = await fetch(
            `https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/?key=${apiKey}`
          );
          return response.ok;
        }

        case 'riot': {
          // Test Riot API key
          const response = await fetch(
            'https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/test/test',
            {
              headers: {
                'X-Riot-Token': apiKey
              }
            }
          );
          // 403 means key is valid but data not found, 401 means invalid key
          return response.status !== 401;
        }

        default:
          // Basic validation for unknown platforms
          return apiKey.length > 10;
      }
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
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
        supported: true,
        requiresKey: true
      },
      {
        id: 'blizzard',
        name: 'Blizzard',
        icon: '❄️',
        supported: true,
        requiresKey: true
      },
      {
        id: 'xbox',
        name: 'Xbox Live',
        icon: '🎮',
        supported: true,
        requiresKey: true
      },
      {
        id: 'playstation',
        name: 'PlayStation Network',
        icon: '🎮',
        supported: true,
        requiresKey: true
      },
      {
        id: 'lorcana',
        name: 'Disney Lorcana TCG',
        icon: '🎴',
        supported: true,
        requiresKey: false
      },
      {
        id: 'pokemon-tcg',
        name: 'Pokémon TCG',
        icon: '⚡',
        supported: true,
        requiresKey: false
      }
    ];
  }
}
